import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/config", () => ({
  supabase: {
    url: "https://test.supabase.co",
    anonKey: "test-anon-key",
    serviceRoleKey: undefined,
    dbPassword: "test-password",
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

beforeEach(() => {
  vi.resetModules();
});

describe("@repo/db client", () => {
  it("exports db singleton", async () => {
    const { db } = await import("../client");
    expect(db).toBeDefined();
  });

  it("createClient called with config url and anonKey", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    await import("../client");
    expect(createClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key"
    );
  });
});

describe("@repo/db admin", () => {
  it("throws when service role key is missing", async () => {
    const { createAdminClient } = await import("../admin");
    expect(() => createAdminClient()).toThrow(
      "SUPABASE_SERVICE_ROLE_KEY is required"
    );
  });

  it("returns client when service role key exists", async () => {
    vi.doMock("@repo/config", () => ({
      supabase: {
        url: "https://test.supabase.co",
        anonKey: "test-anon-key",
        serviceRoleKey: "test-service-role-key",
        dbPassword: "test-password",
      },
    }));
    const { createAdminClient } = await import("../admin");
    const client = createAdminClient();
    expect(client).toBeDefined();
  });
});
