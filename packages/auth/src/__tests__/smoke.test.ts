import { describe, it, expect, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(() => ({})),
    redirect: vi.fn(() => ({})),
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@repo/config", () => ({
  supabase: {
    url: "https://test.supabase.co",
    anonKey: "test-anon-key",
  },
}));

vi.mock("@repo/db", () => ({}));

describe("@repo/auth", () => {
  it("createAuthProxy is a function", async () => {
    const { createAuthProxy } = await import("../proxy");
    expect(typeof createAuthProxy).toBe("function");
  });

  it("createAuthProxy returns an async function", async () => {
    const { createAuthProxy } = await import("../proxy");
    const proxy = createAuthProxy();
    expect(typeof proxy).toBe("function");
  });

  it("types module exports correctly", async () => {
    const types = await import("../types");
    expect(types).toBeDefined();
  });
});
