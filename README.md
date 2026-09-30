# ReadyVibe

Skills that let your coding agent decide whether a website is actually ready to launch, fix what can safely be fixed, and say plainly what still needs a human.

A vibe-coded site can look finished and still have a `localhost` canonical, a private route in its sitemap, analytics that ignore "Reject", an unsubscribe link that goes to `#`, and a privacy page describing a different product. ReadyVibe finds those.

```
INSPECT the actual product → DETERMINE what applies → VERIFY what is true
→ FIX what can safely be fixed → FLAG what needs human review → DO NOT INVENT COMPLIANCE
```

## Install

```bash
npx skills add moh-obaida/ReadyVibe-Skills --all
```

That is the whole installation. There is no ReadyVibe CLI, package, dashboard, or project setup step. Or pick skills:

```bash
npx skills add moh-obaida/ReadyVibe-Skills --list
npx skills add moh-obaida/ReadyVibe-Skills --skill launch-all seo-readiness consent-management
```

Installing every skill does not run every skill.

## Use

In your coding agent, in your project:

> Check this site before I launch.

`launch-all` takes it from there. It works out what kind of product this is, considers all 40 launch checks, activates only the specialists that can help, verifies what it can in a real browser, fixes safe issues, and reports:

```
READY · FIXED · BLOCKERS · REVIEW REQUIRED · UNVERIFIED · NEXT ACTION
```

## The model: 40 launch checks + 12 conditional compliance domains

ReadyVibe *considers* 52 areas and *activates* only what applies. "No marketing email" means the unsubscribe checks do not apply. No non-essential trackers means it will not add a cookie banner. No FAQ need means it will not manufacture one.

| Family | Checks | Entry skill |
|---|---|---|
| Compliance and privacy | 1–8 privacy policy, terms, cookie/tracker disclosure, consent behavior, analytics inventory, age handling, deletion, contact | `compliance-all` |
| Discoverability | 9–18 titles, descriptions, canonicals, robots, sitemap, social share, favicon, indexing sanity, staging leftovers, URL consistency | `discoverability-all` |
| Trust and product readiness | 19–26 primary CTA, FAQ, 404, broken links, dead controls, states, support path, claims and social proof | `trust-all` |
| Accessibility and responsive | 27–34 alt text, semantics, keyboard and focus, forms, contrast, motion, mobile, overflow and touch | `quality-all` |
| Forms, comms, security, performance | 35–40 forms submit, unsubscribe works, suppression, secrets, headers and CSP, performance | `production-all` |

The full table, with the owning skill and the "not applicable when" condition for every check, is in [`launch-model.md`](skills/bundles/launch-all/references/launch-model.md). Compliance adds 12 applicability-driven domains (jurisdiction, disclosure vs behavior, consent, marketing email, minors, privacy rights, consumer protection, accessibility obligations, vendors, security, regulated-domain triggers, legal identity and notices), routed by `compliance-all`: [`compliance-domains.md`](skills/bundles/compliance-all/references/compliance-domains.md).

## What makes it more than a checklist

Every skill separates what it **observed** from what it only **suspects**:

- "vendor appears in source" is not "vendor loaded before consent"
- "unsubscribe link exists" is not "future marketing is suppressed"
- "delete sets `active=false`" is not "the data is deleted"
- "privacy page says X" is not "the runtime behaves like X"
- "no horizontal scrollbar" is not "works on a phone"
- "sitemap exists" is not "sitemap is safe and correct"

Unknown is never converted into pass or fail. Each skill states when it activates, what it inspects, what evidence counts, what it may change, what it must not claim, how it verifies a fix, when it escalates, and when *no change* is the right answer.

## Skills

54 skills, in six bundles and specialists. Highlights:

| | |
|---|---|
| Entry points | `launch-all`, `compliance-all`, `discoverability-all`, `trust-all`, `quality-all`, `production-all` |
| Foundations | `site-reconnaissance`, `design-system-reconnaissance`, `launch-verification`, `compliance-diff` |
| Privacy behavior | `cookie-and-storage-audit`, `consent-management`, `analytics-privacy`, `third-party-privacy`, `policy-consistency`, `data-flow-mapping`, `data-rights` |
| Legal pages and applicability | `privacy-policy`, `terms-of-service`, `jurisdiction-applicability`, `regulated-domain-triggers`, `legal-identity-notices`, `minors-readiness` |
| Email and commerce | `email-compliance`, `consumer-protection-readiness`, `payments-readiness`, `subscription-readiness` |
| Discoverability | `seo-readiness`, `social-sharing`, `structured-data`, `search-console-readiness`, `multilingual-readiness` |
| Trust and UX | `content-trust`, `link-integrity`, `error-pages`, `failure-resilience`, `launch-identity`, `public-support`, `legal-navigation` |
| Accessibility and mobile | `wcag-readiness`, `mobile-readiness`, `forms-readiness`, `rtl-readiness` |
| Security and performance | `web-security`, `production-readiness`, `security-headers`, `dependency-security`, `performance-readiness`, `ai-features-readiness` |

## Bundled helpers

Where an agent cannot reliably do a job by reading files, the skill carries a small zero-dependency Node script in its own `scripts/` folder (copied per skill, because installs copy only the skill's folder):

| Helper | Used for |
|---|---|
| `inspect-metadata.mjs` | titles, descriptions, canonicals, robots.txt, sitemap.xml, noindex, Open Graph, favicon, and the contradictions between them |
| `check-links.mjs` | broken nav/footer/CTA links, dead hrefs, sitemap and canonical targets; separates confirmed 404s from transient failures |
| `audit-markup.mjs` | labels, alt text, landmarks, viewport, form basics |
| `audit-assets.mjs` | oversized assets, render-blocking scripts, third-party count |
| `scan-secrets.mjs` | secrets (redacted), client-exposed env names, tracked `.env`, source maps and localhost in shipped output |
| `observe-runtime.mjs` | headless-browser timeline of cookies, storage, and third parties; reject/accept/withdraw effects; planted-data leakage; overflow; keyboard focus |

`observe-runtime` needs Playwright in the project being inspected. Everything else runs on plain Node 20+. None of the helpers call a model.

## What ReadyVibe will not do

It is not a lawyer, a WCAG conformance audit, a penetration test, or a promise that a search engine will index a page. It will not say "GDPR compliant", "CCPA compliant", or "fully compliant". Jurisdiction-specific rules are not supplied from model memory; without a reviewed official source, applicability stays *review required* while the technical facts are still verified. It will not invent a company address, retention period, refund term, testimonial, or metric.

## Repository layout

```
skills/<category>/<name>/SKILL.md   the product: one folder per skill
skills/<...>/scripts/               helpers vendored into each skill that uses them
skills/bundles/launch-all/references/, skills/bundles/compliance-all/references/   the 40-check and 12-domain models
scripts/                            canonical helper source and its tests
tools/skill-lint/                   lint for skill quality and model coverage
```

`packages/`, `rules/`, `fixtures/`, and `docs/` hold earlier engine, schema, and rule work. They are internal, unpublished, and **not required by any skill**.

## Contributing

```bash
pnpm install
pnpm check          # helpers in sync + skill lint + all tests
pnpm sync-skills    # after editing anything in scripts/
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache-2.0 for the skills, helpers, and tests. CC0-1.0 for original templates meant to be copied. Laws and standards stay external. See `NOTICE`.
