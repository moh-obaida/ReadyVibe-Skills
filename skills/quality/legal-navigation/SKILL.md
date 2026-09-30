---
name: legal-navigation
description: "Use when legal and policy pages exist or must be reachable, and the footer, signup, checkout, and cookie surfaces need links that point to real pages: privacy, terms, cookies, refund, accessibility, contact. It adds links only to pages that exist and reports missing pages to their owning skills. Do not use it to link to pages that do not exist, to create legal pages itself, or to place links in places that mislead about agreement."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "2,25"
  compliance-domains: "12"
  helpers: "check-links"
  companions: "design-system-reconnaissance"
---

# legal-navigation

A privacy link that 404s is worse than none: it says "we have a policy" and proves otherwise. This skill makes sure legal and policy links exist, resolve, and sit where people (and any acceptance flow) need them.

## Activate when

- Legal pages exist or are being created, and navigation must reach them.
- Footer/signup/checkout show "Privacy" or "Terms" links that go nowhere, or legal pages are unreachable.
- Not to write the pages (`privacy-policy`, `terms-of-service`, `consumer-protection-readiness` for refund text).

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `design-system-reconnaissance`.

## Inspect

1. **Inventory legal pages that exist** in routes/files: privacy, terms, cookies/tracker notice, refund/returns/cancellation, accessibility statement, acknowledgements/licenses, imprint/legal notice, contact/support. Note real URLs.
2. **Inventory legal links** across rendered pages: footer (every page), signup and login forms ("By signing up you agree…"), checkout, newsletter forms, consent controls (link to the cookie/privacy notice), emails, app settings. Run `node scripts/check-links.mjs --url <site> --render` (paths relative to this skill's folder).
3. **Compare:** for every link, does the page exist and resolve (200, not soft-404)? For every existing legal page, is it linked from the footer on all pages? Do acceptance flows link the *actual* terms/privacy pages? Is there text claiming agreement next to a button that does not link the terms?
4. **Missing pages:** which *applicable* pages do not exist (per the launch model: privacy if personal data; terms if accounts/commerce; refund if selling)? Report to the owning skill; do not create a page yourself here.
5. **Placement and honesty:** links are visible and labeled plainly; no pre-checked "I agree" boxes; consent to marketing is separate from terms acceptance; cookie-preferences control is reachable after the first choice (`consent-management`).
6. **Consistency:** link text and page titles agree; URLs are stable; multilingual sites link to the matching language version (`multilingual-readiness`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A link that resolves to a page with content: OBSERVED. A route file that renders "TODO": the page does not exist in any useful sense.
- Whether a page is *legally required* is REVIEW REQUIRED (`jurisdiction-applicability`).

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components, by the component ladder: reuse, compose, extend, and only then create a matching component. Never impose a ReadyVibe look on the user's site.

Add footer and form links **only to pages that exist and are real**; fix wrong URLs; add a preferences link to reopen consent settings if such a control exists; add acceptance text with links near signup where the owner's terms exist; remove links to pages that will not exist (and report why) rather than leaving dead ones. Never create placeholder legal pages to make links resolve.

## Must not claim

"All legal pages present" or "legally required links in place". Say which links exist and resolve.

## Verify

Re-run `check-links`: zero broken legal links; each existing legal page is linked from every page footer sampled; signup/checkout links open the actual documents; view at 375px to confirm the footer is reachable.

## Escalate

Missing pages that appear applicable (`privacy-policy`, `terms-of-service`); sites where applicable legal notices depend on market or sector (`jurisdiction-applicability`, `regulated-domain-triggers`).

## No change is valid when

No legal pages apply yet and none are referenced, or all links exist, resolve, and are placed sensibly.
