---
name: terms-of-service
description: "Use when a product with accounts, user content, purchases, subscriptions, or usage rules needs terms, or existing terms must match what the product actually does. It inspects features and drafts only supported sections, marking owner-only facts such as governing law, liability, and fees as gaps. Do not use it to paste boilerplate, to invent governing law or liability limits, or to add terms to a site that makes no commitments."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "2"
  compliance-domains: "7,12"
  references: "official-sources"
---

# terms-of-service

Terms are the rules of *this* product. Generic terms for a product that has no accounts, or missing terms for one that takes money, both mislead. This skill maps real features to real clauses and leaves the legal choices to the owner.

## Activate when

- The product has accounts, user-generated content, purchases or subscriptions, a marketplace, an API, or acceptable-use concerns; or a terms link exists with no page behind it.
- Existing terms describe features the product lacks or omit ones it has.
- Not for a static brochure with no commitments (say so), and not to provide legal advice.

## Inspect

1. **Feature map** from recon: accounts and roles; user content and who sees it (`user-content-safety`); payments, subscriptions, trials, refunds (`payments-readiness`, `subscription-readiness`, `consumer-protection-readiness`); free vs paid tiers; API or automated access; AI-generated content (`ai-features-readiness`); third-party services users must accept; marketplace or multi-party flows; downloads/licensing (`legal-identity-notices`).
2. **Existing text**, if any: compare each clause to features (a subscription clause with no billing code; refunds promised in the FAQ but absent from terms; account termination with no account system).
3. **Owner facts required** (mark MISSING unless provided): legal entity and contact; governing law and venue; liability caps and disclaimers; fee amounts, billing cycle, taxes, refund/cancellation windows; acceptable-use enforcement; age minimum; notice/dispute process; effective date. Treat all of these as **owner or lawyer decisions**.
4. **Draft only supported sections**, in plain language, tied to features: what the service is; accounts and security; acceptable use; user content and license grant *only if the owner states the license*; payments, renewal, cancellation, refunds *only with the owner's real terms*; termination; changes to terms; contact. Skip whole sections for features that do not exist.
5. **Acceptance mechanics.** If terms bind users, check how they are presented: checkbox or "by signing up you agree" text next to the signup button, link to the actual page, and the terms/privacy links in the footer. Do not pre-tick consent boxes.
6. **Reuse the site's shell** and place at `/terms` (`design-system-reconnaissance`, `legal-navigation`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A clause about a feature needs evidence the feature exists (a route, a billing integration, a content form).
- Commercial terms (fees, refunds) are DECLARED by the owner; unsupported ones are placeholders.
- Whether terms are *enforceable* or *sufficient* is not observable. It is REVIEW REQUIRED.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Create or update the terms page; align feature-specific clauses with real features; add acceptance text near signup/checkout; fix broken terms links. Never overwrite lawyer-written terms; produce a mismatch list instead.

## Must not claim

That terms are "legally binding", "enforceable", "comprehensive", "compliant with consumer law", or "protect you from liability". Do not invent governing law, jurisdiction, arbitration clauses, liability caps, warranties disclaimers, refund periods, fee schedules, minimum ages, or a company name. Never copy another company's terms.

## Verify

Every substantive clause maps to a real feature; every placeholder is visible and listed for the owner; links resolve; signup/checkout reference the terms if they are meant to bind; the page renders in the site's design at desktop and 375px. Cross-check with `policy-consistency` and `subscription-readiness` (terms must agree with what checkout shows).

## Escalate

Money, subscriptions, minors, user content with safety risk, marketplaces, health/finance/legal services, and any cross-border sale: REVIEW REQUIRED. For a commercial launch recommend legal review of the terms and state what you could not determine.

## No change is valid when

The site makes no commitments (no accounts, purchases, or user content) and a terms page would add nothing; or existing terms match the features and were reviewed. Say "no terms change needed; recheck when accounts, payments, or content features are added".
