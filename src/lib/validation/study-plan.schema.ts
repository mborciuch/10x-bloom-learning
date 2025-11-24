import { z } from "zod";

export const CreateStudyPlanSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters"),
  sourceMaterial: z.string({ required_error: "Source material is required" }).min(1, "Source material cannot be empty"),
});

export type CreateStudyPlanSchemaInput = z.infer<typeof CreateStudyPlanSchema>;

const studyPlanSortFields = ["created_at", "updated_at", "title"] as const;
const studyPlanStatusValues = ["active", "archived"] as const;

export const StudyPlanListQuerySchema = z
  .object({
    status: z.enum(studyPlanStatusValues).optional().describe("Filter study plans by status"),
    search: z
      .string()
      .trim()
      .min(1, "Search must contain at least 1 character")
      .max(200, "Search cannot exceed 200 characters")
      .optional()
      .describe("Search term applied to study plan title"),
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
      .max(100, "Page size cannot exceed 100")
      .default(20)
      .describe("Number of items per page"),
    sort: z.enum(studyPlanSortFields).default("created_at").describe("Sort field"),
    sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Sort order direction"),
  })
  .strict();

export type StudyPlanListQuerySchemaInput = z.infer<typeof StudyPlanListQuerySchema>;
