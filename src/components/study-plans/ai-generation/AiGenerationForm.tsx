import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { TaxonomyLevel } from "@/types";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Loader2 } from "lucide-react";

const MIN_REQUESTED_SESSIONS = 1;
const MAX_REQUESTED_SESSIONS = 50;
const DEFAULT_REQUESTED_SESSIONS = 10;
const DEFAULT_TAXONOMY_LEVELS: TaxonomyLevel[] = ["understand", "apply", "analyze"];

const taxonomyLevelEnum = z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]);

export const AiGenerationFormSchema = z.object({
  requestedCount: z
    .number({
      required_error: "Enter the number of sessions to generate.",
      invalid_type_error: "Enter a valid number of sessions.",
    })
    .min(MIN_REQUESTED_SESSIONS, `Request at least ${MIN_REQUESTED_SESSIONS} session.`)
    .max(MAX_REQUESTED_SESSIONS, `Request no more than ${MAX_REQUESTED_SESSIONS} sessions.`),
  taxonomyLevels: z
    .array(taxonomyLevelEnum, {
      required_error: "Select at least one Bloom taxonomy level.",
      invalid_type_error: "Invalid taxonomy level selection.",
    })
    .min(1, "Select at least one Bloom taxonomy level.")
    .max(6, "You can select up to six taxonomy levels."),
});

export type AiGenerationFormValues = z.infer<typeof AiGenerationFormSchema>;

const TAXONOMY_LEVEL_OPTIONS: {
  value: TaxonomyLevel;
  label: string;
  description: string;
  example: string;
}[] = [
  {
    value: "remember",
    label: "Remember",
    description: "Recall facts, terms, and basic concepts.",
    example: "List three key definitions from your source material.",
  },
  {
    value: "understand",
    label: "Understand",
    description: "Explain ideas or concepts in your own words.",
    example: "Summarize the main argument of a chapter.",
  },
  {
    value: "apply",
    label: "Apply",
    description: "Use information in new situations.",
    example: "Use the formula from the text to solve a numeric problem.",
  },
  {
    value: "analyze",
    label: "Analyze",
    description: "Draw connections among ideas.",
    example: "Compare two theories and highlight their differences.",
  },
  {
    value: "evaluate",
    label: "Evaluate",
    description: "Justify decisions or critique viewpoints.",
    example: "Assess the strengths and weaknesses of an argument.",
  },
  {
    value: "create",
    label: "Create",
    description: "Produce new or original work.",
    example: "Design your own case study using the provided framework.",
  },
];

const DEFAULT_FORM_VALUES: AiGenerationFormValues = {
  requestedCount: DEFAULT_REQUESTED_SESSIONS,
  taxonomyLevels: DEFAULT_TAXONOMY_LEVELS,
};

export interface AiGenerationFormProps {
  defaultValues?: Partial<AiGenerationFormValues>;
  isSubmitting?: boolean;
  serverError?: string;
  onSubmit(values: AiGenerationFormValues): Promise<void> | void;
  onCancel?: () => void;
}

function mergeDefaultValues(values?: Partial<AiGenerationFormValues>): AiGenerationFormValues {
  return {
    requestedCount: values?.requestedCount ?? DEFAULT_FORM_VALUES.requestedCount,
    taxonomyLevels: values?.taxonomyLevels?.length ? values.taxonomyLevels : DEFAULT_FORM_VALUES.taxonomyLevels,
  };
}

export function AiGenerationForm({
  defaultValues,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: AiGenerationFormProps) {
  const form = useForm<AiGenerationFormValues>({
    resolver: zodResolver(AiGenerationFormSchema),
    defaultValues: mergeDefaultValues(defaultValues),
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(mergeDefaultValues(defaultValues));
  }, [defaultValues, form]);

  const handleSelectAll = () => {
    form.setValue(
      "taxonomyLevels",
      TAXONOMY_LEVEL_OPTIONS.map((option) => option.value),
      { shouldValidate: true }
    );
  };

  const handleClearAll = () => {
    form.setValue("taxonomyLevels", [], { shouldValidate: true });
  };

  const adjustRequestedCount = (delta: number) => {
    const nextValue = Math.min(
      MAX_REQUESTED_SESSIONS,
      Math.max(MIN_REQUESTED_SESSIONS, (form.getValues("requestedCount") ?? DEFAULT_REQUESTED_SESSIONS) + delta)
    );
    form.setValue("requestedCount", nextValue, { shouldDirty: true, shouldValidate: true });
  };

  const submitHandler = async (values: AiGenerationFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6" aria-live="polite">
        <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          Generation typically takes 30-60 seconds. You can stay on this screen while we prepare your sessions.
        </div>

        <FormField
          control={form.control}
          name="requestedCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of sessions</FormLabel>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="size-9 shrink-0"
                  onClick={() => adjustRequestedCount(-1)}
                  disabled={isSubmitting || field.value <= MIN_REQUESTED_SESSIONS}
                  aria-label="Decrease session count"
                >
                  -
                </Button>
                <FormControl>
                  <Input
                    type="number"
                    min={MIN_REQUESTED_SESSIONS}
                    max={MAX_REQUESTED_SESSIONS}
                    step={1}
                    inputMode="numeric"
                    className="text-center"
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const numericValue = Number(event.target.value);
                      if (Number.isNaN(numericValue)) {
                        field.onChange(MIN_REQUESTED_SESSIONS);
                        return;
                      }
                      field.onChange(numericValue);
                    }}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className="size-9 shrink-0"
                  onClick={() => adjustRequestedCount(1)}
                  disabled={isSubmitting || field.value >= MAX_REQUESTED_SESSIONS}
                  aria-label="Increase session count"
                >
                  +
                </Button>
              </div>
              <FormDescription>
                Request between {MIN_REQUESTED_SESSIONS} and {MAX_REQUESTED_SESSIONS} sessions per batch.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <fieldset className="space-y-4 rounded-lg border border-border px-4 py-4" aria-describedby="taxonomy-helper">
          <legend className="px-1 text-sm font-medium text-foreground">Bloom taxonomy levels</legend>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span id="taxonomy-helper">Select at least one level.</span>
            <button
              type="button"
              className="text-primary underline-offset-2 hover:underline"
              onClick={handleSelectAll}
              disabled={isSubmitting}
            >
              Select all
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              className="text-primary underline-offset-2 hover:underline"
              onClick={handleClearAll}
              disabled={isSubmitting}
            >
              Clear all
            </button>
          </div>

          <FormField
            control={form.control}
            name="taxonomyLevels"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {TAXONOMY_LEVEL_OPTIONS.map((option) => {
                    const checkboxId = `taxonomy-${option.value}`;
                    const checked = field.value?.includes(option.value) ?? false;
                    return (
                      <label
                        key={option.value}
                        htmlFor={checkboxId}
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-input bg-card px-3 py-3 text-sm transition hover:border-primary/50"
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={checked}
                          onCheckedChange={(next) => {
                            const current = field.value ?? [];
                            const isChecked = next === true;
                            if (isChecked) {
                              field.onChange([...current, option.value]);
                            } else {
                              field.onChange(current.filter((value) => value !== option.value));
                            }
                          }}
                          disabled={isSubmitting}
                        />
                        <span className="flex flex-1 flex-col gap-1">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            {option.label}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground transition hover:text-foreground"
                                  aria-label={`${option.label} description`}
                                >
                                  <Info className="size-4" aria-hidden="true" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold">{option.label}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">{option.description}</p>
                                <p className="mt-2 text-[11px] italic text-muted-foreground">
                                  Example: {option.example}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {isSubmitting ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Generating sessions... This may take 30-60 seconds.
          </p>
        ) : null}
      </form>
    </Form>
  );
}
