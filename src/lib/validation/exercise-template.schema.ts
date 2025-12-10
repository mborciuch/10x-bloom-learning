import { z } from "zod";

const taxonomyLevelValues = ["remember", "understand", "apply", "analyze", "evaluate", "create"] as const;

/**
 * Query schema for GET /api/exercise-templates
 *
 * Supports filtering by activation status, taxonomy level, search term
 * and pagination controls.
 */
export const ExerciseTemplateListQuerySchema = z
  .object({
    isActive: z
      .coerce.boolean({ invalid_type_error: "isActive must be a boolean" })
      .optional()
      .default(true)
      .describe("Filter templates by activation flag (default: true)"),

    taxonomyLevel: z.enum(taxonomyLevelValues).optional().describe("Filter by Bloom taxonomy level"),

    search: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined))
      .describe("Case-insensitive search applied to name and description"),

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
      .default(50)
      .describe("Number of items per page (default: 50)"),
  })
  .strict();

export type ExerciseTemplateListQueryInput = z.infer<typeof ExerciseTemplateListQuerySchema>;



