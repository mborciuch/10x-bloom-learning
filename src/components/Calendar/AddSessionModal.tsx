import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { AddSessionForm } from "./AddSessionForm";
import { useCreateSession } from "@/components/hooks/useReviewSessionMutations";
import { useExerciseTemplates } from "@/components/hooks/useExerciseTemplates";
import type { AddSessionFormData } from "./addSessionSchema";
import type { StudyPlanListItemDto, CreateReviewSessionCommand } from "@/types";

interface AddSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyPlans: StudyPlanListItemDto[];
  defaultDate?: Date;
}

/**
 * Add Session Modal component
 *
 * Dialog wrapper for AddSessionForm
 * Handles form submission and CreateReviewSessionCommand mapping
 *
 * @example
 * <AddSessionModal
 *   open={isModalOpen}
 *   onOpenChange={setIsModalOpen}
 *   studyPlans={plans}
 *   defaultDate={selectedDate}
 * />
 */
export function AddSessionModal({ open, onOpenChange, studyPlans, defaultDate }: AddSessionModalProps) {
  const createSessionMutation = useCreateSession();
  const {
    data: templatesPage,
    isLoading: isTemplatesLoading,
    isError: isTemplatesError,
    error: templatesError,
  } = useExerciseTemplates({
    enabled: open,
  });
  const templates = templatesPage?.items ?? [];
  const templatesErrorMessage =
    isTemplatesError && templatesError
      ? templatesError instanceof Error
        ? templatesError.message
        : "Failed to load exercise templates"
      : undefined;

  const handleSubmit = async (formData: AddSessionFormData) => {
    try {
      // Transform form data to CreateReviewSessionCommand
      const sanitizeMultilineInput = (value: string) =>
        value
          .split("\n")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0);

      const questions = sanitizeMultilineInput(formData.questionsText);
      const answers = sanitizeMultilineInput(formData.answersText);

      const exerciseLabel =
        formData.exerciseType === "custom"
          ? formData.customExerciseLabel?.trim() || "Custom Exercise"
          : templates.find((template) => template.id === formData.exerciseTemplateId)?.name || "Template Exercise";

      const command: CreateReviewSessionCommand = {
        studyPlanId: formData.studyPlanId,
        exerciseLabel,
        exerciseTemplateId: formData.exerciseType === "template" ? formData.exerciseTemplateId : undefined,
        reviewDate: format(formData.reviewDate, "yyyy-MM-dd"),
        taxonomyLevel: formData.taxonomyLevel,
        content: {
          questions,
          answers,
        },
        notes: formData.notes?.trim() || undefined,
      };

      await createSessionMutation.mutateAsync(command);

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      // Error is handled by mutation hook (with toast)
      // Form stays open so user can retry
      console.error("Failed to create session:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Review Session</DialogTitle>
          <DialogDescription>
            Create a new review session for your study plan. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <AddSessionForm
          studyPlans={studyPlans}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          defaultDate={defaultDate}
          exerciseTemplates={templates}
          isLoadingTemplates={isTemplatesLoading}
          templatesError={templatesErrorMessage}
        />
      </DialogContent>
    </Dialog>
  );
}
