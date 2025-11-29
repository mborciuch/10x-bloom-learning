import { useEffect } from "react";

export interface StudyPlanDraft {
  title: string;
  sourceMaterial: string;
  lastSaved: string; // ISO timestamp
}

/**
 * Custom hook that automatically saves form draft to localStorage
 * @param formData - The form data to save
 * @param isDirty - Whether the form has been modified
 * @param interval - The auto-save interval in milliseconds (default: 5000ms)
 */
export function useAutoSaveDraft(
  formData: { title: string; sourceMaterial: string },
  isDirty: boolean,
  interval = 5000
): void {
  useEffect(() => {
    if (!isDirty) return;

    const timeoutId = setTimeout(() => {
      const draft: StudyPlanDraft = {
        ...formData,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem("study-plan-draft", JSON.stringify(draft));
    }, interval);

    return () => clearTimeout(timeoutId);
  }, [formData, isDirty, interval]);
}
