export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";

import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { ReviewSessionService } from "@/lib/services/review-session.service";
import { UpdateReviewSessionSchema } from "@/lib/validation/review-session.schema";
import { handleError } from "@/lib/utils/error-handler";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const ParamsSchema = z.object({
  sessionId: z.string().uuid({ message: "sessionId must be a valid UUID" }),
});

export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  const validationResult = ParamsSchema.safeParse(context.params);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid route parameters",
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
    const session = await service.getById(userId, validationResult.data.sessionId);

    return new Response(JSON.stringify(session), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};

export const PATCH: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  const paramsResult = ParamsSchema.safeParse(context.params);

  if (!paramsResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid route parameters",
          details: paramsResult.error.issues,
        },
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

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

  const validationResult = UpdateReviewSessionSchema.safeParse(payload);

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
    const result = await service.update(userId, paramsResult.data.sessionId, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  const paramsResult = ParamsSchema.safeParse(context.params);

  if (!paramsResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid route parameters",
          details: paramsResult.error.issues,
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
    await service.delete(userId, paramsResult.data.sessionId);

    return new Response(null, {
      status: 204,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};

