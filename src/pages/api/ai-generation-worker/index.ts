// src/pages/api/ai-generation-worker/index.ts
export const prerender = false;

import type { APIRoute } from "astro";
import { AiGenerationService } from "@/lib/services/ai-generation.service";
import { handleError, ApiError } from "@/lib/utils/error-handler";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * POST /api/ai-generation-worker
 * Background worker endpoint dla przetwarzania AI generation
 *
 * Ten endpoint jest wywoływany asynchronicznie po utworzeniu generation log entry.
 * Wykonuje faktyczne wywołanie OpenRouter API i zapisuje wyniki.
 */
export const POST: APIRoute = async (context) => {
  try {
    // 1. Pobierz generationId z query params
    const generationId = context.url.searchParams.get("generationId");

    if (!generationId) {
      throw new ApiError("VALIDATION_ERROR", "Generation ID is required", 400);
    }

    // 2. Pobierz generation log aby sprawdzić user_id
    const { data: generation, error: genError } = await context.locals.supabase
      .from("ai_generation_log")
      .select("user_id")
      .eq("id", generationId)
      .single();

    if (genError || !generation) {
      throw new ApiError("NOT_FOUND", "Generation not found", 404);
    }

    // 3. Sprawdź API key
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new ApiError("CONFIGURATION_ERROR", "AI service is not configured", 500);
    }

    // 4. Uruchom processing (może trwać długo)
    const aiService = new AiGenerationService(context.locals.supabase, apiKey);
    await aiService.processGeneration(generationId);

    // 5. Zwróć sukces
    return new Response(
      JSON.stringify({
        success: true,
        generationId,
      }),
      {
        status: 200,
        headers: JSON_HEADERS,
      }
    );
  } catch (error) {
    // Błędy są już zapisane w ai_generation_log przez processGeneration
    console.error("[AI Generation Worker] Processing error:", error);
    return handleError(error);
  }
};
