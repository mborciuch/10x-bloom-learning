export const prerender = false;

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { ReviewSessionService } from "@/lib/services/review-session.service";
import { CreateReviewSessionSchema, ReviewSessionListQuerySchema } from "@/lib/validation/review-session.schema";
import { handleError } from "@/lib/utils/error-handler";
import type { Paginated, ReviewSessionDto } from "@/types";

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
      headers: buildPaginationHeaders(result),
    });
  } catch (error) {
    return handleError(error);
  }
};

function buildPaginationHeaders(result: Paginated<ReviewSessionDto>) {
  return {
    ...JSON_HEADERS,
    "X-Total-Count": String(result.total),
    "X-Page": String(result.page),
    "X-Page-Size": String(result.pageSize),
  };
}

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  let payload: unknown;
  try {
    payload = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  const validationResult = CreateReviewSessionSchema.safeParse(payload);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
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
    const session = await service.createManual(userId, validationResult.data);

    return new Response(JSON.stringify(session), {
      status: 201,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};
