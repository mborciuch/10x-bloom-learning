import type { Tables } from "@/db/database.types";
import type { ReviewSessionFeedbackDto } from "@/types";
import { ApiError } from "@/lib/utils/error-handler";

type ReviewSessionFeedbackRow = Tables<"review_session_feedback">;

export function mapToReviewSessionFeedbackDto(row: ReviewSessionFeedbackRow): ReviewSessionFeedbackDto {
  if (row.rating === null) {
    throw new ApiError("DATA_INTEGRITY_ERROR", "Feedback rating cannot be null", 500);
  }

  return {
    id: row.id,
    reviewSessionId: row.review_session_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  };
}

