import { useId, useCallback } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  index: number;
  total: number;
  question: string;
  answer: string;
  hint?: string;
  isOpen: boolean;
  onToggle: (nextValue: boolean) => void;
}

export function QuestionCard({ index, total, question, answer, hint, isOpen, onToggle }: QuestionCardProps) {
  const answerRegionId = useId();

  const handleToggle = useCallback(() => {
    onToggle(!isOpen);
  }, [isOpen, onToggle]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === " " || event.key === "Spacebar") {
        if (event.currentTarget !== event.target) {
          return;
        }
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <article
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "group rounded-3xl border border-border/80 bg-card/80 p-5 shadow-sm outline-none transition",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        isOpen ? "border-primary/50 bg-card" : "hover:border-primary/30"
      )}
      aria-label={`Question ${index + 1} of ${total}`}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <span>
              Question {index + 1} of {total}
            </span>
            <Badge variant="outline">Focus mode</Badge>
          </div>
          <p className="text-lg font-medium leading-snug text-foreground md:text-xl">{question}</p>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full justify-center gap-2 md:w-auto"
          aria-expanded={isOpen}
          aria-controls={answerRegionId}
          onClick={handleToggle}
        >
          {isOpen ? "Hide answer" : "Show answer"}
          <ChevronDown
            className={cn("size-4 transition-transform duration-200", isOpen ? "rotate-180" : "rotate-0")}
            aria-hidden="true"
          />
        </Button>
      </div>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300 ease-out",
          isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "mt-2 grid-rows-[0fr] opacity-0"
        )}
      >
        <div
          id={answerRegionId}
          role="region"
          aria-live="polite"
          aria-hidden={!isOpen}
          className="min-h-0 rounded-2xl border border-border/70 bg-muted/50 p-4 text-sm text-muted-foreground"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">Answer</p>
          <p className="mt-2 text-base text-foreground">{answer}</p>

          {hint ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-400/50 dark:bg-amber-500/10 dark:text-amber-100">
              <Lightbulb className="size-5 flex-shrink-0 text-amber-500" aria-hidden="true" />
              <div>
                <p className="text-xs uppercase tracking-wide">Hint</p>
                <p className="mt-1 leading-relaxed">{hint}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}


