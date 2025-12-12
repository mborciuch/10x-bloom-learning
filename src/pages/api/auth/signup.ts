import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { registerSchema } from "@/lib/validation/auth.schema";

export const prerender = false;

const DEFAULT_REDIRECT = "/app/calendar";

const sanitizeReturnUrl = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
};

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
    return jsonResponse({ message: "Nie udało się utworzyć konta" }, 400);
  }

  const result = registerSchema.safeParse(payload);

  if (!result.success) {
    return jsonResponse({ message: "Nie udało się utworzyć konta" }, 400);
  }

  const { email, password } = result.data;
  const returnUrl = sanitizeReturnUrl((payload as Record<string, unknown>).returnUrl);

  const supabase = createSupabaseServerClient({ request, cookies });
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    const message =
      error.code === "user_already_exists"
        ? "Konto z tym adresem email już istnieje"
        : "Nie udało się utworzyć konta. Spróbuj ponownie.";

    const status = error.code === "user_already_exists" ? 409 : 400;

    return jsonResponse({ message }, status);
  }

  return jsonResponse({ redirectTo: returnUrl ?? DEFAULT_REDIRECT }, 200);
};
