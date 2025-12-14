import { z } from "zod";

const reviewStatusValues = ["proposed", "accepted", "rejected"] as const;
const taxonomyLevelValues = ["remember", "understand", "apply", "analyze", "evaluate", "create"] as const;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Invalid date format, expected YYYY-MM-DD",
});

const isoDateTimeSchema = z.string().datetime({
  message: "Invalid datetime format, expected ISO 8601 string",
});

const nonEmptyTrimmedString = z
  .string()
  .trim()
  .min(1, "Value cannot be empty")
  .max(2000, "Value cannot exceed 2000 characters");

export const ReviewSessionContentSchema = z
  .object({
    questions: z
      .array(nonEmptyTrimmedString.max(500, "Question cannot exceed 500 characters"))
      .min(1, "At least one question is required"),
    answers: z
      .array(nonEmptyTrimmedString.max(500, "Answer cannot exceed 500 characters"))
      .min(1, "At least one answer is required"),
    hints: z.array(nonEmptyTrimmedString.max(500, "Hint cannot exceed 500 characters")).optional(),
  })
  .refine((data) => data.questions.length === data.answers.length, {
    path: ["answers"],
    message: "questions and answers arrays must contain the same number of items",
  })
  .refine(
    (data) => {
      if (!data.hints || data.hints.length === 0) {
        return true;
      }
      return data.hints.length === data.questions.length;
    },
    {
      path: ["hints"],
      message: "hints length must match questions length when provided",
    }
  );

/**
 * Query schema for GET /api/review-sessions
 *
 * Supports calendar-style filtering by date range and optional study plan,
 * as well as additional filters for status, completion and AI generation.
 *
 * Note: `planId` is kept as an alias for `studyPlanId` to support existing
 * frontend code. The transformed output exposes only `studyPlanId`.
 */
export const ReviewSessionListQuerySchema = z
  .object({
    // Alias used by existing frontend hook
    planId: z.string().uuid().optional().describe("Alias for studyPlanId used by calendar view"),

    studyPlanId: z.string().uuid().optional().describe("Filter sessions by study plan ID"),

    dateFrom: dateStringSchema.optional().describe("Start of date range filter (inclusive, YYYY-MM-DD)"),
    dateTo: dateStringSchema.optional().describe("End of date range filter (inclusive, YYYY-MM-DD)"),

    status: z.enum(reviewStatusValues).optional().describe("Filter by review session status"),

    isCompleted: z.coerce.boolean().optional().describe("Filter by completion flag"),

    taxonomyLevel: z.enum(taxonomyLevelValues).optional().describe("Filter by Bloom taxonomy level"),

    isAiGenerated: z.coerce.boolean().optional().describe("Filter AI-generated vs manual sessions"),

    page: z.coerce
      .number({ invalid_type_error: "Page must be a number" })
      .int("Page must be an integer")
      .min(1, "Page must be at least 1")
      .default(1)
      .describe("Page number, starting from 1"),

    pageSize: z.coerce
      .number({ invalid_type_error: "Page size must be a number" })
      .int("Page size must be an integer")
      .min(1, "Page size must be at least 1")
      .max(200, "Page size cannot exceed 200")
      .default(100)
      .describe("Number of items per page"),

    sort: z
      .enum(["review_date"])
      .default("review_date")
      .describe("Sort field (currently only review_date is supported)"),

    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Sort order direction"),
  })
  .strict()
  .refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return data.dateFrom <= data.dateTo;
      }
      return true;
    },
    {
      message: "dateFrom must be before or equal to dateTo",
      path: ["dateFrom"],
    }
  )
  .refine(
    (data) => {
      if (data.planId && data.studyPlanId) {
        return data.planId === data.studyPlanId;
      }
      return true;
    },
    {
      message: "planId and studyPlanId must match when both are provided",
      path: ["studyPlanId"],
    }
  )
  .transform((data) => {
    const { planId, studyPlanId, ...rest } = data;

    return {
      studyPlanId: studyPlanId ?? planId,
      ...rest,
    };
  });

export type ReviewSessionListQuerySchemaInput = z.infer<typeof ReviewSessionListQuerySchema>;

export const CreateReviewSessionSchema = z
  .object({
    studyPlanId: z.string().uuid({ message: "studyPlanId must be a valid UUID" }),
    exerciseTemplateId: z.string().uuid({ message: "exerciseTemplateId must be a valid UUID" }).optional(),
    exerciseLabel: z
      .string({ required_error: "exerciseLabel is required" })
      .trim()
      .min(1, "exerciseLabel cannot be empty")
      .max(200, "exerciseLabel cannot exceed 200 characters"),
    reviewDate: dateStringSchema,
    taxonomyLevel: z.enum(taxonomyLevelValues),
    content: ReviewSessionContentSchema,
    notes: z.string().trim().max(2000, "notes cannot exceed 2000 characters").optional(),
  })
  .strict();

export type CreateReviewSessionSchemaInput = z.infer<typeof CreateReviewSessionSchema>;

export const UpdateReviewSessionSchema = z
  .object({
    reviewDate: dateStringSchema.optional(),
    exerciseTemplateId: z.string().uuid({ message: "exerciseTemplateId must be a valid UUID" }).optional(),
    exerciseLabel: z
      .string()
      .trim()
      .min(1, "exerciseLabel cannot be empty")
      .max(200, "exerciseLabel cannot exceed 200 characters")
      .optional(),
    taxonomyLevel: z.enum(taxonomyLevelValues).optional(),
    status: z.enum(reviewStatusValues).optional(),
    content: ReviewSessionContentSchema.optional(),
    notes: z.string().trim().max(2000, "notes cannot exceed 2000 characters").optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided for update",
    path: [],
  });

export type UpdateReviewSessionSchemaInput = z.infer<typeof UpdateReviewSessionSchema>;

export const CompleteReviewSessionSchema = z
  .object({
    completedAt: isoDateTimeSchema.optional(),
  })
  .strict();

export type CompleteReviewSessionSchemaInput = z.infer<typeof CompleteReviewSessionSchema>;

export const SubmitReviewSessionFeedbackSchema = z
  .object({
    rating: z
      .number({
        required_error: "rating is required",
        invalid_type_error: "rating must be a number",
      })
      .int("rating must be an integer")
      .min(1, "rating must be between 1 and 5")
      .max(5, "rating must be between 1 and 5"),
    comment: z
      .string({
        invalid_type_error: "comment must be a string",
      })
      .trim()
      .max(2000, "comment cannot exceed 2000 characters")
      .optional(),
  })
  .strict();

export type SubmitReviewSessionFeedbackSchemaInput = z.infer<typeof SubmitReviewSessionFeedbackSchema>;
