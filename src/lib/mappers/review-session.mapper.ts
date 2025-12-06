import type { Tables } from "@/db/database.types";
import type { ReviewSessionContentDto, ReviewSessionDto } from "@/types";
import { ApiError } from "@/lib/utils/error-handler";

type ReviewSessionRow = Tables<"review_sessions">;

function parseReviewSessionContent(raw: unknown, sessionId: string): ReviewSessionContentDto {
  const parsed = typeof raw === "string" ? safeJsonParse(raw, sessionId) : raw;

  if (!parsed || typeof parsed !== "object") {
    throw new ApiError(
      "DATA_INTEGRITY_ERROR",
      `Invalid content for review session ${sessionId}: expected JSON object`,
      500
    );
  }

  const content = parsed as {
    questions?: unknown;
    answers?: unknown;
    hints?: unknown;
  };

  if (!Array.isArray(content.questions) || !Array.isArray(content.answers)) {
    throw new ApiError(
      "DATA_INTEGRITY_ERROR",
      `Invalid content for review session ${sessionId}: questions and answers must be arrays`,
      500
    );
  }

  const questions = content.questions.map((q) => String(q));
  const answers = content.answers.map((a) => String(a));

  if (questions.length !== answers.length) {
    throw new ApiError(
      "DATA_INTEGRITY_ERROR",
      `Invalid content for review session ${sessionId}: questions and answers length mismatch`,
      500
    );
  }

  let hints: string[] | undefined;
  if (Array.isArray(content.hints)) {
    hints = content.hints.map((h) => String(h));

    if (hints.length && hints.length !== questions.length) {
      throw new ApiError(
        "DATA_INTEGRITY_ERROR",
        `Invalid content for review session ${sessionId}: hints length mismatch`,
        500
      );
    }
  }

  return {
    questions,
    answers,
    hints,
  };
}

function safeJsonParse(content: string, sessionId: string) {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new ApiError(
      "DATA_INTEGRITY_ERROR",
      `Invalid JSON content for review session ${sessionId}`,
      500,
      error
    );
  }
}

export function mapToReviewSessionDto(row: ReviewSessionRow): ReviewSessionDto {
  const content = parseReviewSessionContent(row.content, row.id);

  return {
    id: row.id,
    studyPlanId: row.study_plan_id,
    exerciseTemplateId: row.exercise_template_id,
    exerciseLabel: row.exercise_label,
    reviewDate: row.review_date,
    taxonomyLevel: row.taxonomy_level,
    status: row.status,
    isAiGenerated: row.is_ai_generated,
    isCompleted: row.is_completed,
    content,
    notes: row.notes,
    statusChangedAt: row.status_changed_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
