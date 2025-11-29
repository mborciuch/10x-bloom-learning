import { useState, useMemo } from "react";
import { subMonths, addMonths } from "date-fns";
import { useStudyPlans } from "@/components/hooks/useStudyPlans";
import { useCalendarSessions } from "@/components/hooks/useCalendarSessions";
import { useCompleteSession, useDeleteSession } from "@/components/hooks/useReviewSessionMutations";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { EmptyStateOnboarding } from "@/components/EmptyStateOnboarding";
import { CalendarHeader } from "@/components/Calendar/CalendarHeader";
import { CalendarGrid } from "@/components/Calendar/CalendarGrid";
import { CalendarDayList } from "@/components/Calendar/CalendarDayList";
import { FloatingActionButton } from "@/components/Calendar/FloatingActionButton";
import { AddSessionModal } from "@/components/Calendar/AddSessionModal";
import { getCalendarDateRange, groupSessionsByDate, canNavigateMonth } from "@/components/Calendar/calendar.utils";

/**
 * Main Calendar View component
 * Conditionally renders Loading, Error, Empty State, or Calendar Grid
 * based on study plans data state
 *
 * @example
 * <CalendarView />
 */
export function CalendarView() {
  const {
    data: plans,
    isLoading: isLoadingPlans,
    isError: isPlansError,
    error: plansError,
    refetch: refetchPlans,
  } = useStudyPlans();
  const studyPlansCount = plans?.length ?? 0;

  // Local state for calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);

  // Calculate date range for current month view
  const dateRange = useMemo(() => getCalendarDateRange(currentMonth), [currentMonth]);

  // Fetch sessions for current month and selected plan
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    error: sessionsError,
  } = useCalendarSessions(dateRange, selectedPlanId);

  // Group sessions by date
  const sessionsByDate = useMemo(() => groupSessionsByDate(sessions), [sessions]);

  // Mutations
  const completeSessionMutation = useCompleteSession();
  const deleteSessionMutation = useDeleteSession();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (canNavigateMonth(currentMonth, "prev")) {
      setCurrentMonth((prev) => subMonths(prev, 1));
    }
  };

  const handleNextMonth = () => {
    if (canNavigateMonth(currentMonth, "next")) {
      setCurrentMonth((prev) => addMonths(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Session interaction handlers
  const handleSessionClick = (sessionId: string) => {
    window.location.href = `/app/review-sessions/${sessionId}`;
  };

  const handleQuickComplete = async (sessionId: string) => {
    try {
      await completeSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      // Error is handled by the mutation hook with toast
      console.error("Failed to complete session:", error);
    }
  };

  const handleSessionEdit = (sessionId: string) => {
    // TODO: Implement edit modal in next phase
    console.log("Edit session:", sessionId);
  };

  const handleAddSession = () => {
    setIsAddSessionModalOpen(true);
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      // Error is handled by the mutation hook with toast
      console.error("Failed to delete session:", error);
    }
  };

  // Loading state for plans
  if (isLoadingPlans) {
    return <LoadingSpinner label="Loading study plans..." />;
  }

  // Error state for plans
  if (isPlansError) {
    return (
      <ErrorState
        message={
          plansError?.message === "UNAUTHORIZED"
            ? "Your session has expired. Please login again."
            : "Failed to load your study plans. Please try again."
        }
        onRetry={refetchPlans}
      />
    );
  }

  // Empty state - no study plans
  if (studyPlansCount === 0) {
    return <EmptyStateOnboarding />;
  }

  // Calendar View with Header and Grid
  return (
    <div className="calendar-view-container max-w-7xl mx-auto p-4">
      <CalendarHeader
        currentDate={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        selectedPlanId={selectedPlanId}
        onFilterChange={setSelectedPlanId}
        studyPlans={plans || []}
        canGoPrev={canNavigateMonth(currentMonth, "prev")}
        canGoNext={canNavigateMonth(currentMonth, "next")}
      />

      {/* Loading state for sessions */}
      {isLoadingSessions && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="sm" label="Loading sessions..." />
        </div>
      )}

      {/* Error state for sessions */}
      {isSessionsError && (
        <div className="py-4">
          <ErrorState
            title="Failed to load sessions"
            message={sessionsError?.message || "Please try again"}
            onRetry={() => window.location.reload()}
          />
        </div>
      )}

      {/* Calendar Grid (Desktop/Tablet) */}
      {!isLoadingSessions && !isSessionsError && (
        <>
          <CalendarGrid
            currentMonth={currentMonth}
            sessions={sessionsByDate}
            onSessionClick={handleSessionClick}
            onQuickComplete={handleQuickComplete}
            onSessionEdit={handleSessionEdit}
            onSessionDelete={handleSessionDelete}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          {/* Calendar Day List (Mobile) */}
          <CalendarDayList
            currentMonth={currentMonth}
            sessions={sessionsByDate}
            onSessionClick={handleSessionClick}
            onQuickComplete={handleQuickComplete}
            onSessionEdit={handleSessionEdit}
            onSessionDelete={handleSessionDelete}
          />
        </>
      )}

      {/* Floating Action Button (Mobile only) */}
      <FloatingActionButton onAddSession={handleAddSession} />

      {/* Add Session Modal */}
      <AddSessionModal
        open={isAddSessionModalOpen}
        onOpenChange={setIsAddSessionModalOpen}
        studyPlans={plans || []}
        defaultDate={selectedDate || undefined}
      />
    </div>
  );
}
