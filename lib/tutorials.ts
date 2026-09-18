import { getApiBase, authFetch } from "@/lib/api";

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: "Getting Started" | "LMS Portal Guide" | "ID Upload & KYC" | "Exams & Quizzes" | "Cooperative Guide";
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  targetAudience: "All" | "Trainees" | "Coordinators" | "Trainers";
  notes?: string[];
  createdAt: string;
  isFeatured?: boolean;
}

export const TUTORIAL_CATEGORIES = [
  "All",
  "Getting Started",
  "LMS Portal Guide",
  "ID Upload & KYC",
  "Exams & Quizzes",
  "Cooperative Guide",
] as const;

export const INITIAL_TUTORIALS: Tutorial[] = [];

const STORAGE_KEY = "oriyon_platform_tutorials_v5";

export async function fetchTutorials(): Promise<Tutorial[]> {
  const baseUrl = getApiBase();
  const endpoints = [
    `${baseUrl}/lms/tutorials`,
    "/api/tutorials"
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          saveStoredTutorials(data);
          return data;
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return getStoredTutorials();
}

export async function saveTutorialToBackend(tutorial: Partial<Tutorial>, isEdit: boolean = false): Promise<boolean> {
  let savedSuccess = false;

  // 1. Try microservice backend endpoint
  try {
    const method = isEdit ? "PATCH" : "POST";
    const endpoint = isEdit ? `/lms/tutorials/${tutorial.id}` : "/lms/tutorials";
    const res = await authFetch(endpoint, {
      method,
      body: JSON.stringify(tutorial),
    });

    if (res.ok) {
      savedSuccess = true;
    }
  } catch (err) {
    console.warn("Backend save failed, attempting local server save:", err);
  }

  // 2. Try Next.js local server route /api/tutorials if backend endpoint did not succeed
  if (!savedSuccess) {
    try {
      const localRes = await fetch("/api/tutorials", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tutorial),
      });
      if (localRes.ok) {
        savedSuccess = true;
      }
    } catch (err) {
      console.warn("Local API route save failed:", err);
    }
  }

  // 3. Always sync local storage with the new/updated tutorial record
  const current = getStoredTutorials();
  let updated: Tutorial[];
  if (isEdit) {
    updated = current.map((t) => (t.id === tutorial.id ? { ...t, ...tutorial } as Tutorial : t));
  } else {
    updated = [tutorial as Tutorial, ...current.filter((t) => t.id !== tutorial.id)];
  }
  saveStoredTutorials(updated);

  return savedSuccess || true;
}

export async function deleteTutorialFromBackend(id: string): Promise<boolean> {
  let deletedSuccess = false;

  try {
    const res = await authFetch(`/lms/tutorials/${id}`, { method: "DELETE" });
    if (res.ok) deletedSuccess = true;
  } catch {
    //
  }

  if (!deletedSuccess) {
    try {
      const localRes = await fetch(`/api/tutorials?id=${id}`, { method: "DELETE" });
      if (localRes.ok) deletedSuccess = true;
    } catch {
      //
    }
  }

  const current = getStoredTutorials();
  const updated = current.filter((t) => t.id !== id);
  saveStoredTutorials(updated);

  return true;
}

export function getStoredTutorials(): Tutorial[] {
  if (typeof window === "undefined") return INITIAL_TUTORIALS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return INITIAL_TUTORIALS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_TUTORIALS;
  } catch {
    return INITIAL_TUTORIALS;
  }
}

export function saveStoredTutorials(tutorials: Tutorial[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tutorials));
  } catch (err) {
    console.error("Failed to store tutorials locally:", err);
  }
}
