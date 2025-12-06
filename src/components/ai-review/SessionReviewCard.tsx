import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { ReviewSessionDto, TaxonomyLevel, UpdateReviewSessionCommand } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useFieldArray, type FieldValues } from "react-hook-form";

interface SessionReviewCardProps {
  session: ReviewSessionDto;
  templateName?: string;
  isBusy?: boolean;
  isSaving?: boolean;
  onAccept?(sessionId: string): void;
  onReject?(sessionId: string): void;
  onSave?(sessionId: string, updates: Partial<UpdateReviewSessionCommand>): Promise<void> | void;
  onDirtyChange?(sessionId: string, isDirty: boolean): void;
}

interface SessionFormValues extends FieldValues {
  reviewDate: Date | null;
  exerciseLabel: string;
  taxonomyLevel: TaxonomyLevel;
  questions: string[];
  answers: string[];
  hints: string[];
}
const TAXONOMY_OPTIONS: { value: TaxonomyLevel; label: string }[] = [
  { value: "remember", label: "Remember" },
  { value: "understand", label: "Understand" },
  { value: "apply", label: "Apply" },
  { value: "analyze", label: "Analyze" },
  { value: "evaluate", label: "Evaluate" },
  { value: "create", label: "Create" },
];

function toFormValues(session: ReviewSessionDto): SessionFormValues {
  return {
    reviewDate: session.reviewDate ? new Date(session.reviewDate) : null,
    exerciseLabel: session.exerciseLabel ?? "",
    taxonomyLevel: session.taxonomyLevel,
    questions: [...session.content.questions],
    answers: [...session.content.answers],
    hints: session.content.hints ? [...session.content.hints] : [],
  };
}
export function SessionReviewCard({
  session,
  templateName,
  isBusy,
  isSaving,
  onAccept,
  onReject,
  onSave,
  onDirtyChange,
}: SessionReviewCardProps) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reviewDateLabel = session.reviewDate ? format(new Date(session.reviewDate), "EEEE, MMM d, yyyy") : "No date";

  const form = useForm<SessionFormValues>({
    defaultValues: toFormValues(session),
    mode: "onChange",
  });

  const questionsArray = useFieldArray<SessionFormValues, "questions">({
    control: form.control,
    name: "questions" as const,
  });

  const answersArray = useFieldArray<SessionFormValues, "answers">({
    control: form.control,
    name: "answers" as const,
  });

  const hintsArray = useFieldArray<SessionFormValues, "hints">({
    control: form.control,
    name: "hints" as const,
  });

  useEffect(() => {
    form.reset(toFormValues(session));
  }, [session, form]);

  useEffect(() => {
    onDirtyChange?.(session.id, form.formState.isDirty);
    return () => {
      onDirtyChange?.(session.id, false);
    };
  }, [form.formState.isDirty, onDirtyChange, session.id]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const trimmedLabel = values.exerciseLabel.trim();
    if (!trimmedLabel) {
      setErrorMessage("Exercise label is required.");
      return;
    }

    const cleanedQuestions = values.questions.map((q) => q.trim()).filter((q) => q.length > 0);
    const cleanedAnswers = values.answers.map((a) => a.trim()).filter((a) => a.length > 0);

    if (cleanedQuestions.length === 0) {
      setErrorMessage("Provide at least one question.");
      return;
    }

    if (cleanedQuestions.length !== cleanedAnswers.length) {
      setErrorMessage("Questions and answers counts must match.");
      return;
    }

    const cleanedHints = values.hints.map((h) => h.trim()).filter((h) => h.length > 0);

    const payload: Partial<UpdateReviewSessionCommand> = {
      reviewDate: values.reviewDate ? format(values.reviewDate, "yyyy-MM-dd") : undefined,
      exerciseLabel: trimmedLabel,
      taxonomyLevel: values.taxonomyLevel,
      content: {
        questions: cleanedQuestions,
        answers: cleanedAnswers,
        hints: cleanedHints.length > 0 ? cleanedHints : undefined,
      },
    };

    await onSave?.(session.id, payload);
    form.reset(values);
  });

  const acceptDisabled = isBusy || isSaving;
  const submitDisabled = isBusy || isSaving || !form.formState.isDirty || !form.formState.isValid;

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden border border-border/70 bg-card">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{session.exerciseLabel ?? "Untitled exercise"}</p>
              {form.formState.isDirty ? <Badge variant="secondary">Edited</Badge> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{reviewDateLabel}</span>
              <span aria-hidden="true">•</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {session.taxonomyLevel}
              </Badge>
              {session.isAiGenerated ? (
                <>
                  <span aria-hidden="true">•</span>
                  <Badge variant="outline" className="text-xs">
                    AI generated
                  </Badge>
                </>
              ) : null}
              <span aria-hidden="true">•</span>
              <Badge variant="outline" className="text-xs capitalize">
                {session.status}
              </Badge>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={open ? "Collapse details" : "Expand details"}>
              <ChevronDown className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="border-t border-border/60 bg-muted/30 px-4 py-4">
          <Form {...form}>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="exerciseLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Case study review" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reviewDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Review date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className="justify-start pl-3 text-left font-normal">
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxonomyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bloom level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TAXONOMY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Exercise template</FormLabel>
                  <FormControl>
                    <Input value={templateName ?? session.exerciseTemplateId ?? "Custom"} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs uppercase text-muted-foreground">Questions</p>
                  {questionsArray.fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`questions.${index}`}
                      render={({ field: questionField }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Question {index + 1}</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...questionField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase text-muted-foreground">Answers</p>
                  {answersArray.fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`answers.${index}`}
                      render={({ field: answerField }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Answer {index + 1}</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...answerField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase text-muted-foreground">Hints</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => hintsArray.append("")}
                    disabled={isBusy || isSaving}
                  >
                    <Plus className="mr-1 size-4" />
                    Add hint
                  </Button>
                </div>
                {hintsArray.fields.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hints added.</p>
                ) : (
                  hintsArray.fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`hints.${index}`}
                      render={({ field: hintField }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Hint {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => hintsArray.remove(index)}
                              disabled={isBusy || isSaving}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Remove hint</span>
                            </Button>
                          </FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...hintField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))
                )}
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Save edits before accepting or rejecting.</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => form.reset(toFormValues(session))}
                    disabled={isBusy || isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitDisabled}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onReject?.(session.id)}
                    disabled={acceptDisabled}
                  >
                    Reject
                  </Button>
                  <Button type="button" onClick={() => onAccept?.(session.id)} disabled={acceptDisabled}>
                    Accept
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
