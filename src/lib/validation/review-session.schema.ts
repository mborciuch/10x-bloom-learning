import { z } from "zod";

const reviewStatusValues = ["proposed", "accepted", "rejected"] as const;
const taxonomyLevelValues = ["remember", "understand", "apply", "analyze", "evaluate", "create"] as const;

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Invalid date format, expected YYYY-MM-DD",
});

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
  .transform((data) => {
    const { planId, studyPlanId, ...rest } = data;

    return {
      studyPlanId: studyPlanId ?? planId,
      ...rest,
    };
  });

export type ReviewSessionListQuerySchemaInput = z.infer<typeof ReviewSessionListQuerySchema>;
