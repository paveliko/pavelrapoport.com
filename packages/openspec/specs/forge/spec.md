# forge

> Autonomous CLI pipeline (audit / spec / review / estimate) that is reusable across studio monorepos.

## Purpose

**What:** Project-agnostic Linear + Anthropic orchestrator exposed as a CLI (`audit`, `spec`, `review`, `estimate`). Bound at init time to a project-context markdown path and an issue-key prefix via `forge.config.{ts,mjs,js,json}` or env vars. Engine holds no consumer-specific business logic.

**For whom:** Pavel (operator), AI agents (autonomous consumers), every future studio monorepo that needs the same pipeline.

**Why it exists:** The audit / spec / review / estimate pipeline was originally built inside VIVOD but contains no VIVOD business logic. Forking per project is unsustainable. `@repo/forge` is the single shared engine; consumers inject only configuration.

## Requirements

<!-- Filled by /opsx:archive from openspec/changes/extract-forge-package/specs/forge/spec.md -->

## Entities

<!-- Filled by /opsx:archive -->

## Dependencies

<!-- Filled by /opsx:archive -->
