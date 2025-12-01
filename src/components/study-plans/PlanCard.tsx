import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanCardProps } from "./plans.types";

function getStatusVariant(status: PlanCardProps["plan"]["status"]): "default" | "secondary" {
  return status === "archived" ? "secondary" : "default";
}

export function PlanCard({ plan, onGenerateAI, onViewSessions, onEdit, onArchive, onUnarchive, onDelete }: PlanCardProps) {
  const handleStatusClick = () => {
    if (plan.status === "archived") {
      onUnarchive(plan.id);
    } else {
      onArchive(plan.id);
    }
  };

  return (
    <Card
      className="flex h-full flex-col justify-between rounded-lg border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      aria-label={`Study plan card: ${plan.title}`}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base font-semibold leading-tight sm:text-lg">
            {plan.title}
          </CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <Badge variant="outline">{plan.wordCount} words</Badge>
          <Badge
            variant={getStatusVariant(plan.status)}
            className="cursor-pointer"
            onClick={handleStatusClick}
            aria-label={plan.status === "archived" ? "Unarchive plan" : "Archive plan"}
          >
            {plan.status === "archived" ? "Archived" : "Active"}
          </Badge>
          {plan.pendingAiGeneration && (
            <Badge variant="outline" className="border-dashed">
              AI generating…
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between space-y-3 text-xs text-muted-foreground sm:text-sm">
        <p>Created {plan.createdAtRelative}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium sm:text-xs">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => onViewSessions(plan.id)}
          >
            View sessions
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            className="text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onGenerateAI(plan.id)}
            disabled={plan.pendingAiGeneration}
          >
            {plan.pendingAiGeneration ? "AI generating…" : "Generate AI sessions"}
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => onEdit(plan.id)}
          >
            Edit plan
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={handleStatusClick}
          >
            {plan.status === "archived" ? "Unarchive" : "Archive"}
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            className="text-destructive hover:underline"
            onClick={() => onDelete(plan.id)}
          >
            Delete
          </button>
        </div>
      </CardContent>
    </Card>
  );
}



