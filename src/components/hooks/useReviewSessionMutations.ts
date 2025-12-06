import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ReviewSessionDto,
  CreateReviewSessionCommand,
  UpdateReviewSessionCommand,
  CompleteReviewSessionCommand,
} from "@/types";

function invalidateSessionQueries(queryClient: ReturnType<typeof useQueryClient>, sessionId?: string) {
  queryClient.invalidateQueries({ queryKey: ["review-sessions"] });
  queryClient.invalidateQueries({ queryKey: ["ai-review-sessions"] });
  if (sessionId) {
    queryClient.invalidateQueries({ queryKey: ["review-session", sessionId] });
  }
}

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
interface CompleteSessionVariables extends CompleteReviewSessionCommand {
  sessionId: string;
}

export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, completedAt }: CompleteSessionVariables) => {
      const command: CompleteReviewSessionCommand = {};
      if (completedAt) {
        command.completedAt = completedAt;
      }

      const response = await fetch(`/api/review-sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to complete session" }));
        throw new Error(error.message || "Failed to complete session");
      }

      return response.json() as Promise<ReviewSessionDto>;
    },

    // Optimistic update
    onMutate: async ({ sessionId, completedAt }) => {
      const optimisticCompletedAt = completedAt ?? new Date().toISOString();

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["review-sessions"] });

      // Snapshot previous value
      const previousSessions = queryClient.getQueriesData<ReviewSessionDto[]>({
        queryKey: ["review-sessions"],
      });
      const previousSessionDetail = queryClient.getQueryData<ReviewSessionDto>(["review-session", sessionId]);

      // Optimistically update all matching queries
      queryClient.setQueriesData<ReviewSessionDto[]>({ queryKey: ["review-sessions"] }, (old) => {
        if (!old) return old;
        return old.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                isCompleted: true,
                completedAt: optimisticCompletedAt,
              }
            : session
        );
      });

      queryClient.setQueryData<ReviewSessionDto>(["review-session", sessionId], (old) => {
        if (!old) return old;
        return {
          ...old,
          isCompleted: true,
          completedAt: optimisticCompletedAt,
        };
      });

      return { previousSessions, previousSessionDetail };
    },

    // Rollback on error
    onError: (error, _variables, context) => {
      if (context?.previousSessions) {
        context.previousSessions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousSessionDetail) {
        queryClient.setQueryData(["review-session", context.previousSessionDetail.id], context.previousSessionDetail);
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
    onSettled: (_result, _error, variables) => {
      invalidateSessionQueries(queryClient, variables.sessionId);
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
      invalidateSessionQueries(queryClient);
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
      invalidateSessionQueries(queryClient);
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
interface UseUpdateSessionOptions {
  enableSuccessToast?: boolean;
  enableErrorToast?: boolean;
}

export function useUpdateSession(options: UseUpdateSessionOptions = {}) {
  const { enableSuccessToast = true, enableErrorToast = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, command }: { sessionId: string; command: Partial<UpdateReviewSessionCommand> }) => {
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
      if (enableSuccessToast) {
        toast.success("Session updated!", {
          description: "Your changes have been saved.",
        });
      }
      invalidateSessionQueries(queryClient);
    },

    // Error notification
    onError: (error) => {
      if (enableErrorToast) {
        toast.error("Failed to update session", {
          description: error.message || "Please try again.",
        });
      }
    },
  });
}
