import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AiGeneratedReviewSessionSchema, InitiateAiGenerationCommand } from "@/types";

interface GenerateAiSessionsVariables {
  planId: string;
  command: InitiateAiGenerationCommand;
  signal?: AbortSignal;
}

interface GenerateAiSessionsResponse {
  sessions: AiGeneratedReviewSessionSchema[];
}

/**
 * Mutation wrapper responsible for calling POST /api/study-plans/{planId}/ai-generate
 * and invalidating relevant caches after completion.
 */
export function useAiGenerationMutation() {
  const queryClient = useQueryClient();

  return useMutation<GenerateAiSessionsResponse, Error, GenerateAiSessionsVariables>({
    mutationFn: async ({ planId, command, signal }) => {
      const response = await fetch(`/api/study-plans/${encodeURIComponent(planId)}/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        signal,
      });

      if (!response.ok) {
        let message = "Failed to generate AI sessions. Please try again.";
        try {
          const errorBody = await response.json();
          if (typeof errorBody?.error?.message === "string") {
            message = errorBody.error.message;
          }
        } catch {
          // Ignore JSON parse errors and use default message.
        }
        throw new Error(message);
      }

      return response.json() as Promise<GenerateAiSessionsResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    },
  });
}
