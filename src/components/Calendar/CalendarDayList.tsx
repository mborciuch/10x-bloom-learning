import { useMemo, useEffect, useRef } from "react";
import { startOfWeek, endOfWeek, isWithinInterval, isToday } from "date-fns";
import { ExpandableDayCard } from "./ExpandableDayCard";
import { generateCalendarDays } from "./calendar.utils";
import type { CalendarDayListProps } from "./calendar.types";

/**
 * Calendar Day List component for mobile view (<768px)
 *
 * Alternative to CalendarGrid for mobile devices
 * Displays days as expandable cards grouped by week
 * Auto-scrolls to today's date on mount
 * Current week expanded by default
 *
 * @example
 * <CalendarDayList
 *   currentMonth={currentMonth}
 *   sessions={sessionsByDate}
 *   onSessionClick={handleClick}
 *   onQuickComplete={handleComplete}
 *   onSessionEdit={handleEdit}
 *   onSessionDelete={handleDelete}
 * />
 */
export function CalendarDayList({
  currentMonth,
  sessions,
  onSessionClick,
  onQuickComplete,
  onSessionEdit,
  onSessionDelete,
}: CalendarDayListProps) {
  const todayRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  // Generate calendar days with sessions
  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentMonth, sessions);
  }, [currentMonth, sessions]);

  // Filter out days without sessions for cleaner mobile view
  const daysWithSessions = useMemo(() => {
    return calendarDays.filter((day) => day.sessions.length > 0);
  }, [calendarDays]);

  // Determine which days should be expanded by default (current week)
  const isInCurrentWeek = (date: Date): boolean => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  };

  // Auto-scroll to today on mount
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []); // Only on mount

  // Empty state if no sessions in month
  if (daysWithSessions.length === 0) {
    return (
      <div className="calendar-day-list-empty text-center py-12 px-4">
        <p className="text-muted-foreground text-lg">No sessions scheduled for this month</p>
        <p className="text-muted-foreground text-sm mt-2">Add a session to get started</p>
      </div>
    );
  }

  return (
    <div className="calendar-day-list md:hidden space-y-3 pb-20">
      {" "}
      {/* pb-20 for FAB space */}
      {daysWithSessions.map((day) => {
        const dayIsToday = isToday(day.date);
        const defaultExpanded = isInCurrentWeek(day.date);

        return (
          <div key={day.date.toISOString()} ref={dayIsToday ? todayRef : null}>
            <ExpandableDayCard
              date={day.date}
              sessions={day.sessions}
              isToday={dayIsToday}
              defaultExpanded={defaultExpanded}
              onSessionClick={onSessionClick}
              onQuickComplete={onQuickComplete}
              onSessionEdit={onSessionEdit}
              onSessionDelete={onSessionDelete}
            />
          </div>
        );
      })}
    </div>
  );
}
