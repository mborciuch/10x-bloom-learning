import { z } from "zod";

/**
 * Zod schema for Add Session Form validation
 *
 * Validates:
 * - Study plan selection (required UUID)
 * - Review date (required, within range)
 * - Exercise type (template or custom)
 * - Exercise label (conditional validation)
 * - Taxonomy level (required enum)
 * - Questions and answers (matching counts)
 * - Notes (optional, max length)
 */
export const addSessionSchema = z
  .object({
    studyPlanId: z.string().uuid("Please select a valid study plan"),

    reviewDate: z.date({
      required_error: "Review date is required",
      invalid_type_error: "Please select a valid date",
    }),

    exerciseType: z.enum(["template", "custom"], {
      required_error: "Please select exercise type",
    }),

    exerciseTemplateId: z.string().uuid().optional(),

    customExerciseLabel: z.string().optional(),

    taxonomyLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"], {
      required_error: "Please select taxonomy level",
    }),

    questionsText: z.string().min(1, "At least one question is required"),

    answersText: z.string().min(1, "At least one answer is required"),

    notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
  })
  .refine(
    (data) => {
      // If custom, customExerciseLabel is required
      if (data.exerciseType === "custom") {
        return (
          !!data.customExerciseLabel &&
          data.customExerciseLabel.trim().length >= 3 &&
          data.customExerciseLabel.length <= 200
        );
      }
      return true;
    },
    {
      message: "Custom exercise label must be between 3 and 200 characters",
      path: ["customExerciseLabel"],
    }
  )
  .refine(
    (data) => {
      // If template, exerciseTemplateId is required
      if (data.exerciseType === "template") {
        return !!data.exerciseTemplateId;
      }
      return true;
    },
    {
      message: "Please select an exercise template",
      path: ["exerciseTemplateId"],
    }
  )
  .refine(
    (data) => {
      // Date range validation: not more than 1 year in past or 5 years in future
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      const fiveYearsFromNow = new Date(today);
      fiveYearsFromNow.setFullYear(today.getFullYear() + 5);

      return data.reviewDate >= oneYearAgo && data.reviewDate <= fiveYearsFromNow;
    },
    {
      message: "Date must be within 1 year in the past and 5 years in the future",
      path: ["reviewDate"],
    }
  )
  .refine(
    (data) => {
      // Questions count validation (max 50)
      const questions = data.questionsText.split("\n").filter((q) => q.trim().length > 0);
      return questions.length <= 50;
    },
    {
      message: "Maximum 50 questions allowed",
      path: ["questionsText"],
    }
  )
  .refine(
    (data) => {
      // Answers must match questions count
      const questions = data.questionsText.split("\n").filter((q) => q.trim().length > 0);
      const answers = data.answersText.split("\n").filter((a) => a.trim().length > 0);
      return questions.length === answers.length;
    },
    {
      message: "Number of answers must match number of questions",
      path: ["answersText"],
    }
  );

export type AddSessionFormData = z.infer<typeof addSessionSchema>;
