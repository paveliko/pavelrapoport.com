import { describe, expect, it } from 'vitest';
import { computeCost, estimateCost, MODELS } from '../core/anthropic.js';

describe('Anthropic Service', () => {
  it('computes cost correctly for Opus', () => {
    // 50k input tokens, 2k output tokens at Opus pricing ($15/$75 per M)
    const cost = computeCost(MODELS.opus, 50_000, 2_000);
    // (50000 * 15 + 2000 * 75) / 1_000_000 = 0.75 + 0.15 = 0.90
    expect(cost).toBeCloseTo(0.9, 2);
  });

  it('computes cost correctly for Sonnet', () => {
    // 50k input tokens, 2k output tokens at Sonnet pricing ($3/$15 per M)
    const cost = computeCost(MODELS.sonnet, 50_000, 2_000);
    // (50000 * 3 + 2000 * 15) / 1_000_000 = 0.15 + 0.03 = 0.18
    expect(cost).toBeCloseTo(0.18, 2);
  });

  it('estimates cost from character count', () => {
    // 200k chars ≈ 50k tokens
    const cost = estimateCost(MODELS.sonnet, 200_000, 2000);
    expect(cost).toBeCloseTo(0.18, 2);
  });

  it('falls back to Sonnet pricing for unknown model', () => {
    const cost = computeCost('unknown-model', 1_000_000, 0);
    // 1M * $3 / 1M = $3
    expect(cost).toBe(3);
  });
});
