import { useQuery } from "@tanstack/react-query";
import type { StudyPlanDetailsDto } from "@/types";
import { getStudyPlan } from "@/lib/api/study-plans";

/**
 * Fetches a single study plan with aggregated session counts.
 */
export function useStudyPlanDetails(planId?: string) {
  return useQuery<StudyPlanDetailsDto>({
    queryKey: ["study-plan", planId],
    enabled: Boolean(planId),
    queryFn: () => {
      if (!planId) {
        throw new Error("planId is required");
      }
      return getStudyPlan(planId);
    },
    staleTime: 2 * 60 * 1000,
  });
}





