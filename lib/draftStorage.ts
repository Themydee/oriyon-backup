/**
 * Helper utility for persisting and recovering form drafts in localStorage.
 */

export interface FormDraft<T = Record<string, any>> {
  updatedAt: string;
  step?: number;
  data: T;
}

export function saveDraft<T>(key: string, data: T, step?: number): void {
  if (typeof window === "undefined") return;
  try {
    const draft: FormDraft<T> = {
      updatedAt: new Date().toISOString(),
      step,
      data,
    };
    localStorage.setItem(key, JSON.stringify(draft));
  } catch (err) {
    console.error("Failed to save draft to localStorage:", err);
  }
}

export function getDraft<T>(key: string): FormDraft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as FormDraft<T>;
  } catch (err) {
    console.error("Failed to parse draft from localStorage:", err);
    return null;
  }
}

export function clearDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Failed to clear draft from localStorage:", err);
  }
}
