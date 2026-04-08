import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabase } from "@repo/config";
import type { Database } from "@repo/db";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  ...(process.env.NODE_ENV === "production"
    ? { domain: ".pavelrapoport.com" }
    : {}),
};

export function createProxyClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient<Database>(supabase.url, supabase.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, { ...COOKIE_OPTIONS, ...options });
        }
      },
    },
  });
}

export async function createAuthServerClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient<Database>(supabase.url, supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, { ...COOKIE_OPTIONS, ...options });
        }
      },
    },
  });
}
