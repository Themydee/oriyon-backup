// lib/practicalData.ts
import { authFetch } from "@/lib/api";

export interface PracticalCode {
  id: string;
  cohortId: string;
  groupId: string;
  weekNumber: number;
  code: string;
  validDate: string;
  createdAt: string;
  createdBy?: string;
}

export interface PracticalCheckin {
  id: string;
  cohortId: string;
  groupId: string;
  userId: string;
  weekNumber: number;
  codeSubmitted: string;
  checkedInAt: string;
  verifiedBy?: string;
}

export interface GroupPracticalInfo {
  groupId: string;
  groupName: string;
  practicalDay: string; // e.g. "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
}

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Normalizes a code string to uppercase alphanumeric with single dashes.
 */
export function normalizePracticalCode(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/gi, "")
    .replace(/-+/g, "-")
    .toUpperCase();
}

/**
 * Generates a 60-second rolling 6-digit TOTP code for a student's weekly practical session.
 * Refreshes every 60 seconds to prevent code sharing via WhatsApp or screenshots.
 */
export function generateRollingTOTP(
  userId: string,
  cohortId: string,
  groupId: string,
  weekNumber: number,
  offsetMinutes = 0
): { code: string; secondsRemaining: number } {
  const windowStep = Math.floor(Date.now() / 60000) + offsetMinutes;
  const secondsRemaining = 60 - (Math.floor(Date.now() / 1000) % 60);

  const seed = `${userId || "user"}-${cohortId || "cohort"}-${groupId || "group"}-W${weekNumber}-${windowStep}-ORIYON-SECURE-KEY`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);
  const sixDigit = (100000 + (positiveHash % 900000)).toString();

  return {
    code: `${sixDigit.slice(0, 3)}-${sixDigit.slice(3)}`,
    secondsRemaining,
  };
}

/**
 * Verifies a submitted 6-digit rolling code against current time, -1 min window, and +1 min window.
 */
export function verifyRollingTOTP(
  codeInput: string,
  userId: string,
  cohortId: string,
  groupId: string,
  weekNumber: number
): boolean {
  const normInput = codeInput.replace(/[^0-9]/g, "");
  if (normInput.length !== 6) return false;

  for (const offset of [0, -1, 1]) {
    const { code } = generateRollingTOTP(userId, cohortId, groupId, weekNumber, offset);
    if (code.replace(/[^0-9]/g, "") === normInput) {
      return true;
    }
  }

  return false;
}

/**
 * Generates a unique attendance code for a specific user and week.
 * Deterministic (same code generated on both trainee side and admin side).
 * Changes every week for each individual user.
 * Format: PRAC-W{week}-{p1}-{p2} e.g. PRAC-W1-7B3K-9M2F
 */
export function generateUserUniquePracticalCode(
  userId: string,
  weekNumber: number,
  userEmail = ""
): string {
  const seed = `ORIYON-PRAC-CODE-V3-${userId || "id"}-${(userEmail || "").toLowerCase().trim()}-W${weekNumber}-SALT`;
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
    hash2 = (hash2 << 3) ^ char;
  }

  const p1 = Math.abs(hash1).toString(36).toUpperCase().padStart(4, "7").slice(0, 4);
  const p2 = Math.abs(hash2).toString(36).toUpperCase().padStart(4, "9").slice(0, 4);
  return `PRAC-W${weekNumber}-${p1}-${p2}`;
}

/**
 * Deterministically generates or retrieves a practical code for a cohort, group, and week.
 */
export function generateGroupPracticalCode(
  cohortId: string,
  groupId: string,
  weekNumber: number
): string {
  const seedString = `${cohortId}-${groupId}-W${weekNumber}-ORIYON-SALT`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString(36).toUpperCase().padStart(4, "X");
  const gShort = groupId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "GRP1";
  return `PRAC-W${weekNumber}-${gShort}-${positiveHash.slice(0, 4)}`;
}

/**
 * Gets today's day name (e.g. "Monday", "Tuesday").
 */
export function getTodayDayName(): string {
  const dayIndex = new Date().getDay();
  return DAYS_OF_WEEK[dayIndex];
}

/**
 * Checks if today matches the group's practical day.
 */
export function isTodayGroupPracticalDay(practicalDay?: string): boolean {
  if (!practicalDay) return false;
  const today = getTodayDayName().toLowerCase();
  return practicalDay.trim().toLowerCase() === today;
}

// ─── Local Storage Handlers (Fallback & Client Caching) ─────────────────────

const STORAGE_CODES_KEY = "oriyon_practical_codes_v1";
const STORAGE_CHECKINS_KEY = "oriyon_practical_checkins_v1";

export function getStoredPracticalCodes(): PracticalCode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_CODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredPracticalCode(code: PracticalCode): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredPracticalCodes();
    const updated = [code, ...existing.filter((c) => c.id !== code.id)];
    localStorage.setItem(STORAGE_CODES_KEY, JSON.stringify(updated));
  } catch {}
}

export function getStoredPracticalCheckins(): PracticalCheckin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_CHECKINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredPracticalCheckin(checkin: PracticalCheckin): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredPracticalCheckins();
    const updated = [checkin, ...existing.filter((c) => c.id !== checkin.id)];
    localStorage.setItem(STORAGE_CHECKINS_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearStoredPracticalCheckins(cohortId?: string, weekNumber?: number, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredPracticalCheckins();
    const updated = existing.filter((c) => {
      if (cohortId && c.cohortId !== cohortId) return true;
      if (weekNumber !== undefined && Number(c.weekNumber) !== Number(weekNumber)) return true;
      if (userId && c.userId !== userId) return true;
      return false;
    });
    localStorage.setItem(STORAGE_CHECKINS_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Gets checked-in week numbers for a trainee.
 */
export function getUserPracticalCheckinWeeks(userId: string): number[] {
  const checkins = getStoredPracticalCheckins();
  return checkins.filter((c) => c.userId === userId).map((c) => c.weekNumber);
}

/**
 * Verifies whether a student has completed practical attendance for a given week.
 */
export function isPracticalWeekCompleted(userId: string, weekNumber: number): boolean {
  const weeks = getUserPracticalCheckinWeeks(userId);
  return weeks.includes(weekNumber);
}

/**
 * Fetches verified practical checkins for a user from the backend database
 * and syncs them to client localStorage.
 */
export async function fetchAndSyncUserPracticalCheckins(userId: string): Promise<PracticalCheckin[]> {
  if (!userId) return getStoredPracticalCheckins();
  try {
    const res = await authFetch(`/lms/practical/checkins/user/${userId}`);
    if (res.ok) {
      const serverCheckins = await res.json();
      const list: PracticalCheckin[] = Array.isArray(serverCheckins)
        ? serverCheckins
        : Array.isArray(serverCheckins?.checkins)
        ? serverCheckins.checkins
        : [];
      if (list.length > 0) {
        list.forEach((c) => saveStoredPracticalCheckin(c));
      }
      return list;
    }
  } catch (err) {
    console.warn("Failed to sync user practical checkins from server", err);
  }
  return getStoredPracticalCheckins().filter((c) => c.userId === userId);
}

