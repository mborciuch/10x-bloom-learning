const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

export const getAuthContext = (locals: App.Locals) => {
  const supabase = locals.supabase;
  const userId = locals.user?.id;

  if (!supabase || !userId) {
    return null;
  }

  return { supabase, userId };
};

export const unauthorizedResponse = () =>
  new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    }),
    {
      status: 401,
      headers: JSON_HEADERS,
    }
  );
