import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorState } from "@/components/ErrorState";
import type { StudyPlanListItemDto } from "@/types";
import type { PlansContentProps } from "./plans.types";
import { PlansEmptyState } from "./PlansEmptyState";
import { PlansGrid } from "./PlansGrid";
import { mapToPlanCardViewModels } from "./plans.mappers";

function getErrorMessage(error: unknown): string {
  if (!error) {
    return "Failed to load study plans.";
  }

  if (error instanceof Error) {
    return error.message || "Failed to load study plans.";
  }

  return "Failed to load study plans.";
}

/**
 * Container responsible for rendering loading/error/empty/data states
 * of the study plans list.
 */
export function PlansContent({
  data,
  isLoading,
  error,
  onReload,
  onDelete,
  onArchive,
  onUnarchive,
  onGenerateAI,
  onViewSessions,
}: PlansContentProps) {
  const hasItems = (data?.items?.length ?? 0) > 0;

  if (isLoading && !hasItems) {
    return <LoadingSpinner label="Loading study plans..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load study plans"
        message={getErrorMessage(error)}
        onRetry={onReload}
      />
    );
  }

  if (!hasItems) {
    return (
      <PlansEmptyState
        onCreateFirstPlan={() => {
          window.location.href = "/app/plans/new";
        }}
      />
    );
  }

  const items = data?.items ?? [];
  const viewModels = mapToPlanCardViewModels(items);

  const findPlanById = (id: string): StudyPlanListItemDto | undefined =>
    items.find((plan) => String(plan.id) === String(id));

  return (
    <PlansGrid
      plans={viewModels}
      onGenerateAI={(id) => {
        const plan = findPlanById(id);
        if (plan) {
          onGenerateAI(plan);
        }
      }}
      onViewSessions={(id) => {
        const plan = findPlanById(id);
        if (plan) {
          onViewSessions(plan);
        }
      }}
      onEdit={(id) => {
        const plan = findPlanById(id);
        if (!plan) return;
        window.location.href = `/app/plans/${plan.id}/edit`;
      }}
      onArchive={(id) => {
        const plan = findPlanById(id);
        if (plan) {
          onArchive(plan);
        }
      }}
      onUnarchive={(id) => {
        const plan = findPlanById(id);
        if (plan) {
          onUnarchive(plan);
        }
      }}
      onDelete={(id) => {
        const plan = findPlanById(id);
        if (plan) {
          onDelete(plan);
        }
      }}
    />
  );
}


