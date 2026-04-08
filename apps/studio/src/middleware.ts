import { createAuthProxy } from "@repo/auth/proxy";

export const middleware = createAuthProxy({
  publicRoutes: ["/login", "/auth/callback"],
  loginUrl: "/login",
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
