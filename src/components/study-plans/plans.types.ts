import type { Paginated, StudyPlanListItemDto } from "@/types";

// ============================================================================
// VIEW MODELS
// ============================================================================

/**
 * UI-level filters state for the study plans list view.
 * Mirrors backend query params with an additional "all" status.
 */
export interface PlansFiltersViewModel {
  search: string;
  status: "all" | "active" | "archived";
  sort: "created_at" | "updated_at" | "title";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

/**
 * UI view model for a single study plan card.
 * Extends the backend DTO with preformatted, display-ready fields.
 */
export interface PlanCardViewModel {
  id: StudyPlanListItemDto["id"];
  title: StudyPlanListItemDto["title"];
  wordCount: StudyPlanListItemDto["wordCount"];
  status: StudyPlanListItemDto["status"];
  createdAt: StudyPlanListItemDto["createdAt"];
  createdAtRelative: string;
}

/**
 * Aggregate view state for the Plans page.
 * Combines filter state with loading/refetching/error indicators.
 */
export interface PlansPageState {
  filters: PlansFiltersViewModel;
  isInitialLoad: boolean;
  isRefetching: boolean;
  lastError?: unknown;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface PlansHeaderProps {
  search: string;
  status: PlansFiltersViewModel["status"];
  onSearchChange(value: string): void;
  onStatusChange(value: PlansFiltersViewModel["status"]): void;
  onCreateClick(): void;
}

export interface PlansContentProps {
  data?: Paginated<StudyPlanListItemDto>;
  isLoading: boolean;
  error?: unknown;
  onReload(): void;
  onDelete(plan: StudyPlanListItemDto): void;
  onArchive(plan: StudyPlanListItemDto): void;
  onUnarchive(plan: StudyPlanListItemDto): void;
  onGenerateAI(plan: StudyPlanListItemDto): void;
  onViewSessions(plan: StudyPlanListItemDto): void;
}

export interface PlansGridProps {
  plans: PlanCardViewModel[];
  onGenerateAI(planId: string): void;
  onViewSessions(planId: string): void;
  onEdit(planId: string): void;
  onArchive(planId: string): void;
  onUnarchive(planId: string): void;
  onDelete(planId: string): void;
}

export interface PlanCardProps {
  plan: PlanCardViewModel;
  onGenerateAI(id: string): void;
  onViewSessions(id: string): void;
  onEdit(id: string): void;
  onArchive(id: string): void;
  onUnarchive(id: string): void;
  onDelete(id: string): void;
}

export interface PlansEmptyStateProps {
  onCreateFirstPlan(): void;
}

export interface PlansPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange(page: number): void;
}
