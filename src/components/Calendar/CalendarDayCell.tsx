import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { SessionCardMini } from "./SessionCardMini";
import type { CalendarDayCellProps } from "./calendar.types";

/**
 * Calendar Day Cell component
 *
 * Single day cell in the calendar grid showing:
 * - Day number
 * - List of sessions (max 3 visible without scroll)
 * - Badge with session count if > 3
 * - Special styling for today, selected, out-of-month
 *
 * @example
 * <CalendarDayCell
 *   date={new Date()}
 *   sessions={[...]}
 *   isToday={true}
 *   isSelected={false}
 *   isCurrentMonth={true}
 *   onDayClick={(date) => setSelectedDate(date)}
 *   onSessionClick={(id) => navigate(`/app/review-sessions/${id}`)}
 *   onQuickComplete={completeSession}
 *   onSessionEdit={openEditModal}
 *   onSessionDelete={deleteSession}
 * />
 */
export function CalendarDayCell({
  date,
  sessions,
  isToday,
  isSelected,
  isCurrentMonth,
  onDayClick,
  onSessionClick,
  onQuickComplete,
  onSessionEdit,
  onSessionDelete,
}: CalendarDayCellProps) {
  const dayNumber = date.getDate();
  const hasManySessions = sessions.length > 3;

  const handleCellClick = () => {
    onDayClick(date);
  };

  return (
    <div
      role="gridcell"
      aria-label={`${format(date, "EEEE, MMMM d")}, ${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
      aria-current={isToday ? "date" : undefined}
      tabIndex={0}
      className={`
        day-cell min-h-[140px] p-2 border rounded-lg cursor-pointer
        transition-colors hover:bg-accent
        ${isToday ? "border-primary border-2 bg-primary/5" : ""}
        ${isSelected ? "ring-2 ring-primary" : ""}
        ${!isCurrentMonth ? "opacity-50 bg-muted/30" : ""}
        ${sessions.length > 0 ? "has-sessions" : ""}
      `}
      onClick={handleCellClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCellClick();
        }
      }}
    >
      {/* Day header with number and session count badge */}
      <div className="flex items-center justify-between mb-2">
        <div
          className={`
            day-number text-sm font-semibold
            ${isToday ? "text-primary" : ""}
            ${!isCurrentMonth ? "text-muted-foreground" : ""}
          `}
        >
          {dayNumber}
        </div>

        {hasManySessions && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
            {sessions.length}
          </Badge>
        )}
      </div>

      {/* Sessions list - scrollable if more than 3 */}
      <div
        className={`
          sessions-list space-y-1.5
          ${hasManySessions ? "max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent" : ""}
        `}
      >
        {sessions.map((session) => (
          <SessionCardMini
            key={session.id}
            session={session}
            onSessionClick={onSessionClick}
            onQuickComplete={onQuickComplete}
            onSessionEdit={onSessionEdit}
            onSessionDelete={onSessionDelete}
          />
        ))}
      </div>

      {/* Empty state for day with no sessions */}
      {sessions.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4 opacity-0 hover:opacity-50 transition-opacity">
          No sessions
        </div>
      )}
    </div>
  );
}
