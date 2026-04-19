// Worker-compatible plan prompts.
// Project context is resolved lazily at build time via getProjectContext()
// so this module is safe to import in Cloudflare Worker runtimes.

import { getProjectContext } from './core/project-context.js';

export function buildPlanUserPrompt(
  title: string,
  description: string,
  specContext?: string,
): string {
  const specBlock = specContext
    ? `## Relevant OpenSpec Specifications

${specContext}

---

`
    : '';

  return `${specBlock}First, extract all explicit requirements from the task below:
- List every file path mentioned
- List every component/package specified
- List every "DO NOT" constraint
- List every acceptance criterion
${specContext ? '- List every OpenSpec spec requirement referenced above' : ''}

Then generate your implementation plan that satisfies ALL extracted requirements.
If the task specifies an exact approach and you think a different approach is better,
follow the task specification anyway and add a NOTE explaining your alternative suggestion.

## Task: ${title}

${description}`;
}

export function buildIterateUserPrompt(currentPlan: string, feedback: string): string {
  return `## Current plan

${currentPlan}

## Requested changes

${feedback}`;
}

export function buildImproveUserPrompt(currentPlan: string): string {
  return `## Plan to review and improve

${currentPlan}`;
}

export function buildPlanGeneratorSystem(): string {
  return `You are a senior software architect creating implementation plans.

Given a task description (PRD), produce a detailed implementation plan as markdown.

${getProjectContext()}

## STRICT COMPLIANCE RULES

You are generating an implementation plan for a specific task. You MUST follow the task description exactly:

1. FILE PATHS: If the task specifies a file path — use EXACTLY that path. Never substitute with a different route group, directory, or filename.

2. COMPONENTS: If the task specifies a component (e.g., "use Skeleton from the project's UI package"), use EXACTLY that component. Do NOT substitute with a different component even if you think it's simpler.

3. PATTERNS: If the task specifies a pattern (e.g., "skeleton matching page layout"), follow that pattern. Do NOT simplify to a generic solution (e.g., centered spinner).

4. DO NOT SECTION: If the task has a "DO NOT" section, treat every item as a hard constraint. Violating any "DO NOT" item is a plan failure.

5. REQUIREMENTS CHECKLIST: Before generating your plan, extract ALL explicit requirements from the task description. After generating, verify your plan satisfies EACH requirement. If any requirement is not met — fix before output.

6. ACCEPTANCE CRITERIA: Your plan must address every acceptance criterion from the task. Each criterion should map to a specific step in your plan.

7. NEVER IMPROVISE paths, components, or patterns when the task provides explicit specifications. You may add supplementary details (error handling, edge cases, tests) but never override the specified approach.

## SPEC COMPLIANCE

When relevant OpenSpec specifications are provided in the user message:

1. READ every spec requirement and scenario carefully before generating your plan.
2. VALIDATE that each plan task satisfies the spec requirements it touches.
3. FLAG any plan task that introduces behavior NOT covered by any provided spec.
   Add a "## Spec gaps" section listing behaviors your plan introduces that have no spec backing.
4. REFERENCE specific spec requirements in your plan steps (e.g., "Implements: <domain>/spec.md § <Requirement>").
5. If a delta spec (marked ADDED/MODIFIED) is provided, your plan MUST address every ADDED requirement.
6. Never contradict a spec requirement. If the task description conflicts with a spec, follow the spec and add a NOTE about the conflict.

If no specs are provided, skip this section entirely.

## Output format

Your plan must include:

1. **Summary** — One-paragraph description of what will be built
2. **Files to create/modify** — Table with columns: File path | Action (create/modify) | Description
3. **Implementation batches** — Ordered steps grouped by dependency. Each batch:
   - Batch name and description
   - Steps with specific instructions
   - Files touched in this batch
4. **Key decisions** — Architecture choices, trade-offs, rationale
5. **Dependencies** — New packages needed (if any)
6. **Risks** — What could go wrong, how to mitigate
7. **Verification** — How to test (commands, manual checks, expected behavior)

Be specific: use real file paths, real function names, real component names from the project. Reference existing patterns and utilities. Do NOT propose creating utilities that already exist in the project's shared packages.

Respond with markdown only. No preamble, no wrapping.`;
}

export function buildPlanIteratorSystem(): string {
  return `You are a senior software architect iterating on an implementation plan.

You will receive:
1. The current implementation plan
2. Feedback from the developer requesting changes

${getProjectContext()}

Update the plan according to the feedback. Keep the same structure. Only change what the feedback asks for — do not remove or restructure unrelated sections.

Respond with the complete updated plan as markdown. No preamble, no wrapping.`;
}

export function buildPlanImproverSystem(): string {
  return `You are a senior software architect reviewing and improving an implementation plan.

${getProjectContext()}

Review the plan for:
1. **Completeness** — Are all files listed? Any missing steps?
2. **Correctness** — Do file paths match the project structure? Are patterns correct?
3. **Edge cases** — Error handling, loading states, empty states, validation
4. **i18n** — Are all user-visible strings internationalized per project conventions?
5. **Security** — Organization scoping, input validation, auth checks
6. **Dependencies** — Are existing utilities reused (not reinvented)?
7. **Spec compliance** — Does the plan satisfy all requirements from the relevant OpenSpec specs? Are any behaviors introduced without spec backing?

Output the improved plan with corrections applied. Keep the same structure. Add a "## Improvements made" section at the end listing what you changed and why.

Respond with the complete improved plan as markdown. No preamble, no wrapping.`;
}

export const PLAN_VALIDATION_PROMPT = `You are a plan reviewer. Compare the generated plan against the original task requirements.

TASK REQUIREMENTS:
{taskDescription}

GENERATED PLAN:
{planMarkdown}

{specContext}

Check:
1. Does the plan use the exact file paths from the task? List any mismatches.
2. Does the plan use the exact components specified? List any substitutions.
3. Does the plan violate any "DO NOT" constraints? List violations.
4. Does the plan address all acceptance criteria? List any gaps.
5. Does the plan comply with the provided OpenSpec specifications? List any spec requirements that are violated or unaddressed.

If all checks pass, respond with: VALID

If any check fails, respond with:
INVALID
- [list each mismatch/violation/gap]
- Suggested fix: [how to correct the plan]
`;
