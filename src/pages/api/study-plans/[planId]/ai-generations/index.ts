// src/pages/api/study-plans/[planId]/ai-generations/index.ts
export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";
import { AiGenerationService } from "@/lib/services/ai-generation.service";
import { handleError, ApiError } from "@/lib/utils/error-handler";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

// Zod schema dla walidacji request body
const InitiateAiGenerationSchema = z.object({
  requestedCount: z.number().int().min(1).max(50),
  taxonomyLevels: z
    .array(z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]))
    .min(1)
    .max(6),
  includePredefinedTemplateIds: z.array(z.string().uuid()).optional(),
  modelName: z.string().optional(),
});

/**
 * POST /api/study-plans/[planId]/ai-generations
 * Inicjuje asynchroniczne generowanie sesji przez AI
 *
 * Response: 202 Accepted (async processing)
 */
export const POST: APIRoute = async (context) => {
  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }),
      { status: 401, headers: JSON_HEADERS }
    );
  }

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

  // 3. Parse and validate request body
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

  // 4. Initiate AI generation
  try {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new ApiError("CONFIGURATION_ERROR", "AI service is not configured", 500);
    }

    const aiService = new AiGenerationService(context.locals.supabase, apiKey);
    const generation = await aiService.initiate(user.id, studyPlanId, validationResult.data);

    // 5. Kick off background worker (asynchronous)
    // Wywołujemy worker endpoint który uruchomi processGeneration w tle
    const workerUrl = new URL("/api/ai-generation-worker", context.url.origin);
    workerUrl.searchParams.set("generationId", generation.id);

    // Fire-and-forget: nie czekamy na odpowiedź workera
    fetch(workerUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Można dodać internal auth token jeśli potrzebny
      },
    }).catch((error) => {
      // Loguj błąd ale nie blokuj odpowiedzi
      console.error("[AI Generation Worker] Failed to trigger:", error);
    });

    // 6. Zwróć 202 Accepted z generation details
    return new Response(JSON.stringify(generation), {
      status: 202,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};
