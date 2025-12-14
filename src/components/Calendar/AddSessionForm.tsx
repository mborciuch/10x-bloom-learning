import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addYears, format, isSameDay, subYears } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addSessionSchema, type AddSessionFormData } from "./addSessionSchema";
import { useExerciseTemplates } from "@/components/hooks/useExerciseTemplates";
import type { ExerciseTemplateDto, StudyPlanListItemDto } from "@/types";

interface AddSessionFormProps {
  studyPlans: StudyPlanListItemDto[];
  onSubmit: (data: AddSessionFormData) => Promise<void>;
  onCancel: () => void;
  defaultDate?: Date;
  exerciseTemplates?: ExerciseTemplateDto[];
  isLoadingTemplates?: boolean;
  templatesError?: string;
}

/**
 * Add Session Form component
 *
 * Complex form with React Hook Form + Zod validation
 * Allows creating new review sessions with:
 * - Study plan selection
 * - Date picker
 * - Exercise type (template or custom)
 * - Taxonomy level
 * - Questions/answers (textarea, one per line)
 * - Optional notes
 *
 * @example
 * <AddSessionForm
 *   studyPlans={plans}
 *   onSubmit={handleCreateSession}
 *   onCancel={() => setModalOpen(false)}
 *   defaultDate={selectedDate}
 * />
 */
export function AddSessionForm({
  studyPlans,
  onSubmit,
  onCancel,
  defaultDate,
  exerciseTemplates,
  isLoadingTemplates,
  templatesError,
}: AddSessionFormProps) {
  const shouldFetchTemplates = !exerciseTemplates;
  const {
    data: templatesPage,
    isLoading: isTemplatesQueryLoading,
    isError: isTemplatesQueryError,
    error: templatesQueryError,
  } = useExerciseTemplates({
    enabled: shouldFetchTemplates,
  });

  const templates = exerciseTemplates ?? templatesPage?.items ?? [];
  const templatesLoading = isLoadingTemplates ?? (shouldFetchTemplates && isTemplatesQueryLoading);
  const templatesLoadError =
    templatesError ??
    (isTemplatesQueryError
      ? templatesQueryError instanceof Error
        ? templatesQueryError.message
        : "Failed to load exercise templates"
      : undefined);

  const hasStudyPlans = studyPlans.length > 0;

  const computeResetValues = (): AddSessionFormData => ({
    studyPlanId: hasStudyPlans ? studyPlans[0].id : "",
    reviewDate: defaultDate ?? new Date(),
    exerciseType: "custom",
    exerciseTemplateId: undefined,
    customExerciseLabel: "",
    taxonomyLevel: "remember",
    questionsText: "",
    answersText: "",
    notes: "",
  });

  const form = useForm<AddSessionFormData>({
    resolver: zodResolver(addSessionSchema),
    defaultValues: computeResetValues(),
  });

  const exerciseType = form.watch("exerciseType");
  const isSubmitting = form.formState.isSubmitting;
  const disableSubmit = !hasStudyPlans || isSubmitting;

  const { min: minDate, max: maxDate } = useMemo(() => {
    const now = new Date();
    const minBoundary = subYears(new Date(now), 1);
    const maxBoundary = addYears(new Date(now), 5);
    minBoundary.setHours(0, 0, 0, 0);
    maxBoundary.setHours(23, 59, 59, 999);
    return { min: minBoundary, max: maxBoundary };
  }, []);

  useEffect(() => {
    if (!hasStudyPlans) {
      form.setValue("studyPlanId", "");
      return;
    }

    const currentPlanId = form.getValues("studyPlanId");
    const planStillExists = studyPlans.some((plan) => plan.id === currentPlanId);

    if (!currentPlanId || !planStillExists) {
      form.setValue("studyPlanId", studyPlans[0].id);
    }
  }, [form, hasStudyPlans, studyPlans]);

  useEffect(() => {
    if (!defaultDate) {
      return;
    }

    const currentDate = form.getValues("reviewDate");

    if (!currentDate || !isSameDay(currentDate, defaultDate)) {
      form.setValue("reviewDate", defaultDate);
    }
  }, [defaultDate, form]);

  const handleSubmit = async (data: AddSessionFormData) => {
    try {
      await onSubmit(data);
      form.reset(computeResetValues());
    } catch (error) {
      // Error handling is done in parent component (with toast)
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    form.reset(computeResetValues());
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Study Plan Selection */}
        <FormField
          control={form.control}
          name="studyPlanId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Study Plan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={!hasStudyPlans}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a study plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {studyPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!hasStudyPlans && (
                <FormDescription className="text-destructive">
                  You need an active study plan before adding review sessions.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Review Date */}
        <FormField
          control={form.control}
          name="reviewDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Review Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className="w-full pl-3 text-left font-normal">
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => date && field.onChange(date)}
                    disabled={(date) => date < minDate || date > maxDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>Date must be within 1 year in the past and 5 years in the future.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Exercise Type */}
        <FormField
          control={form.control}
          name="exerciseType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Exercise Type</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="custom" />
                    </FormControl>
                    <FormLabel className="font-normal">Custom Exercise</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="template" />
                    </FormControl>
                    <FormLabel className="font-normal">Use Template</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional: Template Select OR Custom Label */}
        {exerciseType === "template" ? (
          <FormField
            control={form.control}
            name="exerciseTemplateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exercise Template</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                  disabled={templatesLoading || templates.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                    {templates.length === 0 && (
                      <SelectItem value="__no-templates" disabled>
                        No templates available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose from predefined exercise templates.
                  {templatesLoadError && <span className="block text-destructive">{templatesLoadError}</span>}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="customExerciseLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exercise Label</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Vocabulary Quiz, Grammar Review" {...field} />
                </FormControl>
                <FormDescription>Min 3 characters, max 200</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Taxonomy Level */}
        <FormField
          control={form.control}
          name="taxonomyLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bloom&apos;s Taxonomy Level</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select taxonomy level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="remember">Remember</SelectItem>
                  <SelectItem value="understand">Understand</SelectItem>
                  <SelectItem value="apply">Apply</SelectItem>
                  <SelectItem value="analyze">Analyze</SelectItem>
                  <SelectItem value="evaluate">Evaluate</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Cognitive complexity level</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Questions */}
        <FormField
          control={form.control}
          name="questionsText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Questions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Enter questions (one per line)
Question 1
Question 2
...`}
                  className="min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>One question per line (min 1, max 50)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Answers */}
        <FormField
          control={form.control}
          name="answersText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Answers</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Enter answers (one per line)
Answer 1
Answer 2
...`}
                  className="min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>Must match number of questions</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes (Optional) */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes..." className="min-h-[80px] resize-y" {...field} />
              </FormControl>
              <FormDescription>Max 1000 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={disableSubmit}>
            {isSubmitting ? "Creating..." : "Create Session"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
