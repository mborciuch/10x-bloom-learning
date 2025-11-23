export const prerender = false;

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { StudyPlanService } from "@/lib/services/study-plan.service";
import { CreateStudyPlanSchema } from "@/lib/validation/study-plan.schema";
import { handleError } from "@/lib/utils/error-handler";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

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
