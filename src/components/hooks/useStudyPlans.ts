import { useQuery } from "@tanstack/react-query";
import type { StudyPlanListItemDto, Paginated } from "@/types";

/**
 * Custom React Query hook for fetching user's study plans
 *
 * @returns Query result with study plans data, loading state, and error handling
 *
 * @example
 * const { data: plans, isLoading, isError } = useStudyPlans();
 * const studyPlansCount = plans?.length ?? 0;
 */
export function useStudyPlans() {
  return useQuery<StudyPlanListItemDto[]>({
    queryKey: ["study-plans"],
    queryFn: async () => {
      const response = await fetch("/api/study-plans");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("UNAUTHORIZED");
        }
        throw new Error("Failed to fetch study plans");
      }

      const data: Paginated<StudyPlanListItemDto> = await response.json();
      return data.items;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: import.meta.env?.MODE === "test" ? 0 : 3,
  });
}
