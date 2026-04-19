import { createClient } from '@supabase/supabase-js';
import type { Estimation } from './types.js';

/**
 * Persist estimation results to the `forge_estimates` table in Supabase.
 * Returns inserted row IDs, or `null` when env vars are missing / insert fails.
 */
export async function persistEstimateResults(
  estimations: Estimation[],
  totalCostUsd: number,
  model: string,
): Promise<{ ids: string[] } | null> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const orgId = process.env.FORGE_ORGANIZATION_ID || 'org_001';

  if (!url || !key) {
    console.error(
      '[persist] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — skipping DB persist',
    );
    return null;
  }

  const supabase = createClient(url, key);
  const costPerEstimate = estimations.length > 0 ? totalCostUsd / estimations.length : 0;
  const ids: string[] = [];

  for (const est of estimations) {
    const { data, error } = await supabase
      .from('forge_estimates')
      .insert({
        organization_id: orgId,
        issue_key: est.issueKey,
        issue_title: est.title,
        complexity: est.complexity,
        complexity_reason: est.complexityReason || null,
        risk_level: est.risk,
        risk_reason: est.riskReason || null,
        story_points: est.storyPoints,
        hours_min: est.hoursMin,
        hours_max: est.hoursMax,
        confidence: est.confidence,
        confidence_reason: est.confidenceReason || null,
        dependencies: est.dependencies,
        files_new: est.filesNew,
        files_modified: est.filesModified,
        cost_usd: Number(costPerEstimate.toFixed(4)),
        model,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[persist] Failed to insert estimate for ${est.issueKey}:`, error.message);
      return null;
    }

    ids.push((data as { id: string }).id);

    // Also record in forge_events so the dashboard activity feed picks it up
    await supabase.from('forge_events').insert({
      organization_id: orgId,
      event_type: 'estimate',
      source: 'forge-cli',
      issue_key: est.issueKey,
      issue_title: est.title,
      cost: Number(costPerEstimate.toFixed(4)),
      model,
    });
  }

  return { ids };
}
