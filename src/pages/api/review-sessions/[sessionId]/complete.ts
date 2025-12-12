export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "zod";

import { ReviewSessionService } from "@/lib/services/review-session.service";
import { CompleteReviewSessionSchema } from "@/lib/validation/review-session.schema";
import { handleError } from "@/lib/utils/error-handler";
import { getAuthContext, unauthorizedResponse } from "@/lib/utils/auth-context";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const ParamsSchema = z.object({
  sessionId: z.string().uuid({ message: "sessionId must be a valid UUID" }),
});

export const POST: APIRoute = async (context) => {
  const auth = getAuthContext(context.locals);
  if (!auth) return unauthorizedResponse();
  const { supabase, userId } = auth;

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

  let payload: unknown = {};
  const requestBody = await context.request.text();
  const trimmedBody = requestBody.trim();

  if (trimmedBody.length > 0) {
    try {
      payload = JSON.parse(trimmedBody);
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
  }

  const validationResult = CompleteReviewSessionSchema.safeParse(payload);

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
    const result = await service.complete(userId, paramsResult.data.sessionId, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};
