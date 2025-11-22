import { z } from "zod";

export const CreateStudyPlanSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters"),
  sourceMaterial: z.string({ required_error: "Source material is required" }).min(1, "Source material cannot be empty"),
  wordCount: z
    .number({ required_error: "Word count is required" })
    .int("Word count must be an integer")
    .min(200, "Word count must be at least 200")
    .max(5000, "Word count cannot exceed 5000"),
});

export type CreateStudyPlanSchemaInput = z.infer<typeof CreateStudyPlanSchema>;
