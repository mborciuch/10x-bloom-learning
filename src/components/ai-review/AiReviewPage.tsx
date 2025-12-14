import { useMemo, useCallback, useState } from "react";
import { format } from "date-fns";
import type { ReviewSessionDto, ReviewStatus, UpdateReviewSessionCommand } from "@/types";
import { useAiReviewSessions, useStudyPlanDetails } from "@/lib/hooks";
import { useExerciseTemplates } from "@/components/hooks/useExerciseTemplates";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { AiReviewHeader } from "./AiReviewHeader";
import { SessionReviewCard } from "./SessionReviewCard";
import { useUpdateSession } from "@/components/hooks/useReviewSessionMutations";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface AiReviewPageProps {
  planId: string;
}

export function AiReviewPage({ planId }: AiReviewPageProps) {
  const { data: plan, isLoading: isPlanLoading, error: planError, refetch: refetchPlan } = useStudyPlanDetails(planId);
  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useAiReviewSessions(planId);

  const { data: templatesData } = useExerciseTemplates({ isActive: true, pageSize: 200 });
  const isLoading = isPlanLoading || isSessionsLoading;
  const [activeBulkAction, setActiveBulkAction] = useState<"accept" | "reject" | null>(null);
  const [bulkDialog, setBulkDialog] = useState<"accept" | "reject" | null>(null);
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);
  const [dirtySessions, setDirtySessions] = useState<Record<string, boolean>>({});
  const saveSessionMutation = useUpdateSession();
  const statusUpdateMutation = useUpdateSession({ enableSuccessToast: false, enableErrorToast: false });
  const error = planError ?? sessionsError;

  const groupedSessions = useMemo(() => {
    if (!sessionsData?.items) {
      return [];
    }

    const groups = new Map<string, ReviewSessionDto[]>();

    sessionsData.items.forEach((session) => {
      const key = session.reviewDate ?? "unscheduled";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(session);
    });

    return Array.from(groups.entries())
      .map(([date, items]) => ({
        date,
        label: date === "unscheduled" ? "No scheduled date" : format(new Date(date), "EEEE, MMMM d"),
        items,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sessionsData]);

  const templateNames = useMemo(() => {
    const map = new Map<string, string>();
    templatesData?.items?.forEach((template) => {
      map.set(template.id, template.name);
    });
    return map;
  }, [templatesData]);

  const isMutationPending =
    saveSessionMutation.isPending || statusUpdateMutation.isPending || activeBulkAction !== null;

  const handleSessionStatusChange = useCallback(
    async (sessionId: string, status: ReviewStatus) => {
      try {
        await statusUpdateMutation.mutateAsync({ sessionId, command: { status } });
        toast.success(status === "accepted" ? "Session accepted." : "Session rejected.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Please try again.";
        toast.error("Failed to update session status.", {
          description: message,
        });
      }
    },
    [statusUpdateMutation]
  );

  const handleBulkStatusChange = useCallback(
    async (status: ReviewStatus, action: "accept" | "reject") => {
      if (!sessionsData?.items || sessionsData.items.length === 0) {
        return;
      }

      setActiveBulkAction(action);
      try {
        for (const session of sessionsData.items) {
          await statusUpdateMutation.mutateAsync({ sessionId: session.id, command: { status } });
        }
        toast.success(action === "accept" ? "All sessions accepted." : "All sessions rejected.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Please try again.";
        toast.error(`Failed to ${action} all sessions.`, {
          description: message,
        });
      } finally {
        setActiveBulkAction(null);
      }
    },
    [sessionsData, statusUpdateMutation]
  );

  const handleSaveSession = useCallback(
    async (sessionId: string, updates: Partial<UpdateReviewSessionCommand>) => {
      setSavingSessionId(sessionId);
      try {
        await saveSessionMutation.mutateAsync({ sessionId, command: updates });
        toast.success("Session changes saved.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Please try again.";
        toast.error("Failed to save session changes.", {
          description: message,
        });
      } finally {
        setSavingSessionId(null);
      }
    },
    [saveSessionMutation]
  );

  const handleDirtyChange = useCallback((sessionId: string, isDirty: boolean) => {
    setDirtySessions((prev) => {
      if (prev[sessionId] === isDirty) {
        return prev;
      }
      if (isDirty) {
        return { ...prev, [sessionId]: true };
      }
      const { [sessionId]: _removed, ...rest } = prev;
      void _removed;
      return rest;
    });
  }, []);

  const sessionCount = sessionsData?.items?.length ?? 0;
  const dirtyCount = Object.keys(dirtySessions).length;

  const requestBulkAction = (action: "accept" | "reject") => {
    if (sessionCount === 0) {
      return;
    }
    setBulkDialog(action);
  };

  const confirmBulkAction = () => {
    const action = bulkDialog;
    if (!action) {
      return;
    }
    setBulkDialog(null);
    void handleBulkStatusChange(action === "accept" ? "accepted" : "rejected", action);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AiReviewHeader planTitle={plan?.title} sessionCount={sessionsData?.items?.length ?? 0} isBusy />
        <LoadingSpinner label="Loading AI review sessions..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load AI review sessions"
        message={error instanceof Error ? error.message : "Please try again later."}
        onRetry={() => {
          void Promise.all([refetchPlan(), refetchSessions()]);
        }}
      />
    );
  }

  const handleAcceptSession = (sessionId: string) => {
    void handleSessionStatusChange(sessionId, "accepted");
  };
  const handleRejectSession = (sessionId: string) => {
    void handleSessionStatusChange(sessionId, "rejected");
  };

  return (
    <div className="space-y-6">
      <AiReviewHeader
        planTitle={plan?.title}
        sessionCount={sessionCount}
        isBusy={isMutationPending}
        onBack={() => {
          window.history.back();
        }}
        onAcceptAll={() => requestBulkAction("accept")}
        onRejectAll={() => requestBulkAction("reject")}
      />

      {sessionCount === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No AI-generated sessions are waiting for review for this plan.
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSessions.map((group) => (
            <section key={group.date} className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Review date</p>
                <h2 className="text-lg font-semibold text-foreground">{group.label}</h2>
              </div>
              <div className="space-y-4">
                {group.items.map((session) => (
                  <SessionReviewCard
                    key={session.id}
                    session={session}
                    isBusy={activeBulkAction !== null || statusUpdateMutation.isPending}
                    isSaving={savingSessionId === session.id && saveSessionMutation.isPending}
                    onAccept={handleAcceptSession}
                    onReject={handleRejectSession}
                    onSave={handleSaveSession}
                    onDirtyChange={handleDirtyChange}
                    templateName={
                      session.exerciseTemplateId ? templateNames.get(session.exerciseTemplateId) : undefined
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={bulkDialog !== null}
        title={bulkDialog === "accept" ? "Accept all sessions" : "Reject all sessions"}
        description={
          dirtyCount > 0
            ? `You have ${dirtyCount} session${dirtyCount === 1 ? "" : "s"} with unsaved edits. This action will discard those changes. Continue?`
            : bulkDialog === "accept"
              ? "This will accept all AI-generated sessions currently pending review."
              : "This will reject all AI-generated sessions currently pending review."
        }
        confirmText={bulkDialog === "accept" ? "Accept all" : "Reject all"}
        cancelText="Cancel"
        variant={bulkDialog === "reject" ? "danger" : "default"}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkDialog(null)}
      />
    </div>
  );
}
