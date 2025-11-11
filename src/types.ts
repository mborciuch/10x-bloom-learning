import type { Enums, Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================
// Base entity types extracted from database schema for reuse in DTOs

type StudyPlanRow = Tables<"study_plans">;
type StudyPlanInsert = TablesInsert<"study_plans">;
type StudyPlanUpdate = TablesUpdate<"study_plans">;

type ExerciseTemplateRow = Tables<"exercise_templates">;
type ExerciseTemplateInsert = TablesInsert<"exercise_templates">;
type ExerciseTemplateUpdate = TablesUpdate<"exercise_templates">;

type AiGenerationLogRow = Tables<"ai_generation_log">;

type ReviewSessionRow = Tables<"review_sessions">;
type ReviewSessionInsert = TablesInsert<"review_sessions">;
type ReviewSessionUpdate = TablesUpdate<"review_sessions">;

type ReviewSessionFeedbackRow = Tables<"review_session_feedback">;
type ReviewSessionFeedbackInsert = TablesInsert<"review_session_feedback">;

type ProfileRow = Tables<"profiles">;
type ProfileUpdate = TablesUpdate<"profiles">;

// Database enums
type TaxonomyLevel = Enums<"taxonomy_level">;
type ReviewStatus = Enums<"review_status">;
type AiGenerationState = Enums<"ai_generation_state">;

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
 * Maps database fields to camelCase and adds computed pendingAiGeneration flag
 */
export interface StudyPlanListItemDto {
  id: StudyPlanRow["id"];
  title: StudyPlanRow["title"];
  sourceMaterial: StudyPlanRow["source_material"];
  wordCount: StudyPlanRow["word_count"];
  status: StudyPlanRow["status"];
  createdAt: StudyPlanRow["created_at"];
  updatedAt: StudyPlanRow["updated_at"];
  pendingAiGeneration: boolean;
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
  wordCount: NonNullable<StudyPlanInsert["word_count"]>;
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
// EXERCISE TEMPLATES
// ============================================================================

/**
 * Exercise template list item DTO for GET /api/exercise-templates
 * Excludes prompt field (only in details)
 */
export interface ExerciseTemplateListItemDto {
  id: ExerciseTemplateRow["id"];
  name: ExerciseTemplateRow["name"];
  description: ExerciseTemplateRow["description"];
  defaultTaxonomyLevel: ExerciseTemplateRow["default_taxonomy_level"];
  isPredefined: ExerciseTemplateRow["is_predefined"];
  metadata: ExerciseTemplateRow["metadata"];
  isActive: ExerciseTemplateRow["is_active"];
  createdAt: ExerciseTemplateRow["created_at"];
  updatedAt: ExerciseTemplateRow["updated_at"];
}

/**
 * Exercise template details DTO for GET /api/exercise-templates/{templateId}
 * Extends list item with prompt and creator information
 */
export interface ExerciseTemplateDetailsDto extends ExerciseTemplateListItemDto {
  prompt: ExerciseTemplateRow["prompt"];
  createdBy: ExerciseTemplateRow["created_by"];
}

/**
 * Command for POST /api/exercise-templates
 * Creates user-defined exercise template (isPredefined forced to false by backend)
 */
export interface CreateExerciseTemplateCommand {
  name: NonNullable<ExerciseTemplateInsert["name"]>;
  description: ExerciseTemplateInsert["description"];
  prompt: NonNullable<ExerciseTemplateInsert["prompt"]>;
  defaultTaxonomyLevel: ExerciseTemplateInsert["default_taxonomy_level"];
  metadata?: ExerciseTemplateInsert["metadata"];
}

/**
 * Command for PATCH /api/exercise-templates/{templateId}
 * Allows partial updates of user-owned templates
 */
export type UpdateExerciseTemplateCommand = Partial<{
  name: ExerciseTemplateUpdate["name"];
  description: ExerciseTemplateUpdate["description"];
  prompt: ExerciseTemplateUpdate["prompt"];
  defaultTaxonomyLevel: ExerciseTemplateUpdate["default_taxonomy_level"];
  metadata: ExerciseTemplateUpdate["metadata"];
  isActive: ExerciseTemplateUpdate["is_active"];
}>;

// ============================================================================
// AI GENERATION
// ============================================================================

/**
 * AI generation parameters stored in ai_generation_log.parameters JSON field
 * Defines what the user requested for AI generation
 */
export interface AiGenerationParametersDto {
  requestedCount: number;
  taxonomyLevels: TaxonomyLevel[];
  templateIds?: string[];
}

/**
 * AI generation DTO for GET /api/ai-generations/{genId}
 * Represents complete AI generation attempt with status and results
 */
export interface AiGenerationDto {
  id: AiGenerationLogRow["id"];
  studyPlanId: AiGenerationLogRow["study_plan_id"];
  state: AiGenerationState;
  requestedAt: AiGenerationLogRow["requested_at"];
  modelName: AiGenerationLogRow["model_name"];
  parameters: AiGenerationParametersDto;
  response: AiGenerationLogRow["response"];
  errorMessage: AiGenerationLogRow["error_message"];
}

/**
 * Command for POST /api/study-plans/{planId}/ai-generations
 * Initiates async AI generation of review sessions
 */
export interface InitiateAiGenerationCommand {
  requestedCount: AiGenerationParametersDto["requestedCount"];
  taxonomyLevels: AiGenerationParametersDto["taxonomyLevels"];
  includePredefinedTemplateIds?: string[];
  modelName?: AiGenerationLogRow["model_name"];
}

/**
 * Command for POST /api/ai-generations/{genId}/accept
 * Discriminated union: either accept all or specify session IDs
 */
export type AcceptAiGenerationCommand =
  | {
      acceptAll: true;
      sessionIds?: undefined;
    }
  | {
      acceptAll?: false;
      sessionIds: string[];
    };

/**
 * Command for POST /api/ai-generations/{genId}/retry
 * Retries failed AI generation with optional model override
 */
export interface RetryAiGenerationCommand {
  modelName?: AiGenerationLogRow["model_name"];
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
  aiGenerationLogId: ReviewSessionRow["ai_generation_log_id"];
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
// PROFILE
// ============================================================================

/**
 * Profile DTO for GET /api/profile
 * User profile information including onboarding status
 */
export interface ProfileDto {
  id: ProfileRow["id"];
  displayName: ProfileRow["display_name"];
  timezone: ProfileRow["timezone"];
  onboardingCompletedAt: ProfileRow["onboarding_completed_at"];
  createdAt: ProfileRow["created_at"];
  updatedAt: ProfileRow["updated_at"];
}

/**
 * Command for PATCH /api/profile
 * Updates profile with optional onboarding completion flag
 */
export type UpdateProfileCommand = Partial<{
  displayName: ProfileUpdate["display_name"];
  timezone: ProfileUpdate["timezone"];
}> & {
  markOnboardingComplete?: boolean;
};

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
// TYPE EXPORTS
// ============================================================================
// Re-export commonly used database types for convenience

export type { TaxonomyLevel, ReviewStatus, AiGenerationState };
