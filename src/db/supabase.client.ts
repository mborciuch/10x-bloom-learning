import { createBrowserClient, createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { SupabaseClient as SupabaseCoreClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseCookieOptions: CookieOptionsWithName = {
  path: "/",
  sameSite: "lax",
  secure: true,
  httpOnly: true,
};

interface CookieEntry {
  name: string;
  value: string;
}

interface CreateServerClientContext {
  request: Request;
  cookies: AstroCookies;
}

const isGetAllSupported = (cookies: AstroCookies): cookies is AstroCookies & { getAll: () => CookieEntry[] } =>
  typeof (cookies as unknown as { getAll?: unknown }).getAll === "function";

const serializeCookies = (cookies: CookieEntry[]): CookieEntry[] => cookies.map(({ name, value }) => ({ name, value }));

export const createSupabaseServerClient = ({ request, cookies }: CreateServerClientContext) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        // Prefer Astro cookies API when available, fallback to header parsing (for edge cases)
        if (isGetAllSupported(cookies)) {
          const existingCookies = cookies.getAll();
          if (existingCookies.length > 0) {
            return serializeCookies(existingCookies);
          }
        }

        const cookieHeader = request.headers.get("Cookie");
        if (!cookieHeader) return [];

        return cookieHeader.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          return { name, value: rest.join("=") };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...options, sameSite: options?.sameSite ?? "lax" });
        });
      },
    },
  });
};

export const createSupabaseBrowserClient = () => createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = SupabaseCoreClient<Database>;
