export const prerender = false;

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { ReviewSessionService } from "@/lib/services/review-session.service";
import { ReviewSessionListQuerySchema } from "@/lib/validation/review-session.schema";
import { handleError } from "@/lib/utils/error-handler";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * GET /api/review-sessions
 *
 * Advanced listing endpoint for review sessions with calendar-friendly
 * filtering (date range, study plan) and additional filters.
 *
 * Query params:
 * - studyPlanId: UUID
 * - planId: UUID (alias for studyPlanId, used by existing frontend)
 * - dateFrom, dateTo: YYYY-MM-DD
 * - status: proposed | accepted | rejected
 * - isCompleted: boolean
 * - taxonomyLevel: enum
 * - isAiGenerated: boolean
 * - page, pageSize
 * - sort: currently only review_date (default: review_date desc)
 *
 * Response:
 * - Paginated<ReviewSessionDto>
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  const url = new URL(context.request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());
  const validationResult = ReviewSessionListQuerySchema.safeParse(rawQuery);

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
    const service = new ReviewSessionService(supabase);
    const result = await service.list(userId, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};
