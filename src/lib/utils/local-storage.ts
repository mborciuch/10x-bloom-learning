import type { StudyPlanDraft } from "../hooks/useAutoSaveDraft";

const DRAFT_KEY = "study-plan-draft";
const DRAFT_EXPIRY_HOURS = 24;

/**
 * Loads a draft from localStorage
 * @returns The draft or null if not found or expired
 */
export function loadDraft(): StudyPlanDraft | null {
  try {
    const draftJson = localStorage.getItem(DRAFT_KEY);
    if (!draftJson) return null;

    const draft: StudyPlanDraft = JSON.parse(draftJson);

    // Check if draft is expired (older than 24 hours)
    const lastSaved = new Date(draft.lastSaved);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > DRAFT_EXPIRY_HOURS) {
      clearDraft();
      return null;
    }

    return draft;
  } catch (error) {
    console.error("Error loading draft:", error);
    return null;
  }
}

/**
 * Saves a draft to localStorage
 * @param draft - The draft to save
 */
export function saveDraft(draft: StudyPlanDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error("Error saving draft:", error);
  }
}

/**
 * Clears the draft from localStorage
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.error("Error clearing draft:", error);
  }
}
