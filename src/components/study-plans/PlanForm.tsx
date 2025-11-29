/* eslint-disable react-compiler/react-compiler */
// Disabled react-compiler for this file due to window.location redirects in error handlers
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { StudyPlanDetailsDto, CreateStudyPlanCommand } from "@/types";
import { CreateStudyPlanFormSchema, INITIAL_FORM_VALUES } from "./planFormSchema";
import type { CreateStudyPlanFormData } from "./planFormSchema";
import { TitleInput } from "./TitleInput";
import { SourceMaterialTextarea } from "./SourceMaterialTextarea";
import { WordCountIndicator } from "./WordCountIndicator";
import { FormActions } from "./FormActions";
import { useWordCount } from "@/lib/hooks/useWordCount";
import { useAutoSaveDraft } from "@/lib/hooks/useAutoSaveDraft";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import { loadDraft, clearDraft } from "@/lib/utils/local-storage";
import { createStudyPlan, APIError } from "@/lib/api/study-plans";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface PlanFormProps {
  onSuccess?: (plan: StudyPlanDetailsDto) => void;
  onCancel?: () => void;
}

/**
 * Main form component for creating a study plan
 * Manages form state, validation, auto-save, and submission
 */
export function PlanForm({ onSuccess, onCancel }: PlanFormProps) {
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [draftData, setDraftData] = useState<CreateStudyPlanFormData | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Setup React Hook Form with Zod validation
  const {
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty, isValid },
    setValue,
    setError,
  } = useForm<CreateStudyPlanFormData>({
    resolver: zodResolver(CreateStudyPlanFormSchema),
    defaultValues: INITIAL_FORM_VALUES,
    mode: "onChange", // Real-time validation
  });

  // Watch form values
  const title = watch("title");
  const sourceMaterial = watch("sourceMaterial");
  const formData = watch();

  // Calculate word count with debounce
  const wordCount = useWordCount(sourceMaterial);

  // Auto-save draft to localStorage
  useAutoSaveDraft(formData, isDirty);

  // Warn before leaving page with unsaved changes
  useUnsavedChangesWarning(isDirty);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setDraftData({
        title: draft.title,
        sourceMaterial: draft.sourceMaterial,
      });
      setShowDraftDialog(true);
    }
  }, []);

  // Handle draft restoration
  const handleRestoreDraft = () => {
    if (draftData) {
      setValue("title", draftData.title, { shouldDirty: true, shouldValidate: true });
      setValue("sourceMaterial", draftData.sourceMaterial, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setShowDraftDialog(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftDialog(false);
  };

  // Handle cancel with confirmation if dirty
  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      onCancel?.();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onCancel?.();
  };

  // Submit handler with comprehensive error handling
  const onSubmit = async (data: CreateStudyPlanFormData) => {
    try {
      // Prepare API command
      const command: CreateStudyPlanCommand = {
        title: data.title.trim(),
        sourceMaterial: data.sourceMaterial.trim(),
      };

      // Call API
      const createdPlan = await createStudyPlan(command);

      // Success
      clearDraft(); // Remove draft from localStorage
      toast.success("Plan utworzony pomyślnie");

      // Callback will handle redirect
      onSuccess?.(createdPlan);
    } catch (error) {
      // Handle API errors
      if (error instanceof APIError) {
        switch (error.code) {
          case "DUPLICATE_TITLE":
            // Duplicate title error - set error on title field
            setError("title", {
              type: "manual",
              message: "Plan o tym tytule już istnieje. Wybierz inny tytuł.",
            });
            // Focus on title field
            document.getElementById("title")?.focus();
            break;

          case "VALIDATION_ERROR":
            // Server-side validation error
            toast.error("Sprawdź poprawność wypełnionych pól");
            // If there are field-specific errors in details, set them
            if (error.details && Array.isArray(error.details)) {
              error.details.forEach((detail: { path?: string[]; message?: string }) => {
                if (detail.path && detail.path.length > 0) {
                  const fieldName = detail.path[0] as keyof CreateStudyPlanFormData;
                  if (fieldName === "title" || fieldName === "sourceMaterial") {
                    setError(fieldName, {
                      type: "manual",
                      message: detail.message || "Invalid value",
                    });
                  }
                }
              });
            }
            break;

          case "UNAUTHORIZED":
            // Session expired - save draft and redirect to login
            toast.error("Sesja wygasła. Zaloguj się ponownie.");
            setTimeout(() => {
              window.location.href = "/login?returnUrl=/app/plans/new";
            }, 1500);
            break;

          case "NETWORK_ERROR":
            // Network error - offer retry
            toast.error("Brak połączenia. Sprawdź internet i spróbuj ponownie.", {
              action: {
                label: "Spróbuj ponownie",
                onClick: () => handleSubmit(onSubmit)(),
              },
            });
            break;

          case "INTERNAL_SERVER_ERROR":
            // Server error
            toast.error("Wystąpił błąd serwera. Spróbuj ponownie później.");
            console.error("[Server Error]", error);
            break;

          default:
            // Unknown API error
            toast.error("Nie udało się utworzyć planu. Spróbuj ponownie.");
            console.error("[API Error]", error);
        }
      } else {
        // Unexpected error (JavaScript error, etc.)
        toast.error("Wystąpił nieoczekiwany błąd");
        console.error("[Unexpected Error]", error);
      }
    }
  };

  // Get disabled reason for submit button tooltip
  const getDisabledReason = (): string | undefined => {
    if (!title.trim()) return "Wprowadź tytuł planu";
    if (title.length > 200) return "Tytuł może mieć maksymalnie 200 znaków";
    if (!sourceMaterial.trim()) return "Wklej materiał źródłowy";
    if (wordCount < 200) return "Materiał musi zawierać co najmniej 200 słów";
    if (wordCount > 5000) return "Materiał może zawierać maksymalnie 5000 słów";
    return undefined;
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title Input */}
        <TitleInput
          value={title}
          onChange={(value) => setValue("title", value, { shouldValidate: true })}
          error={errors.title}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />

        {/* Source Material Textarea */}
        <SourceMaterialTextarea
          value={sourceMaterial}
          onChange={(value) => setValue("sourceMaterial", value, { shouldValidate: true })}
          error={errors.sourceMaterial}
          wordCount={wordCount}
        />

        {/* Word Count Indicator */}
        <WordCountIndicator count={wordCount} min={200} max={5000} />

        {/* Form Actions */}
        <FormActions
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          isValid={isValid}
          disabledReason={getDisabledReason()}
        />
      </form>

      {/* Draft Restoration Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Znaleziono niezapisany draft</AlertDialogTitle>
            <AlertDialogDescription>
              Masz niezapisane zmiany z poprzedniej sesji. Czy chcesz je przywrócić?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>Odrzuć</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDraft}>Przywróć</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masz niezapisane zmiany</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz opuścić tę stronę? Twoje zmiany zostaną zapisane jako draft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>Opuść</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
