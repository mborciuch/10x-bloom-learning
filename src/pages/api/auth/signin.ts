import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";
import { loginSchema } from "@/lib/validation/auth.schema";

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

export const POST: APIRoute = async ({ request, cookies }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Nieprawidłowe dane logowania" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = loginSchema.safeParse(payload);

  if (!result.success) {
    return new Response(JSON.stringify({ message: "Nieprawidłowe dane logowania" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, password } = result.data;
  const returnUrl = sanitizeReturnUrl((payload as Record<string, unknown>).returnUrl);

  const supabase = createSupabaseServerClient({ request, cookies });
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ message: "Nieprawidłowe dane logowania" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ redirectTo: returnUrl ?? DEFAULT_REDIRECT }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
