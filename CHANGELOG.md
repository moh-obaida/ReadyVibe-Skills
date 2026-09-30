# Changelog

All notable changes to ReadyVibe-Skills are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The repository itself is the distributed product; see [CONTRIBUTING.md](CONTRIBUTING.md#versioning) for what each version bump means.

## [Unreleased]

## [1.0.0] - 2026-09-30

First stable release.

### Added

- **55 public skills** in nine categories (`core`, `compliance`, `accessibility`, `discoverability`, `quality`, `security`, `admin`, `internationalization`, `commerce`), installable with `npx skills add moh-obaida/ReadyVibe-Skills`.
- **`launch-all`** and the **40-check launch model**: it considers every launch check, activates only the lanes that apply, verifies fixes, and reports READY / FIXED / BLOCKERS / REVIEW REQUIRED / UNVERIFIED / NEXT ACTION. Every check has an owning skill.
- **`compliance-all`** and the **12 conditional compliance domains**, kept separate from technical fact and from legal applicability. No skill claims legal compliance.
- Family bundles: `discoverability-all`, `trust-all`, `quality-all`, `production-all`.
- **Standalone installation.** Each skill carries its own helpers and shared references. Method dependencies are declared explicitly as `metadata.companions`; a skill installed without a companion carries a generated, pruned **reduced-depth fallback** for it and reports which lanes ran inline at reduced depth.
- **Design-system-aware visual work.** Skills that create or change UI first inspect the project's own design system and follow a component ladder (reuse, compose, extend, create); none impose a ReadyVibe look.
- **`admin-dashboard`** builds or improves a full admin tailored to the specific product and design system, from real models and roles, with server-side authorization, audit logging, and no invented metrics. **`faq-readiness`** builds FAQs from real questions and verified answers only.
- **Seven bundled helper scripts** (`inspect-metadata`, `check-links`, `audit-markup`, `audit-assets`, `scan-secrets`, `observe-runtime`, `inventory-data-model`): zero-dependency, model-free, redaction-safe, and runnable from an installed skill folder. A scan that reads nothing reports `SITE_NOT_READ` and exits non-zero; form submission on non-local origins is refused by default.
- **Evidence model** shared by every skill: observed, source-indicated, declared, inferred, unknown, review required. Unknown is never turned into a pass or a failure.
- **Official-source references** for legal and standards specifics (including the UAE and other major markets), used at run time instead of remembered law.
- **Verification tooling and CI:** a skill lint (structure, sections, evidence vocabulary, companions, helper flags and finding codes, design-first, 40/12 ownership coverage, secrets, no-platform guard); helper, lint, and browser tests; isolated-install tests through the real Skills CLI; and `tools/verify-public-install.mjs` for the public GitHub remote and release tags.

### Notes

- No ReadyVibe CLI, engine, runtime, account, service, or npm package exists or is required. The `@readyvibe` npm scope is reserved and unused.
- Behavior of a real coding agent following these skills is not covered by the automated checks.

[Unreleased]: https://github.com/moh-obaida/ReadyVibe-Skills/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/moh-obaida/ReadyVibe-Skills/releases/tag/v1.0.0
