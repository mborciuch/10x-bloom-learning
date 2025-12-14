import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type WordCountStatus = "too-short" | "acceptable" | "optimal" | "too-long";

export interface WordCountIndicatorProps {
  count: number;
  min: number; // 200
  max: number; // 5000
}

interface StatusDisplay {
  color: {
    text: string;
    bg: string;
    border: string;
    progress: string;
  };
  icon: typeof CheckCircle;
  message: string;
  isValid: boolean;
}

/**
 * Determines the word count status based on count and limits
 */
function getWordCountStatus(count: number, min: number, max: number): WordCountStatus {
  if (count < min) return "too-short";
  if (count > max) return "too-long";
  if (count >= min && count <= 500) return "acceptable";
  return "optimal";
}

/**
 * Gets the display properties for a given status
 */
function getStatusDisplay(status: WordCountStatus, count: number): StatusDisplay {
  switch (status) {
    case "too-short":
      return {
        color: {
          text: "text-red-600",
          bg: "bg-red-100",
          border: "border-red-600",
          progress: "bg-red-500",
        },
        icon: XCircle,
        message: "Za mało słów (wymagane minimum 200)",
        isValid: false,
      };
    case "acceptable":
      return {
        color: {
          text: "text-yellow-600",
          bg: "bg-yellow-100",
          border: "border-yellow-600",
          progress: "bg-yellow-500",
        },
        icon: AlertCircle,
        message: `${count} słów`,
        isValid: true,
      };
    case "optimal":
      return {
        color: {
          text: "text-green-600",
          bg: "bg-green-100",
          border: "border-green-600",
          progress: "bg-green-500",
        },
        icon: CheckCircle,
        message: `${count} słów`,
        isValid: true,
      };
    case "too-long":
      return {
        color: {
          text: "text-red-600",
          bg: "bg-red-100",
          border: "border-red-600",
          progress: "bg-red-500",
        },
        icon: XCircle,
        message: "Za dużo słów (maksimum 5000)",
        isValid: false,
      };
  }
}

/**
 * Visual indicator for word count with color-coded feedback
 * Shows progress bar, status badge, and status message
 */
export function WordCountIndicator({ count, min, max }: WordCountIndicatorProps) {
  const status = getWordCountStatus(count, min, max);
  const { color, icon: Icon, message, isValid } = getStatusDisplay(status, count);

  // Calculate progress percentage (0-100%)
  const progressPercentage = Math.min((count / max) * 100, 100);

  return (
    <div className="space-y-2" data-test-id="create-plan-word-count">
      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all duration-300", color.progress)}
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`Liczba słów: ${count} z ${max}`}
        />
      </div>

      {/* Status Badge and Message */}
      <div className="flex items-center gap-2">
        <Badge className={cn("flex items-center gap-1 border", color.bg, color.text, color.border)} variant="outline">
          <Icon className="h-3 w-3" aria-hidden="true" />
          <span className="font-medium">{count}</span>
        </Badge>

        <span className={cn("text-sm font-medium", color.text)} role="status" aria-live="polite" aria-atomic="true">
          {message}
        </span>
      </div>

      {/* Screen reader only message */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isValid ? `Materiał zawiera ${count} słów. To jest prawidłowa długość.` : message}
      </div>
    </div>
  );
}
