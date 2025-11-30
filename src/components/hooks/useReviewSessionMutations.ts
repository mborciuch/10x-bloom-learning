import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ReviewSessionDto, CreateReviewSessionCommand } from "@/types";

/**
 * Custom hook for completing a review session
 *
 * Features:
 * - Optimistic update (immediate UI change)
 * - Rollback on error
 * - Toast notifications
 * - Cache invalidation
 *
 * @example
 * const completeSession = useCompleteSession();
 * await completeSession.mutateAsync(sessionId);
 */
export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/review-sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to complete session" }));
        throw new Error(error.message || "Failed to complete session");
      }

      return response.json() as Promise<ReviewSessionDto>;
    },

    // Optimistic update
    onMutate: async (sessionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["review-sessions"] });

      // Snapshot previous value
      const previousSessions = queryClient.getQueriesData<ReviewSessionDto[]>({
        queryKey: ["review-sessions"],
      });

      // Optimistically update all matching queries
      queryClient.setQueriesData<ReviewSessionDto[]>({ queryKey: ["review-sessions"] }, (old) => {
        if (!old) return old;
        return old.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                isCompleted: true,
                completedAt: new Date().toISOString(),
              }
            : session
        );
      });

      return { previousSessions };
    },

    // Rollback on error
    onError: (error, sessionId, context) => {
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to complete session", {
        description: error.message || "Please try again.",
      });
    },

    // Success notification
    onSuccess: () => {
      toast.success("Session completed!", {
        description: "Great job! Keep up the good work.",
      });
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["review-sessions"] });
    },
  });
}

/**
 * Custom hook for deleting a review session
 *
 * Features:
 * - Optimistic update (immediate removal from UI)
 * - Rollback on error
 * - Toast notifications
 * - Cache invalidation
 *
 * @example
 * const deleteSession = useDeleteSession();
 * await deleteSession.mutateAsync(sessionId);
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/review-sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to delete session" }));
        throw new Error(error.message || "Failed to delete session");
      }

      // 204 No Content - no response body
      if (response.status === 204) {
        return;
      }

      return response.json();
    },

    // Optimistic update
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: ["review-sessions"] });

      const previousSessions = queryClient.getQueriesData<ReviewSessionDto[]>({
        queryKey: ["review-sessions"],
      });

      // Optimistically remove from all matching queries
      queryClient.setQueriesData<ReviewSessionDto[]>({ queryKey: ["review-sessions"] }, (old) => {
        if (!old) return old;
        return old.filter((session) => session.id !== sessionId);
      });

      return { previousSessions };
    },

    // Rollback on error
    onError: (error, sessionId, context) => {
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to delete session", {
        description: error.message || "Please try again.",
      });
    },

    // Success notification
    onSuccess: () => {
      toast.success("Session deleted", {
        description: "The review session has been removed.",
      });
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["review-sessions"] });
    },
  });
}

/**
 * Custom hook for creating a new review session
 *
 * Features:
 * - Toast notifications
 * - Cache invalidation
 * - Error handling with detailed messages
 *
 * @example
 * const createSession = useCreateSession();
 * await createSession.mutateAsync(command);
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: CreateReviewSessionCommand) => {
      const response = await fetch("/api/review-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to create session" }));
        throw new Error(error.message || "Failed to create session");
      }

      return response.json() as Promise<ReviewSessionDto>;
    },

    // Success notification
    onSuccess: () => {
      toast.success("Session created!", {
        description: "New review session has been added to your calendar.",
      });
      // Invalidate both sessions and plans (for counts)
      queryClient.invalidateQueries({ queryKey: ["review-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    },

    // Error notification
    onError: (error) => {
      toast.error("Failed to create session", {
        description: error.message || "Please check your input and try again.",
      });
    },
  });
}

/**
 * Custom hook for updating a review session
 *
 * Features:
 * - Toast notifications
 * - Cache invalidation
 * - Error handling
 *
 * @example
 * const updateSession = useUpdateSession();
 * await updateSession.mutateAsync({ sessionId, command });
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, command }: { sessionId: string; command: Partial<CreateReviewSessionCommand> }) => {
      const response = await fetch(`/api/review-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to update session" }));
        throw new Error(error.message || "Failed to update session");
      }

      return response.json() as Promise<ReviewSessionDto>;
    },

    // Success notification
    onSuccess: () => {
      toast.success("Session updated!", {
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["review-sessions"] });
    },

    // Error notification
    onError: (error) => {
      toast.error("Failed to update session", {
        description: error.message || "Please try again.",
      });
    },
  });
}
