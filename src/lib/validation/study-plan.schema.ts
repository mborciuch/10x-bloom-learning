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
