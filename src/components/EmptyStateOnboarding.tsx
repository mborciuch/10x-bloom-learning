import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ArrowRight } from "lucide-react";

interface EmptyStateOnboardingProps {
  /**
   * Optional custom handler for create button click
   * Default: navigates to /app/plans/new
   */
  onCreateClick?: () => void;
}

/**
 * Empty State component displayed when user has no study plans
 * Shows welcome message and CTA to create first plan
 *
 * @example
 * <EmptyStateOnboarding />
 *
 * @example with custom handler
 * <EmptyStateOnboarding onCreateClick={customHandler} />
 */
export function EmptyStateOnboarding({ onCreateClick }: EmptyStateOnboardingProps) {
  const handleCreatePlan = useCallback(() => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      window.location.href = "/app/plans/new";
    }
  }, [onCreateClick]);

  return (
    <section className="flex items-center justify-center min-h-[60vh] p-4" aria-labelledby="empty-state-heading">
      <Card className="max-w-md w-full text-center shadow-lg">
        <CardContent className="pt-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <BookOpen className="text-primary" size={64} />
          </div>

          {/* Heading */}
          <h2 id="empty-state-heading" className="text-2xl font-bold mb-3 text-foreground">
            Welcome to Bloom Learning!
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            Create your first study plan to start organizing your learning journey with AI-powered repetitions.
          </p>

          {/* CTA Button */}
          <Button size="lg" onClick={handleCreatePlan} className="w-full sm:w-auto">
            Create Your First Study Plan
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
