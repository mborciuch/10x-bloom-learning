export const prerender = false;

import type { APIRoute } from "astro";
import { ExerciseTemplateService } from "@/lib/services/exercise-template.service";
import { ExerciseTemplateListQuerySchema } from "@/lib/validation/exercise-template.schema";
import { handleError } from "@/lib/utils/error-handler";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * GET /api/exercise-templates
 *
 * Lists exercise templates with optional filters:
 * - isActive (default: true)
 * - taxonomyLevel
 * - search
 * - page / pageSize
 *
 * Response: Paginated<ExerciseTemplateDto>
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const url = new URL(context.request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());
  const validationResult = ExerciseTemplateListQuerySchema.safeParse(rawQuery);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: validationResult.error.issues,
        },
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  try {
    const service = new ExerciseTemplateService(supabase);
    const result = await service.list(validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};




