import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createProxyClient } from "./supabase";

type AuthProxyConfig = {
  publicRoutes?: string[];
  loginUrl?: string;
  allowedEmails?: string[];
};

export function createAuthProxy(config?: AuthProxyConfig) {
  const publicRoutes = config?.publicRoutes ?? ["/login", "/auth/callback"];
  const loginUrl = config?.loginUrl ?? "/login";
  const allowedEmails = (config?.allowedEmails ?? [])
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const response = NextResponse.next({
      request,
    });

    const supabase = createProxyClient(request, response);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = loginUrl;
      url.search = "";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (user && !isPublicRoute && allowedEmails.length > 0) {
      const email = user.email?.toLowerCase() ?? "";
      if (!allowedEmails.includes(email)) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = loginUrl;
        url.search = "";
        url.searchParams.set("error", "not_authorized");
        return NextResponse.redirect(url);
      }
    }

    if (user && pathname === loginUrl) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return response;
  };
}
