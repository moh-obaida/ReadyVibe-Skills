# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `jurisdiction-applicability`, `site-reconnaissance`, `cookie-and-storage-audit`, `data-flow-mapping`, `policy-consistency`, `privacy-policy`, `terms-of-service`, `privacy-readiness`, `consent-management`, `analytics-privacy`, `third-party-privacy`, `email-compliance`, `minors-readiness`, `data-rights`, `consumer-protection-readiness`, `subscription-readiness`, `payments-readiness`, `wcag-readiness`, `web-security`, `security-headers`, `deployment-cleanup`, `regulated-domain-triggers`, `ai-features-readiness`, `legal-identity-notices`, `public-support`, `legal-navigation`.

### site-reconnaissance
Read `package.json`, framework config, routes, environment templates, and dependencies for auth, payments, email, analytics, forms, user content, and third parties. Record audience and markets only when documented. Label evidence; ask the owner only for facts that change the outcome, at most three at once.

### data-flow-mapping
List every form, field, and API route that receives personal data; where it is stored (schema); which vendors receive it. Produce a table of field, storage, recipients, and how it is deleted (or unknown). Trace three fields end to end.

### privacy-readiness
Check minimization (is each field used), personal data in URLs, logs, client storage, and public API responses, access scoping per user, and retention signals. Prove exposure by requesting as a second test user before claiming a leak.

### cookie-and-storage-audit
In a fresh browser context, record cookies, localStorage, sessionStorage, and network requests before any interaction, then after reject and after accept. Classify each item as necessary, functional, analytics, advertising, embed, or unknown; unknown is not essential. Compare with the disclosure.

### consent-management
Inventory what loads before any choice. Decide from an official source whether a choice is applicable; if not verifiable, it is review required. Test reject, accept, and withdraw against requests and cookies, including after reload. Fix by gating the scripts, not by hiding the banner. Add no control if nothing needs gating.

### analytics-privacy
List analytics, advertising, replay, and tag-manager tools from source and network; when each fires; what personal data it receives (emails in URLs, identify calls, form capture); whether the notice names it. "Present in source" is not "fires before consent": prove timing at runtime.

### third-party-privacy
List third-party hosts from network and source; what each receives (at least IP and page URL); whether it is necessary; whether it is disclosed; lower-exposure alternatives (self-hosted fonts, click-to-load embeds).

### privacy-policy
Build a fact sheet: data collected, purposes, recipients, retention, how rights are exercised, operator identity and contact. Write only statements the facts support; use visible placeholders for owner facts; link the page from the footer and every data-collecting form.

### terms-of-service
Map real features (accounts, user content, payments, subscriptions) to clauses. Owner facts (entity, governing law, liability, fees, refunds) stay visible placeholders. Do not copy another company's terms or invent legal choices.

### policy-consistency
Extract every checkable statement from the privacy notice, banner, terms, badges, and marketing copy. Compare each with observed behavior. Report contradictions, omissions, overclaims ("fully compliant"), and unverifiable statements.

### minors-readiness
Compare the stated audience with the evident audience. Check age fields for real enforcement (server-side, no retry loophole), trackers on child-plausible pages, and public features. Any child-directed signal is review required.

### email-compliance
Classify emails as transactional or marketing. For marketing: sender identity, unsubscribe link that is not `#`, a working route, a state change (suppression flag or provider suppression), and a send path that excludes suppressed addresses. Test on staging with a test address; never send real email.

### data-rights
Trace "delete account" from the UI to the database, auth provider, storage, and vendors. Soft delete (`active=false`, `deleted_at`) is retention, not deletion. Verify with a test account that no personal data remains except documented retained records. Check export and opt-out too.

### ai-features-readiness
Provider keys are server-side only (scan the bundle); note what user data reaches the provider; check auth and rate limits on the AI route, output rendering safety, disclosure that AI is used, and failure behavior.

### jurisdiction-applicability
Record markets as declared, inferred (with the signal), or unknown. Look up the relevant regulator or legislation at official sources at run time and cite it; never state which laws apply from memory. Unresolved applicability is review required.

### consumer-protection-readiness
Trace one purchase from pricing to checkout to receipt: same price, currency, fees, and total. Check that trial, renewal, cancellation, and refund terms are shown at purchase and agree everywhere; merchant identity is findable; no fake urgency. Test mode on local or staging only.

### regulated-domain-triggers
Scan copy, fields, integrations, and features for health, finance and payments, children and education, legal or professional advice, crypto, gambling, restricted goods, biometrics, precise location, and automated decisions about people. Any signal means: tell the owner ordinary checks do not cover this and specialist review is needed; stop generic compliance work on that surface.

### legal-identity-notices
The operator name, contact, and copyright line are real and consistent across footer, terms, privacy, and checkout; placeholders ("Your Company") are gone; licenses and attribution for fonts, images, and code are documented. Missing facts are the owner's to supply.

### wcag-readiness
Run an automated markup scan, then check by hand: alt text that conveys function, heading structure, labels and error messages, keyboard operation with visible focus and no traps, contrast of text and controls, reduced motion. State the depth reached; never claim conformance.

### public-support
Contact routes exist, work, and agree across footer, contact page, and legal pages; no placeholder addresses; promised routes (privacy requests, refunds, abuse) exist. Never invent an address, phone, or response time.

### legal-navigation
Footer, signup, and checkout link to legal pages that exist and resolve. Missing pages are reported to their owning lane; do not create empty placeholder pages to satisfy links.

### web-security
Scan source and shipped output for secrets and client-exposed env names. Check that private routes and APIs enforce authorization on the server per resource. Look for debug routes, unsafe HTML rendering, weak session cookies. Never use, rotate, or print a credential; report exposed ones for the owner to rotate.

### security-headers
Inspect headers on the deployed URL (a local server proves nothing about production): HSTS, `X-Content-Type-Options`, referrer policy, framing rules, CSP. Propose a CSP from observed origins and ship it report-only first.

### deployment-cleanup
Search source, config, and built output for localhost and staging URLs, debug routes, source maps, test keys, test data, and dev fallbacks that fail open. Confirm production environment parity with the owner; never edit production settings.

### payments-readiness
Prefer provider-hosted checkout; secret keys stay server-side; compute amounts on the server; verify webhook signatures; confirm success and cancel URLs; exercise test mode on local or staging only. Never handle real card data.

### subscription-readiness
Renewal, trial conversion, and cancellation are disclosed at purchase and actually work; subscription state follows the provider via webhooks; a failed renewal is handled. Test with the provider's test mode and clocks only.
