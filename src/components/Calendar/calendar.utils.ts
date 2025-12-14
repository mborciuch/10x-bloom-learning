import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  format,
  subMonths,
  addMonths,
  addYears,
  subYears,
} from "date-fns";
import type { CalendarDay, SessionsByDate } from "./calendar.types";
import type { ReviewSessionDto } from "@/types";

/**
 * Generate calendar days for a given month
 * Includes days from previous/next month to fill the grid (42-49 cells)
 *
 * @param currentMonth - The month to generate days for
 * @param sessionsByDate - Sessions grouped by date (YYYY-MM-DD)
 * @returns Array of CalendarDay objects for the entire grid
 */
export function generateCalendarDays(currentMonth: Date, sessionsByDate: SessionsByDate): CalendarDay[] {
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  const days: CalendarDay[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dateKey = format(currentDate, "yyyy-MM-dd");
    const sessionsForDay = sessionsByDate[dateKey] || [];

    days.push({
      date: new Date(currentDate),
      sessions: sessionsForDay,
      isToday: isToday(currentDate),
      isCurrentMonth: isSameMonth(currentDate, currentMonth),
    });

    currentDate = addDays(currentDate, 1);
  }

  return days;
}

/**
 * Group sessions by date (YYYY-MM-DD)
 *
 * @param sessions - Array of review sessions
 * @returns Object with date keys and session arrays as values
 */
export function groupSessionsByDate(sessions: ReviewSessionDto[]): SessionsByDate {
  return sessions.reduce<SessionsByDate>((acc, session) => {
    const dateValue = new Date(session.reviewDate);
    const dateKey = dateValue.toISOString().slice(0, 10); // UTC-normalized to avoid TZ drift

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }

    acc[dateKey].push(session);
    return acc;
  }, {});
}

/**
 * Calculate date range for calendar month (first to last day visible in grid)
 *
 * @param currentMonth - The month to calculate range for
 * @returns Object with startDate and endDate in YYYY-MM-DD format
 */
export function getCalendarDateRange(currentMonth: Date): { startDate: string; endDate: string } {
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  return {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  };
}

/**
 * Check if month navigation is allowed (within +/- 5 years limit)
 *
 * @param currentMonth - Current month
 * @param direction - Navigation direction ('prev' or 'next')
 * @returns True if navigation is allowed
 */
export function canNavigateMonth(currentMonth: Date, direction: "prev" | "next"): boolean {
  const today = new Date();
  const targetMonth = direction === "prev" ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
  const minDate = subYears(today, 5);
  const maxDate = addYears(today, 5);

  return targetMonth >= minDate && targetMonth <= maxDate;
}

/**
 * Get day names for calendar header (Mon, Tue, Wed, etc.)
 *
 * @returns Array of abbreviated day names starting from Monday
 */
export function getDayNames(): string[] {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}
