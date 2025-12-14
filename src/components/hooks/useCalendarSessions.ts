import { useQuery } from "@tanstack/react-query";
import type { Paginated, ReviewSessionDto, ReviewStatus, TaxonomyLevel } from "@/types";
import type { CalendarDateRange } from "@/components/Calendar/calendar.types";

/**
 * Custom React Query hook for fetching review sessions within a date range
 *
 * @param dateRange - Start and end date for filtering sessions (YYYY-MM-DD format)
 * @param planId - Optional study plan ID for filtering (null = all plans)
 * @param extraFilters - Optional additional filters (status, completion, taxonomy level, AI flag)
 * @returns Query result with paginated sessions data, loading state, and error handling
 *
 * @example
 * const { data } = useCalendarSessions(
 *   { startDate: "2025-11-01", endDate: "2025-11-30" },
 *   selectedPlanId
 * );
 */
export interface CalendarSessionFilters {
  status?: ReviewStatus;
  isCompleted?: boolean;
  taxonomyLevel?: TaxonomyLevel;
  isAiGenerated?: boolean;
}

export function useCalendarSessions(
  dateRange: CalendarDateRange,
  planId: string | null,
  extraFilters: CalendarSessionFilters = {}
) {
  return useQuery<Paginated<ReviewSessionDto>>({
    queryKey: ["review-sessions", dateRange, planId, extraFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: dateRange.startDate,
        dateTo: dateRange.endDate,
      });

      if (planId) {
        params.append("planId", planId);
      }

      if (extraFilters.status) {
        params.append("status", extraFilters.status);
      }

      if (typeof extraFilters.isCompleted === "boolean") {
        params.append("isCompleted", String(extraFilters.isCompleted));
      }

      if (extraFilters.taxonomyLevel) {
        params.append("taxonomyLevel", extraFilters.taxonomyLevel);
      }

      if (typeof extraFilters.isAiGenerated === "boolean") {
        params.append("isAiGenerated", String(extraFilters.isAiGenerated));
      }

      const response = await fetch(`/api/review-sessions?${params.toString()}`);

      if (!response.ok) {
        let errorMessage = "Failed to fetch review sessions";

        const errorBody = await response.json().catch(() => null);
        if (errorBody?.error?.message) {
          errorMessage = errorBody.error.message;
        } else if (response.status === 401) {
          errorMessage = "UNAUTHORIZED";
        }

        throw new Error(errorMessage);
      }

      return (await response.json()) as Paginated<ReviewSessionDto>;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
    retry: import.meta.env?.MODE === "test" ? 0 : 3,
  });
}
