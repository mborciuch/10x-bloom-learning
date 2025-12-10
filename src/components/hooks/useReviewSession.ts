import { useQuery } from "@tanstack/react-query";
import type { ReviewSessionDto } from "@/types";

/**
 * Fetches a single review session by ID.
 *
 * Used by the session detail page to hydrate focus mode UI.
 */
export function useReviewSession(sessionId?: string) {
  return useQuery<ReviewSessionDto>({
    queryKey: ["review-session", sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("sessionId is required");
      }

      const response = await fetch(`/api/review-sessions/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Review session not found");
        }

        throw new Error("Failed to load review session");
      }

      return response.json() as Promise<ReviewSessionDto>;
    },
    staleTime: 60 * 1000,
  });
}




