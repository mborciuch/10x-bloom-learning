import type { ReviewSessionDto, StudyPlanListItemDto, TaxonomyLevel } from "@/types";

/**
 * Calendar View State
 * Main state for calendar view component
 */
export interface CalendarViewState {
  currentMonth: Date;
  selectedDate: Date | null;
  selectedPlanId: string | null;
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
  onFilterChange: (planId: string | null) => void;
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
