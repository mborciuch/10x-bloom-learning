import { z } from "zod";

export const AiQualityMetricsQuerySchema = z
  .object({
    studyPlanId: z
      .string()
      .trim()
      .uuid("studyPlanId must be a valid UUID")
      .optional()
      .describe("Optional study plan identifier to scope metrics"),
  })
  .strict();

export type AiQualityMetricsQuerySchemaInput = z.infer<typeof AiQualityMetricsQuerySchema>;

