# Planted-defect projects

Tiny, synthetic, source-level projects, each with one deliberate defect. They exist so people (and later, model-based evaluations) can point a skill at something with a known problem and check that it is found and handled honestly.

| Project | Planted defect | Skill that should notice |
|---|---|---|
| `fake-deletion` | "Permanently delete" only sets `active: false` | `data-rights` |
| `newsletter-broken` | marketing send with an unsubscribe link and no suppression check | `email-compliance` |
| `secret-in-client` | `NEXT_PUBLIC_SECRET_KEY` read in client code | `web-security` |
| `private-sitemap` | a private dashboard route listed in `sitemap.xml` | `seo-readiness` |
| `site-bad-consent` | analytics loads at page load; page says "We do not use analytics" and "GDPR compliant" | `analytics-privacy`, `policy-consistency`, `consent-management` |
| `portfolio-minimal` | no analytics, no accounts, no forms: consent, data-rights, and email work should be reported *not applicable*, not invented | `consent-management`, `data-rights`, `email-compliance` (expect "not applicable") |

Two are used by the deterministic tests (`secret-in-client`, `private-sitemap`). All values are fake.
