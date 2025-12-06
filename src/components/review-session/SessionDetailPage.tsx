import { useReviewSession } from "@/components/hooks/useReviewSession";
import { useStudyPlanDetails } from "@/lib/hooks/useStudyPlanDetails";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import { SessionHeader } from "./SessionHeader";
import { QuestionList } from "./QuestionList";

interface SessionDetailPageProps {
  sessionId: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load review session.";
}

/**
 * Top-level component for the review session focus mode page.
 */
export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useReviewSession(sessionId);

  const studyPlanId = session?.studyPlanId;
  const { data: studyPlan } = useStudyPlanDetails(studyPlanId);

  if (isLoading) {
    return <LoadingSpinner label="Loading review session..." />;
  }

  if (isError || !session) {
    return (
      <ErrorState
        message={getErrorMessage(error ?? "Failed to load review session.")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <div className="space-y-6">
        <SessionHeader session={session} studyPlanTitle={studyPlan?.title} />
        <QuestionList session={session} />
      </div>
    </div>
  );
}


