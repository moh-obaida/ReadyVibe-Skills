---
name: trust-all
description: "Use when a site looks finished but may still feel unfinished or untrustworthy to visitors: unclear main action, dead buttons, placeholder text, fake or unverifiable claims, missing contact path, weak 404, broken links, or missing loading and error states. It coordinates the trust-related specialists and verifies the fixes. Do not use it to add trust badges, invent testimonials or metrics, or manufacture an FAQ the product does not need."
license: Apache-2.0
metadata:
  kind: bundle
  launch-checks: "19-26"
  helpers: "check-links,audit-markup"
---

# trust-all

Owns launch family C (checks 19–26). Trust is broader than badges: it is whether the product **does what it visibly promises** and looks like a real business. Visitors decide in seconds, and dead controls, lorem ipsum, invented metrics, and 404s in the footer are what they notice.

## Activate when

- The site is public and about to be shown to real users, investors, press, or customers.
- `launch-all` routes here, or the user says "it feels unfinished / fake / sketchy".
- Not for legal-page authoring (`compliance-all`) or visual redesign (this repairs broken trust surfaces in the existing design).

## Route

1. **Sweep once** (paths relative to this skill's folder; `--render` for client-rendered apps):

   ```bash
   node scripts/check-links.mjs  --url <site> --render     # broken links, dead hrefs, placeholders, mailto/tel
   node scripts/audit-markup.mjs --url <site> --render     # unlabeled/no-name controls, empty headings
   ```
2. **Walk the product as a first-time visitor**, on desktop and a phone-size viewport: land, find the primary action, use it, hit a wrong URL, look for how to reach a human. Note what fails before any tool says so.
3. **Select specialists**:

| Finding | Specialist |
|---|---|
| unclear primary action, dead-end pages, placeholders, fake controls, fake social proof, misleading claims, FAQ need (19, 20, 23, 26) | `content-trust` |
| unknown URLs return 200, framework default 404, no recovery paths (21) | `error-pages` |
| broken nav/footer/CTA/content links, dead hrefs (22) | `link-integrity` |
| infinite spinners, blank empty states, swallowed API errors (24) | `failure-resilience` |
| no reachable contact, invented email, inconsistent contact details (25) | `public-support` |
| product name/branding inconsistent or starter branding left (supports 26) | `launch-identity` |
| footer legal links missing or pointing nowhere | `legal-navigation` |

## Evidence discipline

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- "Button exists" is not "button works": click it, or read its handler and say which you did.
- A claim is not fake because you cannot verify it; it is UNVERIFIED and needs the owner's source. It is *fake* only when evidence shows it (identical "customers" copy from a template, counters that increment on a timer, logos of companies the owner has no relationship with, avatars from stock sets).
- An unreachable external link may be a transient failure; do not call it broken without a 404/410.

## May change

Broken internal links, dead hrefs with an obvious intended target, placeholder text that has an owner-supplied replacement, custom 404, loading/empty/error states, non-legal navigation. Per specialist limits.

## Must not claim

"Trustworthy", "verified", "secure", or any badge/certification the owner has not earned. Never invent testimonials, customer logos, user counts, ratings, press mentions, awards, or "as seen in" strips. Never invent contact details. If proof is missing, remove the fake element or ask the owner for real proof.

## Verify

Repeat the first-visitor walk. Re-run `check-links`: broken and dead-href counts for nav, footer, and CTAs must be zero or explained. Trigger a 404, a failed request, and an empty state and confirm each behaves sensibly.

## Escalate

- Fake or unverifiable claims that are *factual, financial, or health-related* (revenue, guarantees, medical outcomes): REVIEW REQUIRED, and possibly a legal/advertising review. Remove or soften if the owner cannot support them.
- Payment, auth, or signup CTAs that cannot be exercised here: UNVERIFIED with what would settle it.

## No change is valid when

The product is a simple page whose one action works, there are no claims to substantiate, and the 404 and contact path are fine. Do not add an FAQ, trust strip, or extra CTAs to fill space.
