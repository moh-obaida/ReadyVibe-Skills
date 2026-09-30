# Contributing to ReadyVibe-Skills

ReadyVibe-Skills is a public repository of installable coding-agent skills. **The skills are the product.** Read [`docs/current-model.md`](docs/current-model.md) first; it is the source of truth. Anything under `docs/archive/` is historical.

## Set up and run the checks

```bash
pnpm install        # dev dependencies only: yaml (lint) and playwright-core (browser tests)
pnpm sync           # regenerate vendored copies after editing a helper or shared reference
pnpm check          # sync check + skill lint + all tests: run this before opening a pull request
```

Requires Node 22+ and pnpm 10. Browser tests need Chromium (`pnpm exec playwright-core install chromium`); installability tests need network access for the Skills CLI. On your laptop those tests skip with a clear message when unavailable; **in CI (`CI=true`) they fail instead of skipping**, because the distribution mechanism must always be tested.

## Skill layout

```
skills/<category>/<name>/SKILL.md      authored
                        references/    authored, plus generated/vendored files (see below)
                        scripts/       vendored helpers: never edit
```

- **Categories:** `core`, `compliance`, `accessibility`, `discoverability`, `quality`, `security`, `admin`, `internationalization`, `commerce`.
- **Frontmatter contract** (enforced by `pnpm lint`): `name` equals the folder name (kebab-case, at most 64 characters); `description` is a **quoted** YAML string of at most 1024 characters that says when to use the skill **and** when not to ("Use when… Do not use…"), and distinguishes the skill from its neighbors; `metadata.kind` is `specialist`, `foundation`, `auditor`, or `bundle`. An unquoted `: ` in a description makes the YAML invalid and an installer can silently skip the skill.
- **Sections** (non-bundles): *Activate when · Inspect · Evidence that counts · May change · Must not claim · Verify · Escalate · No change is valid when*. Bundles use *Route* (or *Flow*) and *Evidence discipline* instead of *Inspect* and *Evidence that counts*. Write operating method, not a checklist.
- Full contract: [`docs/skill-layout.md`](docs/skill-layout.md).

## Evidence vocabulary

Claims are labeled **OBSERVED**, **SOURCE-INDICATED**, **DECLARED**, **INFERRED**, **UNKNOWN**, or **REVIEW REQUIRED**. Unknown is never a pass and never a failure. Suspicion is never reported as fact. Every skill's evidence section says so.

## Companions (method dependencies)

A **companion** is a skill whose method your skill may need to perform its own promised work. Declare companions in `metadata.companions` (comma-separated skill names).

- Companions may be conditional. A bundle declares the lanes it can activate, because it promises to run them when they apply; declaring many does not mean running them all.
- **Not a companion:** a mention used only for escalation, referral, documentation, or optional deeper follow-up. Those need no declaration; the skill reports the hand-off and finishes honestly.
- A skill that declares companions needs a **Working alone** section listing them, and each companion needs a minimum-method fallback entry (`### <skill>`) in `docs/references/companion-methods.md`.
- `references/companion-methods.md` inside a skill is **generated** by `pnpm sync` from that library and contains exactly the declared companions' entries. **Never edit it by hand**, never list it in `metadata.references`, and a skill with no companions carries no such file.

## Canonical versus generated files

| Edit this (canonical) | Copies (generated or vendored: never edit) |
|---|---|
| `scripts/*.mjs`, `scripts/lib/*` | `skills/**/scripts/**` |
| `docs/references/official-sources.md` and other shared references | `skills/**/references/<same name>.md` |
| `docs/references/companion-methods.md` | `skills/**/references/companion-methods.md` (pruned per skill) |

`npx skills add` copies only a skill's own folder, so any helper or shared reference a skill uses must be inside it. Skills declare what they need in `metadata.helpers` (names without `.mjs`) and `metadata.references`; `pnpm sync` copies them; `pnpm check` fails if any copy is missing, stale, or extra. The lint also fails if a skill names a helper it does not carry, runs a helper with a flag it does not accept, or cites a finding code no helper emits.

## Helpers

A helper is a small zero-dependency Node script that makes a specific skill better where an agent cannot reliably do the job by reading files. It must have a clear purpose, never replace the agent's judgment, offer valid `--json` output, fail with an understandable message, never print a secret in full, never act on a live production origin without explicit authorization, and start from an installed skill folder with no repository-relative assumptions. **Do not call any model** from a helper or a test. Do not build a framework around helpers.

## Design-first rule

A skill that creates or changes visible UI must first inspect the project's existing design system (declare `design-system-reconnaissance` as a companion and say so), then follow the component ladder: reuse a component, compose components, extend a primitive, and only then create a matching component. Never impose a ReadyVibe look or casually add a UI library. The lint enforces this for a named list of skills; add yours to it in `tools/lint-skills.mjs` if it changes visible UI.

## Legal-source rule

**No legal rules from memory.** Legal-sensitive skills declare `metadata.references: "official-sources"` and tell the agent to read the current text at an official source while running, cite it with the access date, separate the source from its interpretation, and mark applicability REVIEW REQUIRED. Keep legal-review recommendations proportional to a specific unresolved fact or risk. Do not add a legal database or jurisdiction packs.

## Adding a launch check or compliance domain

The models are deliberately finite: **40 launch checks** and **12 compliance domains** (`skills/core/launch-all/references/launch-model.md`, `skills/core/compliance-all/references/compliance-domains.md`). Every row has an owning skill (whose `metadata.launch-checks` / `metadata.compliance-domains` lists it), and the lint fails if one is missing. Add a row only when a real, distinct launch problem has no home, with an owner, a "real question", and an applicability condition. Do not inflate the models to make the catalog bigger, and prefer strengthening an existing skill over adding one.

## Adding or renaming a skill

Skill names are public identifiers. Renaming or removing one is a breaking change (see Versioning). Adding one needs: a distinct description, all required sections, its check/domain ownership, its companions (and their fallback entries), and a place in the README table. Prefer improving an existing skill.

## Tests

Helper tests use static fixtures, local servers, and a real headless browser, never a model. Install tests run the real Skills CLI. New behavior needs a test that **fails without the change**, not one that merely asserts a string. `tools/verify-public-install.mjs` checks the real GitHub remote and release tags.

## Versioning

The repository is the distributed product, tagged with [SemVer](https://semver.org): **patch** for bug, documentation, or method corrections that preserve a skill's intent; **minor** for new skills or backward-compatible new capabilities; **major** for breaking changes to skill names, layout, behavior contracts, or the distribution method. Record every release in [CHANGELOG.md](CHANGELOG.md). Nothing is published to npm.

Add `Signed-off-by:` to commits (Developer Certificate of Origin).
