import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

export interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isValid: boolean;
  disabledReason?: string;
}

/**
 * Form action buttons container with Cancel and Submit buttons
 * Responsive layout: column on mobile, row on desktop
 */
export function FormActions({ onCancel, isSubmitting, isValid, disabledReason }: FormActionsProps) {
  const isDisabled = !isValid || isSubmitting;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      {/* Cancel Button */}
      <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
        Anuluj
      </Button>

      {/* Submit Button with Tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <span tabIndex={isDisabled ? 0 : -1}>
            <Button type="submit" disabled={isDisabled} aria-label={isDisabled ? disabledReason : "Utwórz plan nauki"}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tworzenie...
                </>
              ) : (
                "Utwórz plan"
              )}
            </Button>
          </span>
        </TooltipTrigger>
        {isDisabled && disabledReason && (
          <TooltipContent side="top" sideOffset={8}>
            <p>{disabledReason}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
