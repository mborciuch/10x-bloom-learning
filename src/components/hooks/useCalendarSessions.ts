import { useQuery } from "@tanstack/react-query";
import type { ReviewSessionDto } from "@/types";
import type { CalendarDateRange } from "@/components/Calendar/calendar.types";

/**
 * Custom React Query hook for fetching review sessions within a date range
 *
 * @param dateRange - Start and end date for filtering sessions (YYYY-MM-DD format)
 * @param planId - Optional study plan ID for filtering (null = all plans)
 * @returns Query result with sessions data, loading state, and error handling
 *
 * @example
 * const { data: sessions } = useCalendarSessions(
 *   { startDate: "2025-11-01", endDate: "2025-11-30" },
 *   selectedPlanId
 * );
 */
export function useCalendarSessions(dateRange: CalendarDateRange, planId: string | null) {
  return useQuery<ReviewSessionDto[]>({
    queryKey: ["review-sessions", dateRange, planId],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: dateRange.startDate,
        dateTo: dateRange.endDate,
      });

      if (planId) {
        params.append("planId", planId);
      }

      const response = await fetch(`/api/review-sessions?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("UNAUTHORIZED");
        }
        throw new Error("Failed to fetch review sessions");
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    retry: 3,
  });
}
