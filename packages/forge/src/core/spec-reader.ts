// Utilities for parsing OpenSpec spec references from Linear issue descriptions
// and extracting sections from spec markdown files.
// Pure string processing — no Node.js imports (safe for Cloudflare Workers).

export interface SpecRef {
  path: string;
  section?: string;
}

/**
 * Parse the `## Relevant specs` section from a Linear issue description.
 *
 * Expected format:
 * ```
 * ## Relevant specs
 * - openspec/specs/facade/spec.md § Requirement: Block Status Transitions
 * - openspec/changes/worker-today-view/specs/worker-today-view/spec.md
 * ```
 *
 * Returns an array of { path, section? } objects.
 */
export function parseRelevantSpecs(description: string): SpecRef[] {
  // Match the "## Relevant specs" section (case-insensitive heading)
  const sectionMatch = description.match(/^##\s+Relevant\s+specs\s*\n([\s\S]*?)(?=\n##\s|\n*$)/im);
  if (!sectionMatch) return [];

  const sectionBody = sectionMatch[1]!;
  const refs: SpecRef[] = [];

  // Match list items: "- path/to/spec.md" or "- path/to/spec.md § Section Title"
  const lineRe = /^[-*]\s+(openspec\/\S+\.md)(?:\s+§\s+(.+))?$/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(sectionBody)) !== null) {
    refs.push({
      path: match[1]!,
      section: match[2]?.trim() || undefined,
    });
  }

  return refs;
}

/**
 * Extract a markdown section by heading title from spec content.
 *
 * Looks for a heading containing `sectionTitle` (at any level: ##, ###, ####)
 * and returns everything from that heading to the next heading of the same or
 * higher level, or end of content.
 */
export function extractSection(content: string, sectionTitle: string): string {
  const lines = content.split('\n');
  let capturing = false;
  let captureLevel = 0;
  const captured: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,6})\s+(.+)/);

    if (headingMatch) {
      const level = headingMatch[1]!.length;
      const title = headingMatch[2]!.trim();

      if (!capturing && title.includes(sectionTitle)) {
        capturing = true;
        captureLevel = level;
        captured.push(line);
        continue;
      }

      // Stop at same-or-higher level heading
      if (capturing && level <= captureLevel) {
        break;
      }
    }

    if (capturing) {
      captured.push(line);
    }
  }

  return captured.join('\n').trim();
}

/**
 * Build a spec context string from fetched spec contents.
 * Each entry is labeled with its source path and optional section anchor.
 */
export function buildSpecContext(
  specs: { path: string; section?: string; content: string }[],
): string {
  if (specs.length === 0) return '';

  const parts = specs.map(
    (s) => `### ${s.path}${s.section ? ` § ${s.section}` : ''}\n\n${s.content}`,
  );

  return parts.join('\n\n---\n\n');
}
