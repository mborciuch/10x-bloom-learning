import { format } from "date-fns";
import { ArrowLeft, CalendarDays, CircleCheck, Sparkles } from "lucide-react";
import type { ReviewSessionDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SessionHeaderProps {
  session: ReviewSessionDto;
  studyPlanTitle?: string;
}

function formatTaxonomy(level: string) {
  if (!level) return "Unknown";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Displays navigation, breadcrumbs, and key metadata for the session.
 */
export function SessionHeader({ session, studyPlanTitle }: SessionHeaderProps) {
  const reviewDate = session.reviewDate ? format(new Date(session.reviewDate), "EEEE, MMM d") : "No scheduled date";
  const completedAt = session.completedAt ? format(new Date(session.completedAt), "MMM d, yyyy") : null;

  return (
    <header className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <a href="/app/calendar" aria-label="Back to calendar view">
              <ArrowLeft className="size-4" />
              Back to calendar
            </a>
          </Button>

          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <a className="hover:text-foreground" href="/app/calendar">
                  Calendar
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <a className="hover:text-foreground" href="/app/plans">
                  {studyPlanTitle ?? "Study plan"}
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium text-foreground">
                Session
              </li>
            </ol>
          </nav>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden="true" />
            <span>{reviewDate}</span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Exercise</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{session.exerciseLabel}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {formatTaxonomy(session.taxonomyLevel)}
            </Badge>

            <Badge variant="outline" className="capitalize">
              {session.status}
            </Badge>

            {session.isAiGenerated ? (
              <Badge variant="outline" className="gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                AI generated
              </Badge>
            ) : null}

            {session.isCompleted ? (
              <Badge
                className={cn(
                  "gap-1.5 bg-green-600/90 text-white hover:bg-green-600",
                  "dark:bg-green-500/90 dark:text-foreground"
                )}
              >
                <CircleCheck className="size-3.5" />
                Completed {completedAt ?? reviewDate}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Scheduled
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}



