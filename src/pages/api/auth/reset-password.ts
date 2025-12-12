import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { logger } from "@/lib/utils/logger";
import { resetPasswordSchema } from "@/lib/validation/auth.schema";

export const prerender = false;

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request, cookies }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ message: "Jeśli adres istnieje w systemie, wyślemy instrukcję resetu hasła." }, 200);
  }

  const result = resetPasswordSchema.safeParse(payload);

  if (!result.success) {
    return jsonResponse({ message: "Jeśli adres istnieje w systemie, wyślemy instrukcję resetu hasła." }, 200);
  }

  const supabase = createSupabaseServerClient({ request, cookies });
  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email);

  if (error) {
    logger.error("Failed to send password reset email", {
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }

  return jsonResponse({ message: "Jeśli adres istnieje w systemie, wyślemy instrukcję resetu hasła." }, 200);
};
