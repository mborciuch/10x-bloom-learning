export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { AiGenerationService } from "@/lib/services/ai-generation.service";
import { handleError, ApiError } from "@/lib/utils/error-handler";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const InitiateAiGenerationSchema = z.object({
  requestedCount: z.number().int().min(1).max(50),
  taxonomyLevels: z
    .array(z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]))
    .min(1)
    .max(6),
  includePredefinedTemplateIds: z.array(z.string().uuid()).optional(),
  modelName: z.string().optional(),
});

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  // 2. Validate planId
  const studyPlanId = context.params.planId;
  if (!studyPlanId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Study plan ID is required",
        },
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  // 3. Parse JSON body
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON body",
        },
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  // 4. Validate body with Zod
  const validationResult = InitiateAiGenerationSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: validationResult.error.issues,
        },
      }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  // 5. Call service
  try {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new ApiError("CONFIGURATION_ERROR", "AI service is not configured", 500);
    }

    const service = new AiGenerationService(supabase, apiKey);
    const sessions = await service.generateReviewSessions(userId, studyPlanId, validationResult.data);

    return new Response(
      JSON.stringify({
        sessions,
      }),
      {
        status: 201,
        headers: JSON_HEADERS,
      }
    );
  } catch (error) {
    return handleError(error);
  }
};
