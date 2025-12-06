// src/pages/api/ai-generation-worker/index.ts
export const prerender = false;

import type { APIRoute } from "astro";

/**
 * [DEPRECATED] /api/ai-generation-worker
 *
 * Background worker dla asynchronicznego generowania AI został usunięty.
 * Całe generowanie odbywa się teraz synchronicznie w endpointcie
 * POST /api/study-plans/{planId}/ai-generate.
 */
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: {
        code: "GONE",
        message:
          "This worker endpoint is deprecated. AI generation is now synchronous via POST /api/study-plans/{planId}/ai-generate.",
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
