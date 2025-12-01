import type { CreateStudyPlanCommand, StudyPlanDetailsDto, UpdateStudyPlanCommand } from "@/types";

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Creates a new study plan
 * @param command - The command with title and source material
 * @returns The created study plan details
 * @throws APIError on validation errors, conflicts, or server errors
 */
export async function createStudyPlan(command: CreateStudyPlanCommand): Promise<StudyPlanDetailsDto> {
  try {
    const response = await fetch("/api/study-plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.error.code, error.error.message, error.error.details);
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new APIError("NETWORK_ERROR", "Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.");
    }

    console.error("Unexpected error during plan creation:", error);
    throw new APIError("UNEXPECTED_ERROR", "Wystąpił nieoczekiwany błąd");
  }
}

/**
 * Deletes a study plan by ID.
 * @throws APIError on validation, auth, or server errors.
 */
export async function deleteStudyPlan(planId: string): Promise<void> {
  try {
    const response = await fetch(`/api/study-plans/${encodeURIComponent(planId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.error.code, error.error.message, error.error.details);
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new APIError("NETWORK_ERROR", "Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.");
    }

    console.error("Unexpected error during plan deletion:", error);
    throw new APIError("UNEXPECTED_ERROR", "Wystąpił nieoczekiwany błąd");
  }
}

/**
 * Partially updates a study plan (e.g., status archive/unarchive).
 * @throws APIError on validation, auth, or server errors.
 */
export async function updateStudyPlan(planId: string, command: UpdateStudyPlanCommand): Promise<StudyPlanDetailsDto> {
  try {
    const response = await fetch(`/api/study-plans/${encodeURIComponent(planId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error.error.code, error.error.message, error.error.details);
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new APIError("NETWORK_ERROR", "Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.");
    }

    console.error("Unexpected error during plan update:", error);
    throw new APIError("UNEXPECTED_ERROR", "Wystąpił nieoczekiwany błąd");
  }
}

