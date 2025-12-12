export const prerender = false;

import type { APIRoute } from "astro";
import { StudyPlanService } from "@/lib/services/study-plan.service";
import { CreateStudyPlanSchema, StudyPlanListQuerySchema } from "@/lib/validation/study-plan.schema";
import { handleError } from "@/lib/utils/error-handler";
import { getAuthContext, unauthorizedResponse } from "@/lib/utils/auth-context";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const GET: APIRoute = async (context) => {
  const auth = getAuthContext(context.locals);
  if (!auth) return unauthorizedResponse();
  const { supabase, userId } = auth;

  const url = new URL(context.request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());
  const validationResult = StudyPlanListQuerySchema.safeParse(rawQuery);

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
    const service = new StudyPlanService(supabase);
    const result = await service.list(userId, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};

export const POST: APIRoute = async (context) => {
  const auth = getAuthContext(context.locals);
  if (!auth) return unauthorizedResponse();
  const { supabase, userId } = auth;

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
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  const validationResult = CreateStudyPlanSchema.safeParse(body);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
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
    const service = new StudyPlanService(supabase);
    const result = await service.create(userId, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};
