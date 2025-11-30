import { useMemo } from "react";
import { generateCalendarDays, getDayNames } from "./calendar.utils";
import { CalendarDayCell } from "./CalendarDayCell";
import type { CalendarGridProps } from "./calendar.types";

/**
 * Calendar Grid component (Desktop/Tablet view)
 *
 * Displays a 7-column grid representing days of the month
 * Each day cell shows sessions scheduled for that day
 * Visible only on desktop and tablet (≥768px)
 *
 * @example
 * <CalendarGrid
 *   currentMonth={currentMonth}
 *   sessions={sessionsByDate}
 *   onSessionClick={(id) => navigate(`/app/review-sessions/${id}`)}
 *   onQuickComplete={completeSession}
 *   onSessionEdit={(id) => openEditModal(id)}
 *   onSessionDelete={deleteSession}
 *   selectedDate={selectedDate}
 *   onDateSelect={setSelectedDate}
 * />
 */
export function CalendarGrid({
  currentMonth,
  sessions,
  onSessionClick,
  onQuickComplete,
  onSessionEdit,
  onSessionDelete,
  selectedDate,
  onDateSelect,
}: CalendarGridProps) {
  const dayNames = getDayNames();

  // Generate calendar days with sessions
  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentMonth, sessions);
  }, [currentMonth, sessions]);

  return (
    <div className="calendar-grid hidden md:block" role="grid" aria-label="Calendar of review sessions">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="day-header text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const isSelected = Boolean(selectedDate && day.date.toDateString() === selectedDate.toDateString());

          return (
            <CalendarDayCell
              key={day.date.toISOString()}
              date={day.date}
              sessions={day.sessions}
              isToday={day.isToday}
              isSelected={isSelected}
              isCurrentMonth={day.isCurrentMonth}
              onDayClick={onDateSelect}
              onSessionClick={onSessionClick}
              onQuickComplete={onQuickComplete}
              onSessionEdit={onSessionEdit}
              onSessionDelete={onSessionDelete}
            />
          );
        })}
      </div>
    </div>
  );
}
