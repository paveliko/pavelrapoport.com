import { describe, it, expect, vi, beforeEach } from "vitest";

const REQUIRED_ENV = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_DB_PASSWORD: "test-db-password",
  CLAUDE_API_KEY: "test-claude-key",
  CLOUDFLARE_ACCOUNT_ID: "test-cf-account",
  CLOUDFLARE_API_TOKEN: "test-cf-token",
};

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("validateEnv", () => {
  it("throws when required vars are missing", async () => {
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow(
      "Missing or invalid environment variables"
    );
  });

  it("succeeds with all required vars", async () => {
    for (const [key, value] of Object.entries(REQUIRED_ENV)) {
      vi.stubEnv(key, value);
    }
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).not.toThrow();
  });

  it("succeeds when optional vars are omitted", async () => {
    for (const [key, value] of Object.entries(REQUIRED_ENV)) {
      vi.stubEnv(key, value);
    }
    const { validateEnv } = await import("../env");
    const result = validateEnv();
    expect(result.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(result.LINEAR_API_KEY).toBeUndefined();
  });
});

describe("env proxy", () => {
  it("reads from process.env", async () => {
    vi.stubEnv("SUPABASE_URL", "https://proxy-test.supabase.co");
    const { env } = await import("../env");
    expect(env.SUPABASE_URL).toBe("https://proxy-test.supabase.co");
  });
});
