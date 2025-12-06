import type { Enums, Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================
// Base entity types extracted from database schema for reuse in DTOs

type StudyPlanRow = Tables<"study_plans">;
type StudyPlanInsert = TablesInsert<"study_plans">;
type StudyPlanUpdate = TablesUpdate<"study_plans">;

type ExerciseTemplateRow = Tables<"exercise_templates">;

type ReviewSessionRow = Tables<"review_sessions">;
type ReviewSessionInsert = TablesInsert<"review_sessions">;
type ReviewSessionUpdate = TablesUpdate<"review_sessions">;

type ReviewSessionFeedbackRow = Tables<"review_session_feedback">;
type ReviewSessionFeedbackInsert = TablesInsert<"review_session_feedback">;

// Database enums
type TaxonomyLevel = Enums<"taxonomy_level">;
type ReviewStatus = Enums<"review_status">;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic paginated response wrapper used across all list endpoints
 */
export interface Paginated<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
}

// ============================================================================
// STUDY PLANS
// ============================================================================

/**
 * Study plan list item DTO for GET /api/study-plans
 * Maps database fields to camelCase
 */
export interface StudyPlanListItemDto {
  id: StudyPlanRow["id"];
  title: StudyPlanRow["title"];
  sourceMaterial: StudyPlanRow["source_material"];
  wordCount: StudyPlanRow["word_count"];
  status: StudyPlanRow["status"];
  createdAt: StudyPlanRow["created_at"];
  updatedAt: StudyPlanRow["updated_at"];
}

/**
 * Study plan details DTO for GET /api/study-plans/{planId}
 * Extends list item with aggregated session counts
 */
export interface StudyPlanDetailsDto extends StudyPlanListItemDto {
  totalSessions: number;
  completedSessions: number;
}

/**
 * Command for POST /api/study-plans
 * All fields are required for creating a new study plan
 */
export interface CreateStudyPlanCommand {
  title: NonNullable<StudyPlanInsert["title"]>;
  sourceMaterial: NonNullable<StudyPlanInsert["source_material"]>;
}

/**
 * Command for PATCH /api/study-plans/{planId}
 * Partial updates allowed for title, source material, and status
 */
export type UpdateStudyPlanCommand = Partial<{
  title: StudyPlanUpdate["title"];
  sourceMaterial: StudyPlanUpdate["source_material"];
  status: StudyPlanUpdate["status"];
}>;

// ============================================================================
// EXERCISE TEMPLATES (PREDEFINED ONLY - READ-ONLY FOR USERS)
// ============================================================================

/**
 * Exercise template DTO for GET /api/exercise-templates
 * Represents predefined system templates (no user-created templates in MVP)
 * Templates are populated via seed data and managed by admins only
 */
export interface ExerciseTemplateDto {
  id: ExerciseTemplateRow["id"];
  name: ExerciseTemplateRow["name"];
  description: ExerciseTemplateRow["description"];
  defaultTaxonomyLevel: ExerciseTemplateRow["default_taxonomy_level"];
  metadata: ExerciseTemplateRow["metadata"];
  isActive: ExerciseTemplateRow["is_active"];
  createdAt: ExerciseTemplateRow["created_at"];
  updatedAt: ExerciseTemplateRow["updated_at"];
}

// ============================================================================
// AI GENERATION (SYNC ENDPOINT COMMAND)
// ============================================================================

/**
 * Command for POST /api/study-plans/{planId}/ai-generate
 * Initiates synchronous AI generation of review sessions
 */
export interface InitiateAiGenerationCommand {
  requestedCount: number;
  taxonomyLevels: TaxonomyLevel[];
  includePredefinedTemplateIds?: string[];
  modelName?: string;
}

// ============================================================================
// REVIEW SESSIONS
// ============================================================================

/**
 * Review session content structure stored in review_sessions.content JSON field
 * Contains the actual exercise questions, answers, and optional hints
 */
export interface ReviewSessionContentDto {
  questions: string[];
  answers: string[];
  hints?: string[];
}

/**
 * Review session DTO for GET /api/review-sessions
 * Complete representation of a review session with all metadata
 */
export interface ReviewSessionDto {
  id: ReviewSessionRow["id"];
  studyPlanId: ReviewSessionRow["study_plan_id"];
  exerciseTemplateId: ReviewSessionRow["exercise_template_id"];
  exerciseLabel: ReviewSessionRow["exercise_label"];
  reviewDate: ReviewSessionRow["review_date"];
  taxonomyLevel: ReviewSessionRow["taxonomy_level"];
  status: ReviewStatus;
  isAiGenerated: ReviewSessionRow["is_ai_generated"];
  isCompleted: ReviewSessionRow["is_completed"];
  content: ReviewSessionContentDto;
  notes: ReviewSessionRow["notes"];
  statusChangedAt: ReviewSessionRow["status_changed_at"];
  completedAt: ReviewSessionRow["completed_at"];
  createdAt: ReviewSessionRow["created_at"];
  updatedAt: ReviewSessionRow["updated_at"];
}

/**
 * Command for POST /api/review-sessions
 * Creates manual review session (isAiGenerated set to false by backend)
 */
export interface CreateReviewSessionCommand {
  studyPlanId: NonNullable<ReviewSessionInsert["study_plan_id"]>;
  exerciseTemplateId: ReviewSessionInsert["exercise_template_id"];
  exerciseLabel: NonNullable<ReviewSessionInsert["exercise_label"]>;
  reviewDate: NonNullable<ReviewSessionInsert["review_date"]>;
  taxonomyLevel: NonNullable<ReviewSessionInsert["taxonomy_level"]>;
  content: ReviewSessionContentDto;
  notes?: ReviewSessionInsert["notes"];
}

/**
 * Command for PATCH /api/review-sessions/{sessionId}
 * Allows partial updates of review session fields
 */
export type UpdateReviewSessionCommand = Partial<{
  reviewDate: ReviewSessionUpdate["review_date"];
  exerciseTemplateId: ReviewSessionUpdate["exercise_template_id"];
  exerciseLabel: ReviewSessionUpdate["exercise_label"];
  taxonomyLevel: ReviewSessionUpdate["taxonomy_level"];
  status: ReviewStatus;
  content: ReviewSessionContentDto;
  notes: ReviewSessionUpdate["notes"];
}>;

/**
 * Command for POST /api/review-sessions/{sessionId}/complete
 * Marks session as completed with optional custom completion timestamp
 */
export interface CompleteReviewSessionCommand {
  completedAt?: ReviewSessionUpdate["completed_at"];
}

// ============================================================================
// REVIEW SESSION FEEDBACK
// ============================================================================

/**
 * Review session feedback DTO for GET/POST feedback endpoints
 * Represents user feedback on completed review session
 */
export interface ReviewSessionFeedbackDto {
  id: ReviewSessionFeedbackRow["id"];
  reviewSessionId: ReviewSessionFeedbackRow["review_session_id"];
  userId: ReviewSessionFeedbackRow["user_id"];
  rating: ReviewSessionFeedbackRow["rating"];
  comment: ReviewSessionFeedbackRow["comment"];
  createdAt: ReviewSessionFeedbackRow["created_at"];
}

/**
 * Command for POST /api/review-sessions/{sessionId}/feedback
 * Submits user feedback with 1-5 rating and optional comment
 */
export interface SubmitReviewSessionFeedbackCommand {
  rating: NonNullable<ReviewSessionFeedbackInsert["rating"]>;
  comment?: ReviewSessionFeedbackInsert["comment"];
}

// ============================================================================
// METRICS
// ============================================================================

/**
 * AI usage metrics DTO for GET /api/metrics/ai-usage
 * Shows ratio of AI-generated vs manual sessions for current user
 */
export interface AiUsageMetricsDto {
  totalReviewSessions: number;
  aiGeneratedSessions: number;
  manualSessions: number;
  aiUsageRate: number;
}

/**
 * Per-study-plan AI quality metrics
 * Used as items in AiQualityMetricsDto
 */
export interface AiQualityStudyPlanMetricsDto {
  studyPlanId: StudyPlanRow["id"];
  generatedSessions: number;
  acceptedSessions: number;
  editedSessions: number;
  editRate: number;
}

/**
 * AI quality metrics DTO for GET /api/metrics/ai-quality
 * Aggregates AI generation quality metrics across study plans
 */
export interface AiQualityMetricsDto {
  studyPlans: AiQualityStudyPlanMetricsDto[];
}

// ============================================================================
// AI GENERATED SESSIONS SCHEMA (for OpenRouter responses)
// ============================================================================

/**
 * Schema dla pojedynczej sesji przeglądowej generowanej przez AI
 */
export interface AiGeneratedReviewSessionSchema {
  questions: string[];
  answers: string[];
  hints: string[];
  taxonomyLevel: TaxonomyLevel;
  exerciseLabel: string;
}

/**
 * Schema dla pełnej odpowiedzi AI zawierającej wiele sesji
 */
export interface AiGeneratedSessionsSchema {
  sessions: AiGeneratedReviewSessionSchema[];
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================
// Re-export commonly used database types for convenience

export type { TaxonomyLevel, ReviewStatus };
