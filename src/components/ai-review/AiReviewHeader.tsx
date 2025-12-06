import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface AiReviewHeaderProps {
  planTitle?: string;
  sessionCount: number;
  isBusy?: boolean;
  onBack?: () => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

export function AiReviewHeader({ planTitle, sessionCount, isBusy, onBack, onAcceptAll, onRejectAll }: AiReviewHeaderProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-primary hover:underline"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to plans
            </button>
            <span aria-hidden="true">/</span>
            <span>AI review</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Review AI sessions</h1>
            <p className="text-muted-foreground">
              {planTitle ? `Plan: ${planTitle}` : "Select a plan to review AI generated sessions."}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <Badge variant="secondary" className="w-fit text-sm">
            {sessionCount} session{sessionCount === 1 ? "" : "s"} pending review
          </Badge>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => onRejectAll?.()} disabled={isBusy || sessionCount === 0}>
              Reject all
            </Button>
            <Button onClick={() => onAcceptAll?.()} disabled={isBusy || sessionCount === 0}>
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface AiReviewHeaderProps {
  planTitle?: string;
  sessionCount: number;
  isBusy?: boolean;
  onBack?: () => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

export function AiReviewHeader({ planTitle, sessionCount, isBusy, onBack, onAcceptAll, onRejectAll }: AiReviewHeaderProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-primary hover:underline"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to plans
            </button>
            <span aria-hidden="true">/</span>
            <span>AI review</span>
          >
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Review AI sessions</h1>
          <p className="text-muted-foreground">
            {planTitle ? `Plan: ${planTitle}` : "Select a plan to review AI generated sessions."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="text-sm">
          {sessionCount} session{sessionCount === 1 ? "" : "s"} pending review
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onRejectAll} disabled={isBusy || sessionCount === 0}>
          Reject all
        </Button>
        <Button onClick={onAcceptAll} disabled={isBusy || sessionCount === 0}>
          Accept all
        </Button>
      </div>
    </div>
  );
}

