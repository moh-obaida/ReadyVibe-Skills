# ReadyVibe-Skills

**Production and launch skills for vibe-coded websites.**

Your AI coding agent built a site that *looks* finished. These skills teach it to find what still stands between that site and a real launch, fix what can safely be fixed, verify the result, and say plainly what needs a human or a lawyer.

```bash
npx skills add moh-obaida/ReadyVibe-Skills --list
npx skills add moh-obaida/ReadyVibe-Skills --skill launch-all
```

Then tell your agent: **"Make this ready to launch."**

No ReadyVibe CLI, package, account, or service is required. A few browser-based checks use Playwright in your project if it is available (the skill says so when it is not). The skills work on your existing project, in your existing design.

## Install

```bash
# see everything available
npx skills add moh-obaida/ReadyVibe-Skills --list

# the broad entry point: "is this ready to launch?"
npx skills add moh-obaida/ReadyVibe-Skills --skill launch-all

# privacy, consent, email, age, rights, and legal-page review
npx skills add moh-obaida/ReadyVibe-Skills --skill compliance-all

# build a full admin UI tailored to your app, in your design system
npx skills add moh-obaida/ReadyVibe-Skills --skill admin-dashboard

# build an FAQ from your real questions and verified answers
npx skills add moh-obaida/ReadyVibe-Skills --skill faq-readiness

# one specialist
npx skills add moh-obaida/ReadyVibe-Skills --skill seo-readiness

# everything
npx skills add moh-obaida/ReadyVibe-Skills --all
```

Each skill is self-contained after install, including any helper script and shared reference it uses. Where a skill mentions other ReadyVibe skills, they are optional: if one is installed the agent uses it, and if not the skill carries a short inline method for it and says the lane ran at reduced depth. So `launch-all` alone gives a real, shallower launch review; install `--all` (or the specialists you care about) when depth matters, for example privacy, consent, accessibility, or building an admin. Installing many skills does not run them all: each one decides for itself whether it applies.

## What it does

A vibe-coded site can have a `localhost` canonical, a private route in its sitemap, analytics that ignore "Reject", an unsubscribe link that goes to `#`, and a privacy page describing a different product. ReadyVibe's skills look at the **actual project** and follow one loop:

```
inspect the project → determine what applies → verify what is true
→ fix what is safe → flag what needs a human → do not invent compliance
```

`launch-all` considers **40 launch checks**, activates only the specialists that can help, and reports **READY · FIXED · BLOCKERS · REVIEW REQUIRED · UNVERIFIED · NEXT ACTION**. `compliance-all` adds **12 conditional compliance domains**. Checks that do not apply are marked *not applicable, with the reason*. No marketing email means no unsubscribe work; no non-essential trackers means no cookie banner is added; no need for an FAQ means none is invented.

The models are in [`launch-model.md`](skills/core/launch-all/references/launch-model.md) and [`compliance-domains.md`](skills/core/compliance-all/references/compliance-domains.md).

## Skills

55 skills in nine categories.

| Category | Skills |
|---|---|
| **core** | Entry points: `launch-all`, `compliance-all`, `discoverability-all`, `trust-all`, `quality-all`, `production-all`. Foundations: `site-reconnaissance`, `design-system-reconnaissance`, `launch-verification`, `compliance-diff` |
| **compliance** | `cookie-and-storage-audit`, `consent-management`, `analytics-privacy`, `third-party-privacy`, `policy-consistency`, `data-flow-mapping`, `privacy-readiness`, `privacy-policy`, `terms-of-service`, `data-rights`, `email-compliance`, `minors-readiness`, `jurisdiction-applicability`, `consumer-protection-readiness`, `regulated-domain-triggers`, `legal-identity-notices`, `ai-features-readiness`, `user-content-safety` |
| **discoverability** | `seo-readiness`, `social-sharing`, `structured-data`, `search-console-readiness` |
| **accessibility** | `wcag-readiness` |
| **quality** | `content-trust`, `faq-readiness`, `link-integrity`, `error-pages`, `failure-resilience`, `forms-readiness`, `mobile-readiness`, `launch-identity`, `public-support`, `legal-navigation`, `performance-readiness` |
| **security** | `web-security`, `deployment-cleanup`, `security-headers`, `dependency-security` |
| **admin** | `admin-dashboard` (builds a complete admin for *your* product), `admin-authorization`, `admin-audit-log` |
| **internationalization** | `multilingual-readiness`, `rtl-readiness` |
| **commerce** | `payments-readiness`, `subscription-readiness` |

## How the skills behave

- **Facts vs. suspicion.** Every skill separates what it *observed* from what it only *suspects*: "vendor appears in source" is not "vendor loaded before consent"; "unsubscribe link exists" is not "future marketing is suppressed"; "delete sets `active=false`" is not "the data is deleted"; "no horizontal scrollbar" is not "works on a phone". Unknown is never turned into a pass or a failure.
- **Your design, not ours.** Anything that creates or changes visible UI (404 pages, consent controls, legal pages, forms, support, unsubscribe, admin screens) first inspects your existing design system and builds from it.
- **Legal specifics are looked up, not remembered.** No skill carries a legal database. When a rule matters, the skill reads the current text at an official source, cites it, separates fact from interpretation, and marks applicability *review required*. If it cannot look it up, the answer is *unknown*. See [`official-sources.md`](docs/references/official-sources.md).
- **It will not invent.** No made-up legal terms, addresses, retention periods, testimonials, FAQ answers, or metrics.
- **Built for your site, not from a template.** `admin-dashboard` reads your data model and features, writes a short brief (who operates this, their frequent tasks, your vocabulary), and builds a full admin whose navigation, labels, landing view, and screens are yours, in your design. It shows only real data: no invented revenue, charts, or growth. `faq-readiness` likewise works from real questions and answers it can verify.
- **It says when to stop.** Regulated domains (health, finance, children, and similar), exposed credentials, and anything needing a lawyer are escalated, not smoothed over.

## Bundled helpers

Where an agent cannot reliably do a job by reading files, the skill carries a small zero-dependency Node script (Node 20+) in its own `scripts/` folder. None call a model.

| Helper | Used for |
|---|---|
| `inspect-metadata.mjs` | titles, descriptions, canonicals, robots.txt, sitemap.xml, noindex, Open Graph, favicon, and the contradictions between them |
| `check-links.mjs` | broken nav, footer, and CTA links, dead hrefs, sitemap and canonical targets; separates confirmed 404s from transient failures |
| `audit-markup.mjs` | labels, alt text, landmarks, viewport, form basics, placeholder text |
| `inventory-data-model.mjs` | entities and columns from Prisma, SQL, Drizzle, and Mongoose; personal-data, soft-delete, and role columns; auth, payments, and UI-kit stack; existing admin routes |
| `audit-assets.mjs` | oversized assets, render-blocking and unsafe external scripts |
| `scan-secrets.mjs` | secrets (redacted), client-exposed env names, tracked `.env`, source maps and localhost in shipped output |
| `observe-runtime.mjs` | headless-browser timeline of cookies, storage, and third parties; reject/accept/withdraw effects; planted-data leakage; forced API failures; overflow; keyboard focus |

`observe-runtime` needs Playwright in the project being inspected and says so when it is missing; everything else runs on plain Node.

## What ReadyVibe will not do

It is not a lawyer, a WCAG conformance audit, a penetration test, or a promise that a search engine will index a page. It will not say "GDPR compliant", "CCPA compliant", or "fully compliant". Whether an agent following these skills produces good work on your project still depends on the agent; review what it changes.

## Repository

```
skills/<category>/<name>/   the skills (each folder is self-contained once installed)
scripts/                    canonical helper scripts
docs/                       current-model.md (source of truth), references/, skill-layout.md, archive/
tools/                      sync-skills.mjs, lint-skills.mjs
tests/                      helper, lint, and installability tests
fixtures/                   synthetic sites and planted-defect projects
```

Read [`docs/current-model.md`](docs/current-model.md). Earlier CLI/engine platform designs are kept in [`docs/archive/`](docs/archive/) as historical only.

## Contributing

```bash
pnpm install
pnpm sync    # after editing a canonical helper or shared reference
pnpm check   # sync check + skill lint + all tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache-2.0. See `LICENSE` and `NOTICE`. Laws and standards stay external and are cited, not relicensed.
