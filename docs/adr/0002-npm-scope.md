# ADR 0002: npm scope

Status: accepted, reduced in scope (2026-09-30)

## Decision

The npm organization `@readyvibe` is **reserved and unused**. Nothing in this repository is published to npm, and nothing may depend on a `@readyvibe/*` package. The name stays reserved in case a future project genuinely needs a package.

This replaces the earlier plan (in `docs/archive/`) to publish `@readyvibe/cli`, `@readyvibe/engine`, and `@readyvibe/schemas`. Distribution is `npx skills add moh-obaida/ReadyVibe-Skills`, which reads this repository directly.

`tools/lint-skills.mjs` enforces it: the root `package.json` must be private with no `bin`, `workspaces`, `publishConfig`, `main`, or `exports`; no `@readyvibe/*` dependency; no extra `package.json` outside `fixtures/`; and no `packages/`, `rules/`, `engine/`, `cli/`, `backend/`, or `daemon/` directory.
