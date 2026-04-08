import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createProxyClient } from "./supabase";

type AuthProxyConfig = {
  publicRoutes?: string[];
  loginUrl?: string;
};

export function createAuthProxy(config?: AuthProxyConfig) {
  const publicRoutes = config?.publicRoutes ?? ["/login", "/auth/callback"];
  const loginUrl = config?.loginUrl ?? "/login";

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
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (user && pathname === loginUrl) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return response;
  };
}
