import { useQuery } from "@tanstack/react-query";
import type { Paginated, ReviewSessionDto } from "@/types";

const DEFAULT_PAGE_SIZE = 200;

/**
 * Fetches AI-generated review sessions with status=proposed for a specific plan.
 */
export function useAiReviewSessions(planId?: string) {
  return useQuery<Paginated<ReviewSessionDto>>({
    queryKey: ["ai-review-sessions", planId],
    enabled: Boolean(planId),
    queryFn: async () => {
      if (!planId) {
        throw new Error("planId is required");
      }

      const params = new URLSearchParams({
        studyPlanId: planId,
        status: "proposed",
        isAiGenerated: "true",
        page: "1",
        pageSize: String(DEFAULT_PAGE_SIZE),
        sort: "review_date",
        sortOrder: "asc",
      });

      const response = await fetch(`/api/review-sessions?${params.toString()}`);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error?.message ?? "Failed to load AI review sessions.";
        throw new Error(message);
      }

      return (await response.json()) as Paginated<ReviewSessionDto>;
    },
    staleTime: 30 * 1000,
  });
}






