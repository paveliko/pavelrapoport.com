import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { callClaude, computeCost, MODELS } from '../../core/anthropic.js';
import type { SpecReport } from './types.js';

// ─── Public API ─────────────────────────────────────────────

/**
 * Generate OpenSpec change proposals for MISSING-DOC findings.
 * Groups all findings into a single proposal per module.
 */
export async function generateFixProposals(
  report: SpecReport,
  repoRoot: string,
  apiKey: string,
  verbose: boolean,
): Promise<string[]> {
  const missingDocs = report.result.requirements.filter((r) => r.category === 'MISSING-DOC');
  if (missingDocs.length === 0) return [];

  // Determine change directory slug
  const date = new Date().toISOString().split('T')[0];
  const slug = sanitize(report.module);
  const changeDirName = `${slug}-spec-gaps-${date}`;
  const changeDir = resolve(repoRoot, 'openspec', 'changes', changeDirName);

  // Avoid overwriting existing proposals
  if (existsSync(changeDir)) {
    const existing = readdirSync(changeDir);
    if (existing.length > 0) {
      console.error(`  Change directory already exists: ${changeDirName} — skipping`);
      return [];
    }
  }

  mkdirSync(changeDir, { recursive: true });

  // Write .openspec.yaml
  const yamlPath = resolve(changeDir, '.openspec.yaml');
  writeFileSync(yamlPath, `schema: spec-driven\ncreated: ${date}\n`);

  // Generate proposal content via Claude (Sonnet for cost)
  const proposalContent = await generateProposalContent(
    report.module,
    missingDocs,
    apiKey,
    verbose,
  );

  const proposalPath = resolve(changeDir, 'proposal.md');
  writeFileSync(proposalPath, proposalContent);

  return [changeDir];
}

// ─── Proposal generation ────────────────────────────────────

interface Finding {
  id: string;
  title: string;
  description: string;
  codeFile?: string;
  recommendation: string;
}

async function generateProposalContent(
  moduleName: string,
  findings: Finding[],
  apiKey: string,
  verbose: boolean,
): Promise<string> {
  const findingsList = findings
    .map((f) => `- **${f.title}** (${f.codeFile ?? 'unknown file'}): ${f.description}`)
    .join('\n');

  const system = `You are a technical writer generating an OpenSpec change proposal for the VIVOD construction management platform.
Write a proposal.md following this exact structure:

## Why
[Problem statement — explain that these code behaviors are undocumented]

## What Changes
[Bullet list of spec additions needed]

## Capabilities

### New Capabilities
[List each undocumented behavior as a new capability to document]

## Impact
[Which spec files need updating, affected domains]

Keep it concise and actionable. Use the VIVOD domain vocabulary.`;

  const userMessage = `The spec check for the "${moduleName}" module found ${findings.length} undocumented behavior(s) that need to be added to the OpenSpec specifications:

${findingsList}

Generate a proposal.md for these spec gaps.`;

  try {
    const response = await callClaude(apiKey, {
      model: MODELS.sonnet,
      system,
      userMessage,
      maxTokens: 4096,
    });

    const cost = computeCost(
      MODELS.sonnet,
      response.usage.input_tokens,
      response.usage.output_tokens,
    );
    if (verbose) {
      console.error(`    Proposal generation cost: $${cost.toFixed(3)}`);
    }

    return response.content[0]?.text ?? fallbackProposal(moduleName, findings);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  Warning: Proposal generation failed (${msg}), using template fallback`);
    return fallbackProposal(moduleName, findings);
  }
}

function fallbackProposal(moduleName: string, findings: Finding[]): string {
  const lines: string[] = [];

  lines.push('## Why');
  lines.push('');
  lines.push(
    `The spec check for the \`${moduleName}\` module identified ${findings.length} undocumented behavior(s) in the codebase that have no corresponding OpenSpec requirements.`,
  );
  lines.push('');

  lines.push('## What Changes');
  lines.push('');
  for (const f of findings) {
    lines.push(`- Add spec for: ${f.title}`);
  }
  lines.push('');

  lines.push('## Capabilities');
  lines.push('');
  lines.push('### New Capabilities');
  lines.push('');
  for (const f of findings) {
    lines.push(`- \`${f.id}\`: ${f.description}`);
  }
  lines.push('');

  lines.push('## Impact');
  lines.push('');
  const files = [...new Set(findings.map((f) => f.codeFile).filter(Boolean))];
  lines.push(`Affected code files: ${files.join(', ') || 'various'}`);
  lines.push('');

  return lines.join('\n');
}

// ─���─ Helpers ────────────────────────────────────────────────

function sanitize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
