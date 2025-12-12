export const prerender = false;

import type { APIRoute } from "astro";
import { StudyPlanService } from "@/lib/services/study-plan.service";
import { handleError, ApiError } from "@/lib/utils/error-handler";
import { getAuthContext, unauthorizedResponse } from "@/lib/utils/auth-context";
import type { UpdateStudyPlanCommand } from "@/types";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const GET: APIRoute = async (context) => {
  const auth = getAuthContext(context.locals);
  if (!auth) return unauthorizedResponse();
  const { supabase, userId } = auth;
  const planId = context.params.planId;

  if (!planId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Missing planId parameter",
        },
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  try {
    const service = new StudyPlanService(supabase);
    const details = await service.getDetails(userId, planId);

    return new Response(JSON.stringify(details), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          error: {
            code: error.code,
            message: error.message,
          },
        }),
        { status: 404, headers: JSON_HEADERS }
      );
    }
    return handleError(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  const auth = getAuthContext(context.locals);
  if (!auth) return unauthorizedResponse();
  const { supabase, userId } = auth;
  const planId = context.params.planId;

  if (!planId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Missing planId parameter",
        },
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  try {
    const service = new StudyPlanService(supabase);
    await service.delete(userId, planId);

    return new Response(null, {
      status: 204,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};

export const PATCH: APIRoute = async (context) => {
  const auth = getAuthContext(context.locals);
  if (!auth) return unauthorizedResponse();
  const { supabase, userId } = auth;
  const planId = context.params.planId;

  if (!planId) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Missing planId parameter",
        },
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  let body: UpdateStudyPlanCommand;
  try {
    body = (await context.request.json()) as UpdateStudyPlanCommand;
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid JSON body",
        },
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  try {
    const service = new StudyPlanService(supabase);
    const updated = await service.update(userId, planId, body);

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};
