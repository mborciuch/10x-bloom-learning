export const prerender = false;

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { MetricsService } from "@/lib/services/metrics.service";
import { AiQualityMetricsQuerySchema } from "@/lib/validation/metrics.schema";
import { handleError } from "@/lib/utils/error-handler";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const userId = DEFAULT_USER_ID;

  const url = new URL(context.request.url);
  const query = Object.fromEntries(url.searchParams.entries());

  const validation = AiQualityMetricsQuerySchema.safeParse(query);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: validation.error.issues,
        },
      }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  try {
    const service = new MetricsService(supabase);
    const metrics = await service.getAiQuality(userId, validation.data.studyPlanId);

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};


