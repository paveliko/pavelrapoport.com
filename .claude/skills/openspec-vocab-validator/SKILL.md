---
name: openspec-vocab-validator
description: >
  Validates OpenSpec documents against the Vocabulary Registry (vocabulary.yaml).
  MUST BE ACTIVATED when writing, editing, or reviewing any spec in packages/openspec/specs/.
  Catches wrong entity names, unofficial aliases, unregistered terms, invalid enum values,
  and missing domain references. Ensures every name in a spec is canonical.
  Triggers on: write spec, edit spec, review spec, validate spec, vocab check,
  vocabulary, naming, entity name, /vocab, /validate-spec, new entity,
  rename entity, spec review, PR review on openspec/, naming consistency.
  Does NOT trigger on: reading specs for context, general code review,
  non-spec documentation edits.
metadata:
  author: openspec
  version: "1.0"
---

# OpenSpec Vocabulary Validator

## Purpose

Every name in a spec must come from `packages/openspec/vocabulary.yaml`.
This skill validates that rule and catches violations before they ship.

## When to Run

Run this validation:
1. **Before committing** any change to `packages/openspec/specs/`
2. **While writing** a new spec — as a live check
3. **During PR review** — any PR touching spec files
4. **On demand** — when user asks to validate naming

## Step 1: Load the Registry

Read the full vocabulary registry:

```
packages/openspec/vocabulary.yaml
```

Parse and index:
- All `entities[].name` → the set of valid entity names
- All `entities[].aliases` → map from alias → canonical name
- All `enums[].name` → valid enum names
- All `enums[].values` → valid values per enum
- All `enums[].aliases` → map from alias → canonical enum name
- All `domains[].name` → valid domain names
- All `terms[].name` → valid term names
- All `terms[].aliases` → map from alias → canonical term
- All `packages[].name` → valid package names

## Step 2: Parse the Spec

Read the target spec file. Extract:

### 2a. Entity References
Scan for **bold entity names** in the pattern `**EntityName**`.
Also scan code blocks for entity names (PascalCase words).

Check each against the registry:
- If it matches an `entities[].name` → PASS
- If it matches an `entities[].aliases[]` → FAIL: alias used
- If it matches nothing → FAIL: unregistered entity

### 2b. Enum References
Scan for enum-like patterns:
- `status: "value"` or `status = "value"`
- `priority: low/medium/high` (slash-separated lists)
- Values in backticks that look like enum values

Check each against registered enums:
- If value exists in any `enums[].values` → PASS
- If value is close to a registered value (typo) → WARN
- If value exists nowhere → FAIL: unregistered enum value

### 2c. Domain References
Scan the `## Dependencies` section for domain names in backticks.
Also scan inline references like `domain` or (domain).

Check each against `domains[].name`:
- If it matches → PASS
- If it's close (typo, plural form) → WARN
- If it matches nothing → FAIL: unknown domain

### 2d. Term Usage
Scan for known terms and their aliases in prose text.
This is a softer check — terms appear in natural language.

- If an alias is used instead of canonical term → WARN
- This check is advisory, not blocking

### 2e. Cross-Domain Entity Ownership
If a spec in domain X references entity Y:
- Check that Y's registered domain matches X, OR
- That X lists Y's domain in its Dependencies
- If neither → FAIL: undeclared dependency

## Step 3: Report

Generate a structured report:

```
═══ Vocabulary Validation: {spec-name} ═══

✅ PASS (N items)
  Entity "TodoItem" — registered in domain "todo"
  Enum "task_status.pending" — valid value
  Domain "auth" — valid dependency

❌ FAIL (N items)
  Line 42: "Todo" — alias for "Task" (domain: tasks)
           → Use "Task" instead
  Line 78: "WorkItem" — alias for "Task" (domain: tasks)
           → Use "Task" instead
  Line 95: "Gadget" — not found in vocabulary
           → Register in vocabulary.yaml or use existing entity

⚠️  WARN (N items)
  Line 12: "statuses" — possible typo for enum "task_status"
  Line 55: Term "spec-first" — alias for "spec-driven"
           → Consider using canonical term

📊 Summary
  Entities referenced: N (N valid, N invalid)
  Enums referenced: N (N valid, N invalid)
  Domains referenced: N (N valid, N invalid)
  Terms checked: N (N canonical, N aliases)

🔗 Missing Dependencies
  Spec uses "Client" (domain: clients) but does not
  list "clients" in ## Dependencies
```

## Step 4: Suggest Fixes

For each FAIL, provide:
1. The line number and context
2. The canonical name to use instead
3. If no canonical name exists — suggest adding to vocabulary.yaml

For new entities not yet in the registry, generate a YAML snippet:

```yaml
  - name: NewEntity
    domain: <current-spec-domain>
    description: <inferred from context>
    aliases: []
```

## Step 5: Auto-Registration (Optional)

If the user confirms, add new entities/terms to vocabulary.yaml.
This happens when a spec introduces genuinely new concepts
that don't exist in the registry yet.

Flow:
1. Show the proposed additions
2. User confirms
3. Append to vocabulary.yaml in the correct section
4. Re-validate to confirm all issues resolved

## Severity Levels

| Severity | Meaning | Action |
|----------|---------|--------|
| ❌ FAIL | Alias or unregistered entity used | Must fix before merge |
| ⚠️ WARN | Possible typo or alias in prose | Should fix, not blocking |
| ✅ PASS | Canonical name used correctly | No action needed |

## Common Patterns to Catch

| Wrong | Right | Why |
|-------|-------|-----|
| Todo | Task | "Todo" is an alias for "Task" in tasks domain |
| Account | User | "Account" is an alias for "User" in auth domain |
| Bot | Agent | "Bot" is an alias for "Agent" in ai domain |
| Org | Organization | "Org" is a shorthand alias |
| Connector | Integration | "Connector" is an alias |
| Thread | Conversation | "Thread" is an alias in messages domain |
| Post | Article | "Post" is an alias in blog domain |
| Board | Pipeline | "Board" is an alias in studio domain |

## Integration with OpenSpec Workflow

This skill complements `vivod-openspec-workflow`:

1. **Write spec** → `vivod-openspec-workflow` manages the lifecycle
2. **Validate names** → `openspec-vocab-validator` checks vocabulary
3. **Both run** before any spec change is committed

The vocabulary validator does NOT manage the propose/apply/archive
cycle — that's the workflow skill's job. This skill only validates naming.
