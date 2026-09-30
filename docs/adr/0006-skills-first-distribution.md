# ADR 0006: Skills-first distribution

Status: accepted (2026-09-29), simplified (2026-09-30). The current model is [`../current-model.md`](../current-model.md).

## Context

The first implementation built a CLI, a deterministic engine, JSON schemas, and rule packs, with skills that told the agent to run `npx @readyvibe/cli`. The skill layer, which is what a user installs, had no methodology. Also, `npx skills add` copies only a skill's own folder, so nothing outside a skill directory reaches the user.

## Decision

1. The product is the skill collection, installed with `npx skills add`. There is no ReadyVibe CLI, SDK, engine, runtime, backend, or package.
2. Each skill carries its own method and works alone. `tools/lint-skills.mjs` enforces the structure.
3. Deterministic helpers are small scripts that exist only to make a specific skill better. They live in `scripts/` and are vendored into each skill that declares them; `tools/sync-skills.mjs` copies them and the lint verifies the copies.
4. The launch model is 40 checks plus 12 compliance domains, each owned by a skill.
5. Legal specifics are looked up at official sources while a skill runs (`docs/references/official-sources.md`), never supplied from memory, and never turned into a compliance claim. No legal database is built.
6. UI-changing skills inspect the project's existing design system first. `admin-dashboard` may build a dashboard from the application's real models, in the project's design system, with no invented metrics.

## Consequences

- The old `packages/` (CLI, engine, schemas) and `rules/` were removed; they remain in git history at `64405be`. The 13 architecture documents and 3 platform-specific ADRs moved to `docs/archive/` marked historical.
- `.readyvibe/` is at most an optional working-notes folder that skills may write and none require.
- Vendored helper, reference, and companion copies cost a few MB of repository size in exchange for skills that work after a plain `npx skills add`.
- Real-agent behavior is not covered by the automated checks; it needs a separate model-consuming evaluation.
