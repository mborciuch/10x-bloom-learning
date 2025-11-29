import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/**
 * Error state component with retry functionality
 * Displays user-friendly error message with optional retry button
 *
 * @param title - Error title (optional)
 * @param message - Error message to display
 * @param onRetry - Callback function for retry button (optional)
 *
 * @example
 * <ErrorState
 *   message="Failed to load your study plans"
 *   onRetry={() => refetch()}
 * />
 */
export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md px-4">
        <AlertCircle className="mx-auto mb-4 text-destructive" size={48} />
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-4">{message}</p>
        {onRetry && <Button onClick={onRetry}>Try Again</Button>}
      </div>
    </div>
  );
}
