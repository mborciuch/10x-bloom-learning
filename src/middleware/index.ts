import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Make supabase client available in context.locals
  context.locals.supabase = supabaseClient;

  // Authentication temporarily disabled for development
  // TODO: Re-enable authentication before production
  // if (context.url.pathname.startsWith("/app")) {
  //   const {
  //     data: { user },
  //     error,
  //   } = await supabaseClient.auth.getUser();

  //   if (error || !user) {
  //     const returnUrl = encodeURIComponent(context.url.pathname);
  //     return context.redirect(`/login?returnUrl=${returnUrl}`);
  //   }
  // }

  return next();
});
