import { createClient } from '@supabase/supabase-js';
import type { AuditReport, FindingSeverity } from '../commands/audit/types.js';
import type { SpecReport } from '../commands/spec/types.js';

/**
 * Persist an AuditReport to the `forge_audits` table in Supabase.
 * Returns the inserted row id, or `null` when env vars are missing / insert fails.
 */
export async function persistAuditResult(report: AuditReport): Promise<{ id: string } | null> {
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

  const findings = report.verified?.findings ?? [];

  const countBySeverity = (severity: FindingSeverity) =>
    findings.filter((f) => f.severity === severity).length;

  const { data, error } = await supabase
    .from('forge_audits')
    .insert({
      organization_id: orgId,
      module: report.module,
      overall_score: report.verified?.overall_score ?? 0,
      agent_results: findings,
      total_findings: findings.length,
      critical_count: countBySeverity('critical'),
      high_count: countBySeverity('warning'),
      medium_count: countBySeverity('info'),
      low_count: countBySeverity('spec_gap'),
      duration_ms: report.durationMs ?? null,
      cost_usd: report.totalCost ?? null,
      model: null,
      cli_version: null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[persist] Failed to insert audit:', error.message);
    return null;
  }

  return data as { id: string };
}

/**
 * Persist a SpecReport to the `forge_specs` table in Supabase.
 * Returns the inserted row id, or `null` when env vars are missing / insert fails.
 */
export async function persistSpecResult(report: SpecReport): Promise<{ id: string } | null> {
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

  const reqs = report.result.requirements;

  const { data, error } = await supabase
    .from('forge_specs')
    .insert({
      organization_id: orgId,
      spec_path: report.module,
      coverage_score: report.result.coverage.percentage / 10,
      total_requirements: report.result.coverage.total,
      implemented_count: report.result.coverage.match,
      missing_count: reqs.filter((r) => r.category === 'MISSING-CODE').length,
      drift_count: reqs.filter((r) => r.category === 'DRIFT').length,
      gaps: reqs,
      duration_ms: report.durationMs ?? null,
      cost_usd: report.cost ?? null,
      model: report.model ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[persist] Failed to insert spec result:', error.message);
    return null;
  }

  return data as { id: string };
}
