interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

/**
 * Reusable loading spinner component with accessibility support
 *
 * @param size - Spinner size variant (sm, md, lg)
 * @param label - Accessible label for screen readers
 *
 * @example
 * <LoadingSpinner label="Loading study plans..." />
 */
export function LoadingSpinner({ size = "md", label = "Loading..." }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <div className={`animate-spin rounded-full border-4 border-primary border-t-transparent ${sizeClasses[size]}`} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
