import type { ReviewSessionDto, StudyPlanListItemDto, TaxonomyLevel, ReviewStatus } from "@/types";

/**
 * Calendar View State
 * Main state for calendar view component
 */
export interface CalendarViewState {
  currentMonth: Date;
  selectedDate: Date | null;
  selectedPlanId: string | null;
  statusFilter: ReviewStatus | "all";
  completionFilter: "all" | "completed" | "pending";
  taxonomyFilter: TaxonomyLevel | "all";
  aiFilter: "all" | "ai" | "manual";
  isAddSessionModalOpen: boolean;
  isLoading: boolean;
}

/**
 * Sessions grouped by date (key: YYYY-MM-DD)
 */
export type SessionsByDate = Record<string, ReviewSessionDto[]>;

/**
 * Calendar date range for fetching sessions
 */
export interface CalendarDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * Calendar day with sessions
 */
export interface CalendarDay {
  date: Date;
  sessions: ReviewSessionDto[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

/**
 * Add Session Form Data (before mapping to CreateReviewSessionCommand)
 */
export interface AddSessionFormData {
  studyPlanId: string;
  reviewDate: Date;
  exerciseType: "template" | "custom";
  exerciseTemplateId?: string;
  customExerciseLabel?: string;
  taxonomyLevel: TaxonomyLevel;
  questionsText: string; // one per line, will be split into array
  answersText: string; // one per line, will be split into array
  notes?: string;
}

/**
 * Props for CalendarHeader component
 */
export interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  selectedPlanId: string | null;
  onPlanFilterChange: (planId: string | null) => void;
  statusFilter: ReviewStatus | "all";
  onStatusFilterChange: (status: ReviewStatus | "all") => void;
  completionFilter: "all" | "completed" | "pending";
  onCompletionFilterChange: (value: "all" | "completed" | "pending") => void;
  taxonomyFilter: TaxonomyLevel | "all";
  onTaxonomyFilterChange: (value: TaxonomyLevel | "all") => void;
  aiFilter: "all" | "ai" | "manual";
  onAiFilterChange: (value: "all" | "ai" | "manual") => void;
  studyPlans: StudyPlanListItemDto[];
  canGoPrev: boolean;
  canGoNext: boolean;
}

/**
 * Props for CalendarGrid component
 */
export interface CalendarGridProps {
  currentMonth: Date;
  sessions: SessionsByDate;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

/**
 * Props for CalendarDayCell component
 */
export interface CalendarDayCellProps {
  date: Date;
  sessions: ReviewSessionDto[];
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  onDayClick: (date: Date) => void;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
}

/**
 * Props for CalendarDayList component (mobile)
 */
export interface CalendarDayListProps {
  currentMonth: Date;
  sessions: SessionsByDate;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
}

/**
 * Props for ExpandableDayCard component (mobile)
 */
export interface ExpandableDayCardProps {
  date: Date;
  sessions: ReviewSessionDto[];
  isToday: boolean;
  defaultExpanded: boolean;
  onSessionClick: (sessionId: string) => void;
  onQuickComplete: (sessionId: string) => Promise<void>;
  onSessionEdit: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => Promise<void>;
}

/**
 * Props for FloatingActionButton component (mobile)
 */
export interface FloatingActionButtonProps {
  onAddSession: () => void;
}
