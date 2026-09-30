---
name: third-party-privacy
description: "Use when a site loads scripts, fonts, maps, video, chat, captcha, payment widgets, CDNs, or SDKs from other origins and you need to know who receives visitor data and whether that is disclosed and necessary. It maps every third-party host observed or indicated, what each sees, and what to review. Do not use it to declare a vendor illegal, to judge transfer legality, or to remove a dependency the product needs without asking."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "3,5"
  compliance-domains: "9"
  helpers: "observe-runtime"
  references: "companion-methods"
---

# third-party-privacy

Every third-party request tells that third party at least the visitor's IP address, user agent, and the page they were on. This skill lists who those third parties are and whether the site knows it.

## Activate when

- Any third-party origin appears in network traffic or source (fonts, CDNs, embeds, widgets, SDKs).
- The privacy notice needs a recipient list, or the owner wants to reduce external dependencies.
- Not to rule on international transfer legality or contractual terms with vendors (REVIEW REQUIRED).

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `analytics-privacy`, `payments-readiness`, `regulated-domain-triggers`.

## Inspect

1. **Runtime map (OBSERVED).** `node scripts/observe-runtime.mjs --url <site> --settle 2000 --json` (paths relative to this skill's folder). Read `thirdPartyHosts` and `vendors` per snapshot. Do it for the home page, a form page, a page with embeds, and a checkout/login page if reachable. Unclassified hosts are listed; identify each (script URL, docs, search the source for the host).
2. **Source map (SOURCE-INDICATED).** `<script src>`, `<link href>` to other origins, CSS `@import`/`url()`, `<iframe>` embeds, SDK imports, server-side calls to APIs (payments, email, AI, CRM, maps) that receive user data.
3. **For each recipient record:** what it is; category; what it receives (IP and page URL always; cookies? user identifiers? form data? message content?); when it loads (before or after choice); whether it is necessary for a feature the visitor requested; whether it can be self-hosted or replaced (Google Fonts → self-hosted fonts; YouTube embed → `youtube-nocookie.com` or click-to-load facade; map → static image or click-to-load).
4. **Personal data reaching them.** For forms, run a local/staging submit step with `--canary` and read `CANARY_SENT_TO_THIRD_PARTY` (which host, which field, which encoding).
5. **Disclosure.** Which recipients does the notice name? Which does it omit? Which named ones never appear?
6. **Server-side recipients** you cannot observe from the browser are UNKNOWN: list them from code and env templates as SOURCE-INDICATED.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Observed request to a host: OBSERVED that the browser contacted it; not evidence of what the vendor *does* with the data.
- The vendor catalog classifies hosts heuristically. A category is a lead to verify, not a finding.
- Embeds inside iframes may load further third parties you did not see if the iframe did not load; say what was exercised.

## May change

- Replace with a privacy-preserving equivalent **when it is low-risk and the owner agrees**: self-host fonts, use click-to-load facades for video/maps, remove unused SDKs/scripts, pin and integrity-check CDN scripts, add `referrerpolicy` to external assets, add `rel="noopener noreferrer"` to external links.
- Update the recipient list in the disclosure to state observed recipients (with categories you verified); leave purposes/transfer basis as marked gaps.
- Never remove a payment, fraud, captcha, or security dependency to "reduce third parties".

## Must not claim

"No third-party sharing", "we never share your data", "data stays in the EU", or anything about vendor contracts, processor status, or transfer mechanisms. Never label a vendor compliant or non-compliant.

## Verify

Re-run the runtime map; confirm removed vendors no longer appear, replacements work at desktop and 375px, and the disclosure and observed recipient list agree. Confirm no functionality regressed (font swap, map, embed still work).

## Escalate

- Personal data or sensitive-category data reaching a third party: REVIEW REQUIRED (`analytics-privacy`, `regulated-domain-triggers` if health/finance/children).
- Cross-border transfers, processor agreements, vendor security posture: legal/security review.
- Payment or identity vendors: hand to `payments-readiness`.

## No change is valid when

The site loads only first-party resources and the disclosure says so, or the third parties are necessary, disclosed, and minimal. Report the list and the recheck trigger; do not swap a working vendor for its own sake.
