import { useEffect } from "react";

/**
 * Custom hook that warns user before leaving page with unsaved changes
 * @param isDirty - Whether there are unsaved changes
 */
export function useUnsavedChangesWarning(isDirty: boolean): void {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);
}
