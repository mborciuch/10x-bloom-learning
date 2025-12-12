export const prerender = false;

import type { APIRoute } from "astro";
import { MetricsService } from "@/lib/services/metrics.service";
import { handleError } from "@/lib/utils/error-handler";
import { getAuthContext, unauthorizedResponse } from "@/lib/utils/auth-context";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const GET: APIRoute = async (context) => {
  const auth = getAuthContext(context.locals);
  if (!auth) return unauthorizedResponse();
  const { supabase, userId } = auth;

  try {
    const service = new MetricsService(supabase);
    const metrics = await service.getAiUsage(userId);

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    return handleError(error);
  }
};
