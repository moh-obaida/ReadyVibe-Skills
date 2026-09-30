# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

## Entry points

### launch-all
Establish what the product is (framework, routes, audience, accounts, payments, email, analytics, forms, third parties, deployment) from the repository and running site. Mark each launch check as applies, not applicable (with the observed reason), or unknown. Inspect what applies, fix what is safe, verify each fix by re-checking the original evidence, and report READY / FIXED / BLOCKERS / REVIEW REQUIRED / UNVERIFIED / NEXT ACTION, with the single highest-value next step.

### compliance-all
Decide which compliance areas apply from evidence: personal data, cookies and trackers, marketing email, age or children, accounts and deletion, money, third-party vendors, regulated sector, operator identity. Compare what the site says with what it does. Look up legal specifics at official sources; never assert them from memory; never say "compliant". Report each area as not currently applicable, behavior verified, review required, or unknown.

### discoverability-all
Read rendered titles, descriptions, canonicals, robots.txt, sitemap.xml, noindex directives, social tags, and favicon. Check that they agree with the production origin and with each other: no localhost or staging hosts, no private routes in the sitemap, no noindex page listed, no robots block on listed pages.

### trust-all
Walk the site as a first-time visitor on desktop and phone: is the main action clear and does it work; are there dead controls, placeholders, or fake claims; does an unknown URL give a real 404; is there a working contact path; do loading, empty, and error states behave.

### quality-all
Accessibility and responsive quality: alt text, headings, labels, keyboard and visible focus, contrast, reduced motion; at 375px and 768px check overflow, navigation, forms, tables, dialogs, touch targets, sticky bars, and that the main task completes.

### production-all
Do forms actually deliver, does unsubscribe work and suppress, are secrets or staging artifacts exposed, are HTTPS and security headers sensible, are there oversized assets or blocking scripts. Exercise forms only on local or staging with test data.

## Foundations

### site-reconnaissance
Read `package.json`, framework config, routes, environment templates, and dependencies for auth, payments, email, analytics, forms, user content, and third parties. Record audience and markets only when documented. Label evidence; ask the owner only for facts that change the outcome, at most three at once.

### design-system-reconnaissance
Find the project's tokens (CSS variables, Tailwind config, theme files), reusable components, layout shell, type scale, spacing, dark mode, and voice. View rendered pages at desktop and 375px. Build new UI from these; never introduce a new style or UI kit.

### launch-verification
Re-run the original check that exposed each problem, under the same conditions, plus one adjacent regression check. A fix without a re-check is unverified. Report a scoped verdict (not ready / ready with caveats / no blockers found in the areas verified), never a bare "ready".

### compliance-diff
Read the diff for new third-party scripts, personal-data fields, routes, auth or admin, email sending, payments, locales, and removed protections. List what each introduces and what to recheck.

## Compliance

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

### user-content-safety
Where user content appears and to whom; a reporting route that reaches someone; a way to remove content and suspend users; safe rendering (no unsanitized HTML); upload validation; posting rate limits.

### jurisdiction-applicability
Record markets as declared, inferred (with the signal), or unknown. Look up the relevant regulator or legislation at official sources at run time and cite it; never state which laws apply from memory. Unresolved applicability is review required.

### consumer-protection-readiness
Trace one purchase from pricing to checkout to receipt: same price, currency, fees, and total. Check that trial, renewal, cancellation, and refund terms are shown at purchase and agree everywhere; merchant identity is findable; no fake urgency. Test mode on local or staging only.

### regulated-domain-triggers
Scan copy, fields, integrations, and features for health, finance and payments, children and education, legal or professional advice, crypto, gambling, restricted goods, biometrics, precise location, and automated decisions about people. Any signal means: tell the owner ordinary checks do not cover this and specialist review is needed; stop generic compliance work on that surface.

### legal-identity-notices
The operator name, contact, and copyright line are real and consistent across footer, terms, privacy, and checkout; placeholders ("Your Company") are gone; licenses and attribution for fonts, images, and code are documented. Missing facts are the owner's to supply.

## Accessibility

### wcag-readiness
Run an automated markup scan, then check by hand: alt text that conveys function, heading structure, labels and error messages, keyboard operation with visible focus and no traps, contrast of text and controls, reduced motion. State the depth reached; never claim conformance.

## Discoverability

### seo-readiness
Unique specific titles and descriptions; canonicals on the production origin; robots.txt, sitemap.xml, and noindex agree; private routes absent from the sitemap; no localhost or staging hosts; sitemap URLs return 200. Read rendered HTML, not only source.

### social-sharing
In raw served HTML (no JavaScript): `og:title`, `og:description`, an absolute `og:image` that returns 200, `og:url` matching the canonical, `twitter:card`. No starter or localhost images.

### structured-data
Only for a real article, product, organization, event, or FAQ. JSON-LD must parse and match visible content. No invented ratings, reviews, or prices. No promise of rich results.

### search-console-readiness
Prepare verification and sitemap-submission steps for the owner to perform; add a verification token only if the owner supplies it. Never claim a page is indexed.

## Quality

### content-trust
The primary action is clear and works; no dead controls, placeholders, or lorem text; every number, logo, and testimonial has a source or is removed. Unverifiable is not false, but it is not published as fact either.

### faq-readiness
Find real questions (support messages, product friction, existing copy). Answer only from verified facts or published policy; owner-only facts stay unpublished until supplied. Build in the site's design and link it where decisions happen. If the site does not need one, say so.

### link-integrity
Crawl internal links (nav, footer, CTAs, content), sitemap and canonical targets, mailto and tel. Confirmed broken means 404 or 410 after a retry; timeouts and 5xx are unknown. Fix targets; do not guess a destination for a dead CTA.

### error-pages
Request a nonsense URL and read the status: it must be 404. The page uses the site's design, says what happened, and offers a way back. No stack traces or debug detail.

### failure-resilience
For each data-dependent view, force slow, empty, and failing responses on local or staging. No infinite spinners, blank screens, or swallowed errors; errors are readable with a retry; input is preserved.

### forms-readiness
Labels, validation, and server-side checks; then submit each form on local or staging with test data and confirm the record or message actually arrives; check the error and duplicate-submit paths. Never submit forms on a live site without the owner's authorization.

### mobile-readiness
At 375×812 and 768×1024: correct viewport meta, no horizontal overflow, working navigation, usable forms, scrollable tables, dialogs that fit, touch targets of at least about 24px, sticky bars that do not cover the action, and the main task completes.

### launch-identity
Replace starter titles ("Vite + React"), default favicons, and template names with the owner's identity, consistently across titles, manifest, icons, and emails. Do not invent a name or logo.

### public-support
Contact routes exist, work, and agree across footer, contact page, and legal pages; no placeholder addresses; promised routes (privacy requests, refunds, abuse) exist. Never invent an address, phone, or response time.

### legal-navigation
Footer, signup, and checkout link to legal pages that exist and resolve. Missing pages are reported to their owning lane; do not create empty placeholder pages to satisfy links.

### performance-readiness
Look for oversized images and scripts, render-blocking scripts, many third-party origins, unsized images, and font waste. Fix obvious waste; report sizes before and after; make no score promises.

## Security

### web-security
Scan source and shipped output for secrets and client-exposed env names. Check that private routes and APIs enforce authorization on the server per resource. Look for debug routes, unsafe HTML rendering, weak session cookies. Never use, rotate, or print a credential; report exposed ones for the owner to rotate.

### security-headers
Inspect headers on the deployed URL (a local server proves nothing about production): HSTS, `X-Content-Type-Options`, referrer policy, framing rules, CSP. Propose a CSP from observed origins and ship it report-only first.

### dependency-security
Audit from the lockfile without running install scripts; separate production from dev dependencies; apply patch and minor fixes only; propose major upgrades as a list.

### deployment-cleanup
Search source, config, and built output for localhost and staging URLs, debug routes, source maps, test keys, test data, and dev fallbacks that fail open. Confirm production environment parity with the owner; never edit production settings.

## Admin

### admin-dashboard
Check for an existing admin. Read the data model, auth, and features to learn what operators do. Write a short brief (operators, frequent tasks, product vocabulary, navigation order, landing view). Build or improve a complete admin in the project's own design system, tailored to this product, with server-side authorization, audit logging for destructive actions, and only real data (no invented metrics).

### admin-authorization
List privileged pages, APIs, and actions. Each needs server-side authentication and authorization, not a hidden link. Test as anonymous, as a normal user, and as an admin on local or staging. Users must not be able to edit their own role.

### admin-audit-log
Privileged and destructive actions record who, what, on which object, and when, without secrets or full personal data; the log is append-only and readable only by appropriate roles.

## Internationalization

### multilingual-readiness
Locale routing, `html lang`, `hreflang` and per-locale canonicals, leaked translation keys, and legal and checkout pages in each offered language (or a clear note of which language governs).

### rtl-readiness
`dir="rtl"`, logical CSS properties instead of left and right, mirrored directional icons only, correct bidi handling of mixed text, and script-appropriate typography. Do not mirror logos or media controls.

## Commerce

### payments-readiness
Prefer provider-hosted checkout; secret keys stay server-side; compute amounts on the server; verify webhook signatures; confirm success and cancel URLs; exercise test mode on local or staging only. Never handle real card data.

### subscription-readiness
Renewal, trial conversion, and cancellation are disclosed at purchase and actually work; subscription state follows the provider via webhooks; a failed renewal is handled. Test with the provider's test mode and clocks only.
