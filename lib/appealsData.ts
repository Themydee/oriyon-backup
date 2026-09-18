// lib/appealsData.ts

export type AppealType = "exam_score" | "week12_attendance";
export type AppealStatus = "pending" | "approved" | "rejected";

export interface AppealRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  cohortId?: string;
  appealType: AppealType;
  sessionId?: string;       // For exam score appeals
  score?: number | null;     // For exam score appeals
  daysAttended?: number;     // For week 12 attendance appeals (must be 4 out of 5)
  reason: string;            // Trainee's ground reasons
  status: AppealStatus;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const STORAGE_APPEALS_KEY = "oriyon_appeals_v1";

/**
 * Gets all stored appeals (from local storage / state fallback).
 */
export function getStoredAppeals(): AppealRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_APPEALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new appeal.
 */
export function saveStoredAppeal(appeal: AppealRecord): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredAppeals();
    const updated = [appeal, ...existing.filter((a) => a.id !== appeal.id)];
    localStorage.setItem(STORAGE_APPEALS_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Updates an appeal's status and admin notes.
 */
export function updateStoredAppealStatus(
  appealId: string,
  status: AppealStatus,
  adminNotes?: string,
  reviewedBy?: string
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredAppeals();
    const updated = existing.map((a) => {
      if (a.id === appealId) {
        return {
          ...a,
          status,
          adminNotes: adminNotes || a.adminNotes,
          reviewedAt: new Date().toISOString(),
          reviewedBy: reviewedBy || a.reviewedBy,
        };
      }
      return a;
    });
    localStorage.setItem(STORAGE_APPEALS_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Gets appeals for a specific user.
 */
export function getUserAppeals(userId: string): AppealRecord[] {
  return getStoredAppeals().filter((a) => a.userId === userId);
}

/**
 * Rule: Trainees who attended EXACTLY 4 out of 5 days in Week 12 (missed 1 day) are eligible to appeal.
 * Trainees with <= 3 days attended (missed 2+ days) are NOT eligible.
 */
export function canAppealWeek12Attendance(daysAttended: number): boolean {
  return daysAttended === 4;
}

/**
 * Rule: Check if a trainee is eligible to appeal an exam score (< 70%).
 */
export function canAppealExamScore(score: number | null): boolean {
  if (score === null) return true;
  return score < 70;
}

/**
 * Rule: Check if a Week 12 attendance appeal has been approved for a user.
 */
export function isWeek12AttendanceAppealApproved(userId: string): boolean {
  const appeals = getUserAppeals(userId);
  return appeals.some((a) => a.appealType === "week12_attendance" && a.status === "approved");
}

/**
 * Rule: Check if an Exam score appeal has been approved for a session or user.
 */
export function isExamScoreAppealApproved(userId: string, sessionId?: string): boolean {
  const appeals = getUserAppeals(userId);
  return appeals.some((a) =>
    a.appealType === "exam_score" &&
    a.status === "approved" &&
    (!sessionId || a.sessionId === sessionId)
  );
}
