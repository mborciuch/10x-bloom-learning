import type { Tables } from "@/db/database.types";
import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CompleteReviewSessionCommand,
  CreateReviewSessionCommand,
  Paginated,
  ReviewSessionDto,
  ReviewSessionFeedbackDto,
  ReviewStatus,
  SubmitReviewSessionFeedbackCommand,
  TaxonomyLevel,
  UpdateReviewSessionCommand,
} from "@/types";
import { mapToReviewSessionDto } from "@/lib/mappers/review-session.mapper";
import { mapToReviewSessionFeedbackDto } from "@/lib/mappers/review-session-feedback.mapper";
import { ApiError } from "@/lib/utils/error-handler";

type ReviewSessionSortField = "review_date";
type ReviewSessionSortOrder = "asc" | "desc";
type ReviewSessionRow = Tables<"review_sessions">;
type ReviewSessionFeedbackRow = Tables<"review_session_feedback">;
type StudyPlanRow = Tables<"study_plans">;
type ExerciseTemplateRow = Tables<"exercise_templates">;

export interface ManualReviewSessionPreconditions {
  studyPlan: Pick<StudyPlanRow, "id" | "user_id">;
  exerciseTemplate?: Pick<ExerciseTemplateRow, "id" | "name" | "default_taxonomy_level">;
}

export interface ListReviewSessionsOptions {
  studyPlanId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: ReviewStatus;
  isCompleted?: boolean;
  taxonomyLevel?: TaxonomyLevel;
  isAiGenerated?: boolean;
  page: number;
  pageSize: number;
  sort: ReviewSessionSortField;
  sortOrder: ReviewSessionSortOrder;
}

type ReviewSessionListFilters = Omit<ListReviewSessionsOptions, "page" | "pageSize" | "sort" | "sortOrder">;

interface ReviewSessionMetadata {
  edited?: boolean;
  editedAt?: string;
}

const DEFAULT_METADATA: ReviewSessionMetadata = {
  edited: false,
};

function cloneDefaultMetadata(): ReviewSessionMetadata {
  return { ...DEFAULT_METADATA };
}

function parseReviewSessionMetadata(raw: unknown): ReviewSessionMetadata {
  if (!raw) {
    return cloneDefaultMetadata();
  }

  if (typeof raw === "string") {
    try {
      return parseReviewSessionMetadata(JSON.parse(raw));
    } catch {
      return cloneDefaultMetadata();
    }
  }

  if (typeof raw !== "object") {
    return cloneDefaultMetadata();
  }

  return {
    ...cloneDefaultMetadata(),
    ...(raw as ReviewSessionMetadata),
  };
}

/**
 * Step 1: Complex query builder with advanced filters (see implementation plan).
 * Extracted into a helper to keep the list method focused on pagination/output.
 */
function buildReviewSessionListQuery(supabase: SupabaseClient, userId: string, filters: ReviewSessionListFilters) {
  let query = supabase.from("review_sessions").select("*", { count: "exact" }).eq("user_id", userId);

  if (filters.studyPlanId) {
    query = query.eq("study_plan_id", filters.studyPlanId);
  }

  if (filters.dateFrom) {
    query = query.gte("review_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("review_date", filters.dateTo);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (typeof filters.isCompleted === "boolean") {
    query = query.eq("is_completed", filters.isCompleted);
  }

  if (filters.taxonomyLevel) {
    query = query.eq("taxonomy_level", filters.taxonomyLevel);
  }

  if (typeof filters.isAiGenerated === "boolean") {
    query = query.eq("is_ai_generated", filters.isAiGenerated);
  }

  return query;
}

export class ReviewSessionService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Validates the preconditions for creating a manual review session.
   * Ensures the study plan belongs to the user and validates optional template reference.
   */
  async assertManualCreatePreconditions(
    userId: string,
    command: CreateReviewSessionCommand
  ): Promise<ManualReviewSessionPreconditions> {
    const studyPlan = await this.ensureStudyPlanOwnership(userId, command.studyPlanId);

    let exerciseTemplate: ManualReviewSessionPreconditions["exerciseTemplate"];
    if (command.exerciseTemplateId) {
      exerciseTemplate = await this.ensureExerciseTemplateExists(command.exerciseTemplateId);
    }

    return {
      studyPlan,
      exerciseTemplate,
    };
  }

  /**
   * Creates a manual review session with enforced defaults (accepted status, manual flag).
   */
  async createManual(userId: string, command: CreateReviewSessionCommand): Promise<ReviewSessionDto> {
    const preconditions = await this.assertManualCreatePreconditions(userId, command);

    const hasCustomLabel = command.exerciseLabel.trim().length > 0;
    const exerciseLabel = hasCustomLabel
      ? command.exerciseLabel
      : (preconditions.exerciseTemplate?.name ?? "Manual review session");

    const contentPayload = JSON.stringify(command.content);
    const timestamp = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("review_sessions")
      .insert({
        study_plan_id: command.studyPlanId,
        user_id: userId,
        exercise_template_id: command.exerciseTemplateId ?? null,
        exercise_label: exerciseLabel,
        review_date: command.reviewDate,
        taxonomy_level: command.taxonomyLevel,
        status: "accepted",
        status_changed_at: timestamp,
        is_ai_generated: false,
        is_completed: false,
        content: contentPayload,
        metadata: cloneDefaultMetadata(),
        notes: command.notes ?? null,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapToReviewSessionDto(data as ReviewSessionRow);
  }

  /**
   * List review sessions for a given user with advanced filtering and pagination.
   *
   * This powers the calendar view and other list screens.
   */
  async list(userId: string, options: ListReviewSessionsOptions): Promise<Paginated<ReviewSessionDto>> {
    const { page, pageSize, sort, sortOrder, ...filters } = options;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const baseQuery = buildReviewSessionListQuery(this.supabase, userId, filters);
    const { data, count, error } = await baseQuery.order(sort, { ascending: sortOrder === "asc" }).range(from, to);

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as ReviewSessionRow[];

    return {
      items: rows.map((row) => mapToReviewSessionDto(row)),
      page,
      pageSize,
      total: count ?? rows.length,
    };
  }

  /**
   * Fetch a single review session that belongs to the given user.
   */
  async getById(userId: string, sessionId: string): Promise<ReviewSessionDto> {
    const row = await this.fetchSessionRow(userId, sessionId);
    return mapToReviewSessionDto(row);
  }

  /**
   * Partially updates a review session with guardrails around ownership and status transitions.
   */
  async update(userId: string, sessionId: string, command: UpdateReviewSessionCommand): Promise<ReviewSessionDto> {
    const existingRow = await this.fetchSessionRow(userId, sessionId);

    const updates: Record<string, unknown> = {};

    if (command.reviewDate) {
      updates.review_date = command.reviewDate;
    }

    if (typeof command.notes !== "undefined") {
      updates.notes = command.notes ?? null;
    }

    if (typeof command.exerciseTemplateId !== "undefined") {
      if (command.exerciseTemplateId) {
        await this.ensureExerciseTemplateExists(command.exerciseTemplateId);
        updates.exercise_template_id = command.exerciseTemplateId;
      } else {
        updates.exercise_template_id = null;
      }
    }

    if (command.exerciseLabel) {
      updates.exercise_label = command.exerciseLabel;
    }

    if (command.taxonomyLevel) {
      updates.taxonomy_level = command.taxonomyLevel;
    }

    if (command.content) {
      updates.content = JSON.stringify(command.content);
    }

    if (command.status) {
      this.assertStatusTransition(existingRow.status, command.status);
      updates.status = command.status;
      updates.status_changed_at = new Date().toISOString();
    }

    if (this.shouldMarkSessionEdited(existingRow, command)) {
      const currentMetadata = parseReviewSessionMetadata(existingRow.metadata);
      if (!currentMetadata.edited) {
        updates.metadata = {
          ...currentMetadata,
          edited: true,
          editedAt: new Date().toISOString(),
        };
      }
    }

    const { data, error } = await this.supabase
      .from("review_sessions")
      .update(updates)
      .eq("user_id", userId)
      .eq("id", sessionId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapToReviewSessionDto(data as ReviewSessionRow);
  }

  async complete(userId: string, sessionId: string, command: CompleteReviewSessionCommand): Promise<ReviewSessionDto> {
    const existing = await this.getById(userId, sessionId);

    if (existing.isCompleted) {
      throw new ApiError("SESSION_ALREADY_COMPLETED", "Review session is already completed", 409);
    }

    const completionTimestamp = command.completedAt
      ? new Date(command.completedAt).toISOString()
      : new Date().toISOString();

    const { data, error } = await this.supabase
      .from("review_sessions")
      .update({
        is_completed: true,
        completed_at: completionTimestamp,
      })
      .eq("user_id", userId)
      .eq("id", sessionId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapToReviewSessionDto(data as ReviewSessionRow);
  }

  async submitFeedback(
    userId: string,
    sessionId: string,
    command: SubmitReviewSessionFeedbackCommand
  ): Promise<ReviewSessionFeedbackDto> {
    const session = await this.getById(userId, sessionId);

    if (!session.isCompleted) {
      throw new ApiError("SESSION_NOT_COMPLETED", "Review session must be completed before submitting feedback", 409);
    }

    const { data: existing, error: existingError } = await this.supabase
      .from("review_session_feedback")
      .select("id")
      .eq("review_session_id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      throw new ApiError("FEEDBACK_ALREADY_SUBMITTED", "You have already submitted feedback for this session", 409);
    }

    const trimmedComment = command.comment?.trim();
    const sanitizedComment = trimmedComment && trimmedComment.length > 0 ? trimmedComment : null;

    const { data, error } = await this.supabase
      .from("review_session_feedback")
      .insert({
        review_session_id: sessionId,
        user_id: userId,
        rating: command.rating,
        comment: sanitizedComment,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapToReviewSessionFeedbackDto(data as ReviewSessionFeedbackRow);
  }

  private async fetchSessionRow(userId: string, sessionId: string): Promise<ReviewSessionRow> {
    const { data, error } = await this.supabase
      .from("review_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ApiError("NOT_FOUND", "Review session not found", 404);
    }

    return data as ReviewSessionRow;
  }

  private shouldMarkSessionEdited(existing: ReviewSessionRow, command: UpdateReviewSessionCommand): boolean {
    if (!existing.is_ai_generated) {
      return false;
    }

    return typeof command.content !== "undefined";
  }

  private async ensureStudyPlanOwnership(
    userId: string,
    studyPlanId: string
  ): Promise<ManualReviewSessionPreconditions["studyPlan"]> {
    const { data, error } = await this.supabase
      .from("study_plans")
      .select("id, user_id")
      .eq("id", studyPlanId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ApiError("NOT_FOUND", "Study plan not found", 404);
    }

    if (data.user_id !== userId) {
      throw new ApiError("PLAN_OWNERSHIP_MISMATCH", "Study plan does not belong to the current user", 409);
    }

    return data;
  }

  async delete(userId: string, sessionId: string): Promise<void> {
    const existing = await this.getById(userId, sessionId);

    if (existing.isAiGenerated) {
      throw new ApiError("DELETE_NOT_ALLOWED", "Cannot delete AI-generated sessions finalized by the system", 409);
    }

    const { error } = await this.supabase.from("review_sessions").delete().eq("user_id", userId).eq("id", sessionId);

    if (error) {
      throw error;
    }
  }

  private async ensureExerciseTemplateExists(
    exerciseTemplateId: string
  ): Promise<NonNullable<ManualReviewSessionPreconditions["exerciseTemplate"]>> {
    const { data, error } = await this.supabase
      .from("exercise_templates")
      .select("id, name, default_taxonomy_level")
      .eq("id", exerciseTemplateId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ApiError("NOT_FOUND", "Exercise template not found", 404);
    }

    return data;
  }

  private assertStatusTransition(current: ReviewStatus, next: ReviewStatus) {
    if (current === next) {
      return;
    }

    const allowedTransitions: Record<ReviewStatus, ReviewStatus[]> = {
      proposed: ["accepted", "rejected"],
      accepted: ["rejected"],
      rejected: ["accepted"],
    };

    const allowedNext = allowedTransitions[current] ?? [];
    if (!allowedNext.includes(next)) {
      throw new ApiError(
        "INVALID_STATUS_TRANSITION",
        `Cannot transition review session from ${current} to ${next}`,
        400
      );
    }
  }
}
