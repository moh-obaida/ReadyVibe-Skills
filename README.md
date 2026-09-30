# ReadyVibe-Skills

[![CI](https://github.com/moh-obaida/ReadyVibe-Skills/actions/workflows/ci.yml/badge.svg)](https://github.com/moh-obaida/ReadyVibe-Skills/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**Production and launch skills for vibe-coded websites.**

Your AI coding agent built a site that *looks* finished. These skills teach that agent to find what still stands between the site and a responsible launch: it inspects what the project actually does, fixes what is safe to fix, verifies each change, and tells you plainly what needs a human or a lawyer.

## Quick start

```bash
npx skills add moh-obaida/ReadyVibe-Skills --skill launch-all
```

Then, in your coding agent, inside your project:

> Make this ready to launch.

That is all. `launch-all` inspects your project, decides which launch areas apply, checks only those, fixes safe issues in your existing design, verifies the fixes, and ends with a short report: **READY · FIXED · BLOCKERS · REVIEW REQUIRED · UNVERIFIED · NEXT ACTION**.

No ReadyVibe CLI, package, account, or service is required. A few browser-based checks use [Playwright](https://playwright.dev) if your project has it; a skill tells you when it cannot run one.

## `launch-all` is not `--all`

These two are easy to confuse, so plainly:

| | What it does |
|---|---|
| `--skill launch-all` | Installs **one** skill. When you run it, it *considers* all 40 launch checks and **activates only the ones that apply** to your site. It never runs all 55 skills. A typical run is a shared inspection plus a handful of relevant lanes. |
| `--all` | Installs **every** skill (for every agent the Skills CLI supports). It does not run anything. Each skill still decides for itself whether it applies. |

Install more than one skill by name if you like:

```bash
npx skills add moh-obaida/ReadyVibe-Skills --skill launch-all seo-readiness consent-management
```

## Install options

```bash
npx skills add moh-obaida/ReadyVibe-Skills --list                      # see every skill
npx skills add moh-obaida/ReadyVibe-Skills --skill launch-all          # the broad entry point
npx skills add moh-obaida/ReadyVibe-Skills --skill compliance-all      # privacy, consent, email, age, rights, legal pages
npx skills add moh-obaida/ReadyVibe-Skills --skill admin-dashboard     # build a full admin tailored to your app
npx skills add moh-obaida/ReadyVibe-Skills --skill faq-readiness       # an FAQ from real questions and verified answers
npx skills add moh-obaida/ReadyVibe-Skills --all                       # every skill, for every supported agent
```

Add `--agent <name>` (for example `--agent claude-code`) to install for one agent only. These commands were verified against Skills CLI 1.7.0.

### Pin to a release

Skills are instructions your agent runs, so pin an install to a release if you do not want it to change underneath you:

```bash
npx skills add moh-obaida/ReadyVibe-Skills#v1.0.0 --skill launch-all
```

The pinned form (`#v1.0.0`, a tag, or a full commit SHA) was verified end to end against the `v1.0.0` release: listing, isolated installs, the default install layout, and `--all`. See the [releases](https://github.com/moh-obaida/ReadyVibe-Skills/releases) and the [CHANGELOG](CHANGELOG.md).

## Standalone skills, and when specialists go deeper

Every skill works **on its own** after install. Its helper scripts and shared references travel inside its own folder.

Where a skill relies on another skill's method (`launch-all` may need the SEO lane, `privacy-policy` may need the data-flow lane), it declares that skill as a *companion*:

- **Companion installed:** the agent uses its full method. That is the deeper result.
- **Companion not installed:** the skill carries a short **reduced-depth fallback** for that lane, and its report says which lanes ran *inline at reduced depth*. It never skips an applicable lane silently.

So `launch-all` alone gives a real, shallower review. Install `--all`, or the specialists you care about most (privacy, consent, accessibility, admin), when depth matters.

## What is in it

**40 launch checks** in five families, plus **12 conditional compliance domains**, each owned by a named skill. A check that does not apply is recorded as *not applicable, with the reason*: no marketing email means no unsubscribe work; no non-essential trackers means no cookie banner is added; no need for an FAQ means none is invented.

| Family | Checks | Entry skill |
|---|---|---|
| Compliance and privacy | 1–8 | `compliance-all` |
| Discoverability | 9–18 | `discoverability-all` |
| Trust and product readiness | 19–26 | `trust-all` |
| Accessibility and responsive quality | 27–34 | `quality-all` |
| Forms, communications, security, performance | 35–40 | `production-all` |

The full models: [`launch-model.md`](skills/core/launch-all/references/launch-model.md) and [`compliance-domains.md`](skills/core/compliance-all/references/compliance-domains.md).

### The 55 skills

| Category | Skills |
|---|---|
| **core** | `launch-all`, `compliance-all`, `discoverability-all`, `trust-all`, `quality-all`, `production-all`, `site-reconnaissance`, `design-system-reconnaissance`, `launch-verification`, `compliance-diff` |
| **compliance** | `cookie-and-storage-audit`, `consent-management`, `analytics-privacy`, `third-party-privacy`, `policy-consistency`, `data-flow-mapping`, `privacy-readiness`, `privacy-policy`, `terms-of-service`, `data-rights`, `email-compliance`, `minors-readiness`, `jurisdiction-applicability`, `consumer-protection-readiness`, `regulated-domain-triggers`, `legal-identity-notices`, `ai-features-readiness`, `user-content-safety` |
| **discoverability** | `seo-readiness`, `social-sharing`, `structured-data`, `search-console-readiness` |
| **accessibility** | `wcag-readiness` |
| **quality** | `content-trust`, `faq-readiness`, `link-integrity`, `error-pages`, `failure-resilience`, `forms-readiness`, `mobile-readiness`, `launch-identity`, `public-support`, `legal-navigation`, `performance-readiness` |
| **security** | `web-security`, `deployment-cleanup`, `security-headers`, `dependency-security` |
| **admin** | `admin-dashboard`, `admin-authorization`, `admin-audit-log` |
| **internationalization** | `multilingual-readiness`, `rtl-readiness` |
| **commerce** | `payments-readiness`, `subscription-readiness` |

## How the skills behave

- **Facts, not suspicion.** Claims are labeled *observed*, *source-indicated*, *declared*, *inferred*, *unknown*, or *review required*. "A vendor appears in source" is not "it loaded before consent"; "an unsubscribe link exists" is not "future marketing is suppressed"; "delete sets `active=false`" is not "the data is deleted"; "no horizontal scrollbar" is not "works on a phone". Unknown is never quietly turned into a pass or a failure.
- **Your design, not ours.** Anything that creates or changes visible UI (404 pages, consent controls, legal pages, forms, an FAQ, an admin) first studies your existing design system, then reuses your components, and never imposes a ReadyVibe look or adds a new UI library.
- **Built for your site, not from a template.** `admin-dashboard` reads your data model and features, works out who operates your product and what they do, and builds a full admin whose navigation, vocabulary, and screens are yours, using only real data: never invented revenue, charts, or users.
- **Legal specifics are looked up, not remembered.** No skill carries a legal database. When a rule matters, the skill reads the current text at an official source, cites it, separates the source from its interpretation, and marks applicability *review required*. If it cannot look it up, the answer is *unknown*. Starting points are in [`official-sources.md`](docs/references/official-sources.md).
- **It will not invent.** No made-up legal terms, addresses, retention periods, testimonials, FAQ answers, or metrics.
- **It says when to stop.** Regulated domains, exposed credentials, and genuinely unresolved legal facts are escalated to a human, in proportion to the real risk.

## Bundled helpers

Where an agent cannot reliably do a job by reading files, a skill carries a small zero-dependency Node script (Node 22 or newer) in its own folder. None call a model, and none need anything from this repository.

| Helper | Used for |
|---|---|
| `inspect-metadata.mjs` | titles, descriptions, canonicals, robots.txt, sitemap.xml, noindex, Open Graph, favicon, and the contradictions between them |
| `check-links.mjs` | broken nav, footer, and CTA links, dead hrefs, sitemap and canonical targets; separates confirmed 404s from transient failures |
| `audit-markup.mjs` | labels, alt text, landmarks, viewport, form basics, placeholder text |
| `audit-assets.mjs` | oversized assets, render-blocking and unsafe external scripts |
| `scan-secrets.mjs` | secrets (always redacted), client-exposed env names, tracked `.env`, source maps and localhost in shipped output |
| `observe-runtime.mjs` | headless-browser timeline of cookies, storage, and third parties; reject/accept/withdraw effects; planted-data leakage; forced API failures; overflow; keyboard focus |
| `inventory-data-model.mjs` | entities and columns from Prisma, SQL, Drizzle, and Mongoose; personal-data, soft-delete, and role columns; the app's auth, payments, and UI-kit stack |

A helper that reads nothing (server down, wrong URL) reports `SITE_NOT_READ` and exits non-zero, never a clean result. `observe-runtime` refuses to submit forms on non-local origins unless you explicitly allow it.

## What ReadyVibe does not promise

It is not a lawyer, a WCAG conformance audit, a penetration test, or a promise that a search engine will index a page. It will not say "GDPR compliant", "CCPA compliant", "fully compliant", "accessible", or "secure" as an unqualified result. Whether an agent following these skills does good work on your project depends on the agent and your project, so review what it changes. Skills are instructions your agent runs with your project's permissions: read a skill before you install it.

## Repository

```
skills/<category>/<name>/   the skills (each folder is self-contained once installed)
scripts/                    canonical helper scripts
docs/                       current-model.md (source of truth), references/, skill-layout.md, release docs, archive/
tools/                      sync-skills.mjs, lint-skills.mjs, verify-public-install.mjs
tests/                      helper, lint, and installability tests
fixtures/                   synthetic sites and planted-defect projects
```

Start with [`docs/current-model.md`](docs/current-model.md). Earlier CLI/engine platform designs are kept in [`docs/archive/`](docs/archive/) as historical only.

## Contributing, security, and releases

- [CONTRIBUTING.md](CONTRIBUTING.md): skill layout, the frontmatter contract, companions, and how to run the checks
- [SECURITY.md](SECURITY.md): how to report a vulnerability
- [CHANGELOG.md](CHANGELOG.md): what changed in each release. Versions follow [SemVer](https://semver.org).

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Laws and standards are cited from their official sources, not copied or relicensed.
