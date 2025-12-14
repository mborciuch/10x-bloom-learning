import type { StudyPlanListItemDto } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AiGenerationForm, type AiGenerationFormValues } from "./AiGenerationForm";

export interface AiGenerationDialogProps {
  open: boolean;
  plan?: StudyPlanListItemDto | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onOpenChange?(open: boolean): void;
  onSubmit(values: AiGenerationFormValues): Promise<void> | void;
}
/**
 * Dialog wrapper for the AI generation form. Responsible for rendering the shadcn Dialog shell
 * while delegating the actual form logic to `AiGenerationForm`.
 */
export function AiGenerationDialog({
  open,
  plan,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: AiGenerationDialogProps) {
  const planTitle = plan?.title ?? "this study plan";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange?.(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate AI sessions</DialogTitle>
          <DialogDescription>
            Choose how many sessions you need and which Bloom taxonomy levels we should cover for{" "}
            <span className="font-medium text-foreground">&ldquo;{planTitle}&rdquo;</span>.
          </DialogDescription>
        </DialogHeader>

        <AiGenerationForm
          isSubmitting={isSubmitting}
          serverError={errorMessage ?? undefined}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange?.(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
