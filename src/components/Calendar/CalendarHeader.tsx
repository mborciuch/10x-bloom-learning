import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { CalendarHeaderProps } from "./calendar.types";

/**
 * Calendar Header component with navigation and filtering
 *
 * Features:
 * - Month/Year navigation (prev/next buttons)
 * - "Today" button for quick navigation
 * - Study plan filter dropdown
 * - Responsive sticky header on mobile
 *
 * @example
 * <CalendarHeader
 *   currentDate={currentMonth}
 *   onPrevMonth={() => setCurrentMonth(prev => subMonths(prev, 1))}
 *   onNextMonth={() => setCurrentMonth(prev => addMonths(prev, 1))}
 *   onToday={() => setCurrentMonth(new Date())}
 *   selectedPlanId={selectedPlanId}
 *   onFilterChange={setSelectedPlanId}
 *   studyPlans={plans}
 *   canGoPrev={true}
 *   canGoNext={true}
 * />
 */
export function CalendarHeader({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  selectedPlanId,
  onFilterChange,
  studyPlans,
  canGoPrev,
  canGoNext,
}: CalendarHeaderProps) {
  const monthYearLabel = format(currentDate, "MMMM yyyy");

  return (
    <header className="calendar-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b sticky top-0 bg-background z-10 pt-4">
      {/* Navigation Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
          title={!canGoPrev ? "Cannot go further back (5 year limit)" : "Previous month"}
        >
          <ChevronLeft size={20} />
        </Button>

        <h2 className="text-xl font-semibold min-w-[180px] text-center">{monthYearLabel}</h2>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNextMonth}
          disabled={!canGoNext}
          aria-label="Next month"
          title={!canGoNext ? "Cannot go further forward (5 year limit)" : "Next month"}
        >
          <ChevronRight size={20} />
        </Button>

        <Button variant="outline" onClick={onToday} className="ml-2">
          Today
        </Button>
      </div>

      {/* Filter Section */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Filter by plan:</span>
        <Select
          value={selectedPlanId ?? "all"}
          onValueChange={(value) => onFilterChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {studyPlans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
