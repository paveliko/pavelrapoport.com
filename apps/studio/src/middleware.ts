import { createAuthProxy } from "@repo/auth/proxy";

const allowedEmails = (process.env.STUDIO_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const middleware = createAuthProxy({
  publicRoutes: ["/login", "/auth/callback", "/api/studio/command"],
  loginUrl: "/login",
  allowedEmails,
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
