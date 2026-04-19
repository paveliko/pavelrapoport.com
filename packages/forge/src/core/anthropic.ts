// Claude API client for FORGE CLI.
// Adapted from apps/workers/forge/src/services/anthropic.ts
// Supports multiple models with per-model pricing. Retries on 5xx/timeout.

// ─── Types ─────────────────────────────────────────────────

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ─── Model configuration ───────────────────────────────────

export const MODELS = {
  opus: 'claude-opus-4-6',
  sonnet: 'claude-sonnet-4-20250514',
} as const;

export type ModelAlias = keyof typeof MODELS;
export type ModelId = (typeof MODELS)[ModelAlias];

// Per-million-token pricing (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
};

// ─── API client ─────────────────────────────────────────────

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2_000;
const RATE_LIMIT_DELAY_MS = 60_000; // 1 minute wait on 429
const REQUEST_TIMEOUT_MS = 4 * 60 * 1_000; // 4 minutes — Opus can take ~3-4 min

export interface CallClaudeOptions {
  model: ModelId;
  system: string;
  userMessage: string;
  maxTokens?: number;
}

/**
 * Call Claude API with retry on 5xx/timeout.
 * Returns the full AnthropicResponse including usage stats.
 */
export async function callClaude(
  apiKey: string,
  opts: CallClaudeOptions,
): Promise<AnthropicResponse> {
  const { model, system, userMessage, maxTokens = 4096 } = opts;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0,
          system,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        clearTimeout(timeout);
        return (await res.json()) as AnthropicResponse;
      }

      clearTimeout(timeout);

      // Retry on 429 (rate limit) with longer delay
      if (res.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = res.headers.get('retry-after');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1_000 : RATE_LIMIT_DELAY_MS;
        console.error(`    Rate limited. Waiting ${Math.round(waitMs / 1000)}s before retry...`);
        await sleep(waitMs);
        continue;
      }

      // Retry on 5xx
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      const errorBody = await res.text();
      throw new Error(`Claude API error ${res.status}: ${errorBody}`);
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw err;
    }
  }

  throw new Error('Claude API: max retries exceeded');
}

// ─── Cost calculation ───────────────────────────────────────

/**
 * Compute USD cost for a Claude API call based on model and token counts.
 */
export function computeCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? { input: 3, output: 15 };
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

/**
 * Estimate cost for a given token count (rough: 1 token ≈ 4 chars).
 */
export function estimateCost(
  model: ModelId,
  inputChars: number,
  estimatedOutputTokens = 4096,
): number {
  const inputTokens = Math.ceil(inputChars / 4);
  return computeCost(model, inputTokens, estimatedOutputTokens);
}

// ─── Helpers ────────────────────────────────────────────────

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    return (
      err.message.includes('fetch failed') ||
      err.message.includes('network') ||
      err.message.includes('timeout') ||
      err.name === 'AbortError'
    );
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
