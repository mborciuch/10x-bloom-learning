import { EmptyStateOnboarding } from "@/components/EmptyStateOnboarding";
import type { PlansEmptyStateProps } from "./plans.types";

/**
 * Empty state shown when user has no study plans yet.
 * Thin wrapper around the generic EmptyStateOnboarding component.
 */
export function PlansEmptyState({ onCreateFirstPlan }: PlansEmptyStateProps) {
  return <EmptyStateOnboarding onCreateClick={onCreateFirstPlan} />;
}
