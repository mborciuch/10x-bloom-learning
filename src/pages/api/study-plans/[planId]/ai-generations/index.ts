// src/pages/api/study-plans/[planId]/ai-generations/index.ts
export const prerender = false;

import type { APIRoute } from "astro";

/**
 * [DEPRECATED] /api/study-plans/[planId]/ai-generations
 *
 * Asynchroniczny endpoint został zastąpiony synchronicznym
 * POST /api/study-plans/{planId}/ai-generate.
 *
 * Zwracamy 410 Gone, aby jasno zakomunikować, że ścieżka jest wycofana.
 */
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: {
        code: "GONE",
        message: "This endpoint is deprecated. Use POST /api/study-plans/{planId}/ai-generate instead.",
      },
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
