import { describe, it, expect, vi, beforeEach } from "vitest";

const redirectMock = vi.fn((url: URL) => ({ redirected: true, url: url.toString() }));
const nextMock = vi.fn((_init?: unknown) => ({ next: true }));

vi.mock("next/server", () => ({
  NextResponse: {
    next: nextMock,
    redirect: redirectMock,
  },
}));

const getUserMock = vi.fn();
const signOutMock = vi.fn(async () => undefined);

vi.mock("../supabase", () => ({
  createProxyClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      signOut: signOutMock,
    },
  })),
}));

function makeRequest(pathname: string) {
  return {
    nextUrl: {
      pathname,
      clone() {
        const searchParams = new URLSearchParams();
        const clone = {
          pathname,
          searchParams,
          search: "",
          toString() {
            const qs = searchParams.toString();
            return `https://studio.pavelrapoport.com${clone.pathname}${qs ? `?${qs}` : ""}`;
          },
        };
        return clone as unknown as URL;
      },
    },
  } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  redirectMock.mockClear();
  nextMock.mockClear();
  getUserMock.mockReset();
  signOutMock.mockClear();
});

describe("createAuthProxy — whitelist", () => {
  it("passes through when allowedEmails is empty", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "anyone@example.com" } },
    });
    const { createAuthProxy } = await import("../proxy");
    const proxy = createAuthProxy({ allowedEmails: [] });
    const result = await proxy(makeRequest("/dashboard"));
    expect(redirectMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(result).toEqual({ next: true });
  });

  it("passes through when email is in whitelist (case-insensitive)", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "Pavel@Pavelrapoport.com" } },
    });
    const { createAuthProxy } = await import("../proxy");
    const proxy = createAuthProxy({
      allowedEmails: ["pavel@pavelrapoport.com"],
    });
    const result = await proxy(makeRequest("/dashboard"));
    expect(redirectMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(result).toEqual({ next: true });
  });

  it("redirects and signs out when email is not in whitelist", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "intruder@example.com" } },
    });
    const { createAuthProxy } = await import("../proxy");
    const proxy = createAuthProxy({
      allowedEmails: ["pavel@pavelrapoport.com"],
    });
    await proxy(makeRequest("/dashboard"));
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledOnce();
    const redirectedUrl = redirectMock.mock.calls[0]![0] as unknown as URL;
    expect(redirectedUrl.toString()).toContain("/login");
    expect(redirectedUrl.toString()).toContain("error=not_authorized");
  });

  it("skips whitelist on public routes", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "intruder@example.com" } },
    });
    const { createAuthProxy } = await import("../proxy");
    const proxy = createAuthProxy({
      publicRoutes: ["/login", "/auth/callback"],
      allowedEmails: ["pavel@pavelrapoport.com"],
    });
    await proxy(makeRequest("/auth/callback"));
    expect(signOutMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
