import type { PlansGridProps } from "./plans.types";
import { PlanCard } from "./PlanCard";

/**
 * Responsive grid layout for study plan cards.
 * Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column.
 */
export function PlansGrid({
  plans,
  onGenerateAI,
  onViewSessions,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: PlansGridProps) {
  return (
    <section aria-label="Study plans grid" className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onGenerateAI={onGenerateAI}
            onViewSessions={onViewSessions}
            onEdit={onEdit}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
