# ADR 0006: Skills-first distribution

Status: accepted (2026-09-29)

## Context

The first implementation pass built a deterministic engine, a CLI, JSON schemas, a rule-pack system, and 45 skills that were generated from one template and told the agent to run `npx @readyvibe/cli`. The infrastructure was solid; the skill layer, which is what a user installs, contained no methodology.

`npx skills add` copies only a skill's own folder into the user's project. It does not install top-level `scripts/`, `shared/`, or npm packages.

## Decision

1. **The product is the skill collection.** Installation is `npx skills add moh-obaida/ReadyVibe-Skills`. There is no second install step, no ReadyVibe CLI to learn, no dashboard, no admin UI, no SDK, and no published npm package.
2. **Each skill carries its own operating method**: when to activate, what to inspect, what evidence counts, what it may change, what it must not claim, how to verify, when to escalate, and when no change is valid. `tools/skill-lint` enforces this mechanically.
3. **Deterministic helpers are skill resources, not a product.** A helper exists only because a specific skill needs a capability an agent cannot reliably get by reading files (link crawling, sitemap/canonical relationships, secret scanning, browser observation of cookies and network, planted-data detection). Helpers are zero-dependency scripts in `scripts/`, tested there, and **vendored into each skill that declares them** (`metadata.helpers`), with `scripts/sync-skill-assets.mjs --check` and the lint enforcing that copies match.
4. **The launch model is canonical and finite**: 40 launch-readiness checks and 12 conditional compliance domains, each owned by a named skill (`skills/bundles/launch-all/references/launch-model.md`, `skills/bundles/compliance-all/references/compliance-domains.md`). ReadyVibe considers all of them, activates what applies, and the lint fails if a check or domain has no owner.
5. **Evidence language is part of every skill**: OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, REVIEW REQUIRED. Unknown is never a pass or a failure. No skill may claim legal compliance.
6. **Legal rules are not supplied from model memory.** Applicability that depends on a jurisdiction stays review-required unless an authoritative, reviewed source is provided.

## Consequences

- `packages/` (schemas, engine, CLI), `rules/`, and most of `docs/architecture/` are internal, unpublished, and not required by any skill. They may be reused underneath skills later; they are not extended for their own sake.
- The `.readyvibe/` directory in a user's project holds short human-readable notes (`context.md`, `verification.md`) written by skills. It is not a schema-validated interchange format.
- `launch-readiness` (duplicate of `launch-all`) and `admin-all` (encouraged building an admin product) were removed. Admin skills were repositioned as launch-safety reviews of admin surfaces that already exist.
- Vendored helper copies cost repository size (about 2 MB) in exchange for skills that work after a plain `npx skills add`.
- Behavior of a real coding agent following these skills is not exercised by any deterministic test here; it needs a model-consuming evaluation, which is deliberately out of scope for this repository's automated checks.
