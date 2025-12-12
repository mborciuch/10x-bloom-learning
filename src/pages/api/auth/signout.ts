import type { APIRoute } from "astro";

import { createSupabaseServerClient } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ message: "Nie udało się wylogować" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(null, { status: 204 });
};
