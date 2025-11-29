import { z } from "zod";
import { countWords } from "@/lib/utils/word-count";

/**
 * Validation schema for Create Study Plan form
 * Uses Zod for type-safe validation with custom word count refinements
 */
export const CreateStudyPlanFormSchema = z.object({
  title: z.string().trim().min(1, "Tytuł jest wymagany").max(200, "Tytuł może mieć maksymalnie 200 znaków"),

  sourceMaterial: z
    .string()
    .trim()
    .min(1, "Materiał źródłowy jest wymagany")
    .refine(
      (val) => {
        const wordCount = countWords(val);
        return wordCount >= 200;
      },
      { message: "Materiał musi zawierać co najmniej 200 słów" }
    )
    .refine(
      (val) => {
        const wordCount = countWords(val);
        return wordCount <= 5000;
      },
      { message: "Materiał może zawierać maksymalnie 5000 słów" }
    ),
});

/**
 * Type inference from schema
 */
export type CreateStudyPlanFormData = z.infer<typeof CreateStudyPlanFormSchema>;

/**
 * Initial form values
 */
export const INITIAL_FORM_VALUES: CreateStudyPlanFormData = {
  title: "",
  sourceMaterial: "",
};
