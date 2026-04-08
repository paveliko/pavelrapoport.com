import { z } from "zod";

const envSchema = z.object({
  // Supabase (required)
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_DB_PASSWORD: z.string().min(1),

  // Claude (required)
  CLAUDE_API_KEY: z.string().min(1),

  // Cloudflare (required)
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_API_TOKEN: z.string().min(1),
  CLOUDFLARE_ZONE_ID: z.string().min(1).optional(),

  // Linear (optional — not needed for MVP)
  LINEAR_API_KEY: z.string().min(1).optional(),
  LINEAR_WEBHOOK_SECRET: z.string().min(1).optional(),

  // GitHub (optional — not needed for MVP)
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Google (optional — not needed for MVP)
  GOOGLE_WORKSPACE_ADMIN: z.string().email().optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

function parseEnv(): Env {
  if (_env) return _env;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Missing or invalid environment variables:\n${missing}`);
  }
  _env = result.data;
  return _env;
}

export const env = new Proxy({} as Env, {
  get(_, prop: string) {
    return parseEnv()[prop as keyof Env];
  },
});
