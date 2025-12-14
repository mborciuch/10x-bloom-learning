import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "@/db/supabase.client";

const PUBLIC_PAGES = new Set(["/", "/login", "/register", "/forgot-password"]);

export const onRequest = defineMiddleware(async ({ request, cookies, locals, url, redirect }, next) => {
  const supabase = createSupabaseServerClient({ request, cookies });
  locals.supabase = supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  locals.user = user
    ? {
        id: user.id,
        email: user.email ?? null,
      }
    : null;

  if (!locals.user && url.pathname.startsWith("/app")) {
    const returnUrl = encodeURIComponent(`${url.pathname}${url.search}`);
    return redirect(`/login?returnUrl=${returnUrl}`);
  }

  if (locals.user && PUBLIC_PAGES.has(url.pathname)) {
    return redirect("/app/calendar");
  }

  return next();
});
