# ReadyVibe-Skills: current model

**This is the source of truth.** Anything under `docs/archive/` describes an earlier, larger design and is historical.

## What this is

A **public skills repository**. The product is the skills.

```bash
npx skills add moh-obaida/ReadyVibe-Skills --skill launch-all
```

The user's own coding agent receives the skill and applies it inside their existing project: inspect, decide what applies, do the work, verify, report. That is the whole user experience.

## What this is not

Not a CLI, SDK, engine, runtime, daemon, backend, database, dashboard, compliance SaaS, plugin framework, or npm package ecosystem. No skill requires a ReadyVibe package, account, service, or install step. Nothing is published to npm; the `@readyvibe` scope is reserved and unused.

## The shape

```
skills/<category>/<name>/SKILL.md      the product: one self-contained folder per skill
                        scripts/       helper copies this skill runs (vendored)
                        references/    material this skill links to (vendored or authored)
scripts/                canonical helper scripts (inspect-metadata, check-links, audit-markup,
                        audit-assets, scan-secrets, observe-runtime, inventory-data-model)
                        and their small lib/
docs/references/        canonical shared reference docs (official-sources)
tools/                  sync-skills.mjs (vendoring) and lint-skills.mjs (quality checks)
tests/                  helper tests, lint tests, installability tests
fixtures/               synthetic sites and projects with planted defects
docs/                   this document, skill-layout.md, ADRs, archive/
```

Categories: `core` (entry bundles and foundations), `compliance`, `accessibility`, `discoverability`, `quality`, `security`, `admin`, `internationalization`, `commerce`.

## Self-contained skills

`npx skills add` copies only the skill's own folder. So a skill that runs a helper or cites a shared reference **carries a copy** of it. There is one canonical copy in `scripts/` or `docs/references/`; `metadata.helpers` and `metadata.references` in each `SKILL.md` declare what a skill needs; `pnpm sync` copies it; `pnpm check` fails if any copy is missing, stale, or extra. Contributors edit the canonical file and sync. Users never see any of this.

## Skills work alone

A skill may name companion skills, but never depends on them. Every skill that names another skill carries `references/companion-methods.md` (one canonical file, `docs/references/companion-methods.md`, with a short minimum method for **every** skill) and a **Working alone** section: if a companion is installed, use it; if not, follow its entry and report that the lane ran inline at reduced depth. The lint fails if a named companion has no entry, and `tests/install.test.mjs` installs individual skills alone through the real Skills CLI (in CI the test is mandatory, never skipped).

## How a skill works

Every non-bundle skill is operating method, not a checklist: **Activate when · Inspect · Evidence that counts · May change · Must not claim · Verify · Escalate · No change is valid when.** Bundles (`launch-all`, `compliance-all`, `discoverability-all`, `trust-all`, `quality-all`, `production-all`) are convenience skills that tell the agent to inspect, decide applicability, use the specialist skills and helpers, repair, verify, and summarize. There is no orchestration engine: the `SKILL.md` is the orchestration.

The launch model is finite: **40 launch checks and 12 compliance domains**, each owned by a named skill (`skills/core/launch-all/references/launch-model.md`, `skills/core/compliance-all/references/compliance-domains.md`). The lint fails if one has no owner.

## Rules every skill follows

- **Evidence language.** OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, REVIEW REQUIRED. Unknown is never a pass and never a failure. Suspicion is never reported as fact.
- **Design first.** A skill that creates or changes visible UI first inspects the project's existing design system (`design-system-reconnaissance`) and builds from it. ReadyVibe never imposes its own look.
- **Legal specifics are looked up, not remembered.** No legal database ships here. When a rule matters, the skill reads the current text at an official source while it runs (`docs/references/official-sources.md` lists starting points), cites it with the access date, separates fact from interpretation, and marks applicability REVIEW REQUIRED. If it cannot look it up, the answer is UNKNOWN. No skill claims compliance.
- **Fix what is safe; never fabricate.** No invented legal terms, addresses, retention periods, testimonials, FAQ answers, or metrics.
- **Tailored, not templated.** Skills that build user-facing or operator-facing UI (`admin-dashboard`, `faq-readiness`, error pages, consent, legal pages) derive structure, vocabulary, and layout from the specific product and its design system, so two different sites get visibly different results.
- **`.readyvibe/` is optional.** A skill may leave a short working note there (for example `context.md`). No skill requires it to exist, and it is not a protocol.

## Helpers

Small, zero-dependency Node scripts that exist only because they make a specific skill better: reliable link crawling, sitemap/canonical relationships, secret scanning, markup checks, asset weight, reading the application's data model, and a headless-browser timeline of cookies, storage, and network. They never call a model. `observe-runtime` needs Playwright in the inspected project and says so when it is missing.

**Rule of thumb:** if a 150-line script makes a skill better, keep it. If we are building thousands of lines of infrastructure so a script can call an engine, stop.

## Checks

`pnpm check` runs: vendored copies in sync, skill lint (structure, sections, evidence vocabulary, no platform dependency, design-first, official sources, helper declarations, 40/12 coverage, no package/platform creep), helper tests (fixtures, local servers, real headless Chromium, no model calls), and installability tests (`npx skills add` discovery, install, and running installed helpers alone).

Behavior of a real coding agent following the skills is **not** tested here; that needs a model-consuming evaluation, which is outside these automated checks.
