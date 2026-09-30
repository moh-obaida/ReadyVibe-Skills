# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `site-reconnaissance`, `design-system-reconnaissance`, `launch-verification`, `compliance-all`, `discoverability-all`, `trust-all`, `quality-all`, `production-all`, `regulated-domain-triggers`, `consumer-protection-readiness`, `payments-readiness`, `subscription-readiness`, `admin-authorization`, `admin-audit-log`, `admin-dashboard`.

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

### site-reconnaissance
Read `package.json`, framework config, routes, environment templates, and dependencies for auth, payments, email, analytics, forms, user content, and third parties. Record audience and markets only when documented. Label evidence; ask the owner only for facts that change the outcome, at most three at once.

### design-system-reconnaissance
Find the project's tokens (CSS variables, Tailwind config, theme files), reusable components, layout shell, type scale, spacing, dark mode, and voice. View rendered pages at desktop and 375px. Build new UI by the component ladder: reuse an existing component; compose existing components; extend an existing primitive; only then create a new component that matches its neighbors. Match behavior patterns (dialogs, validation, empty states, dark mode, RTL) as well as looks. Never introduce a new style, UI kit, or icon set.

### launch-verification
Re-run the original check that exposed each problem, under the same conditions, plus one adjacent regression check. A fix without a re-check is unverified. Report a scoped verdict (not ready / ready with caveats / no blockers found in the areas verified), never a bare "ready".

### consumer-protection-readiness
Trace one purchase from pricing to checkout to receipt: same price, currency, fees, and total. Check that trial, renewal, cancellation, and refund terms are shown at purchase and agree everywhere; merchant identity is findable; no fake urgency. Test mode on local or staging only.

### regulated-domain-triggers
Scan copy, fields, integrations, and features for health, finance and payments, children and education, legal or professional advice, crypto, gambling, restricted goods, biometrics, precise location, and automated decisions about people. Any signal means: tell the owner ordinary checks do not cover this and specialist review is needed; stop generic compliance work on that surface.

### admin-dashboard
Check for an existing admin. Read the data model, auth, and features to learn what operators do. Write a short brief (operators, frequent tasks, product vocabulary, navigation order, landing view). Build or improve a complete admin in the project's own design system, tailored to this product, with server-side authorization, audit logging for destructive actions, and only real data (no invented metrics).

### admin-authorization
List privileged pages, APIs, and actions. Each needs server-side authentication and authorization, not a hidden link. Test as anonymous, as a normal user, and as an admin on local or staging. Users must not be able to edit their own role.

### admin-audit-log
Privileged and destructive actions record who, what, on which object, and when, without secrets or full personal data; the log is append-only and readable only by appropriate roles.

### payments-readiness
Prefer provider-hosted checkout; secret keys stay server-side; compute amounts on the server; verify webhook signatures; confirm success and cancel URLs; exercise test mode on local or staging only. Never handle real card data.

### subscription-readiness
Renewal, trial conversion, and cancellation are disclosed at purchase and actually work; subscription state follows the provider via webhooks; a failed renewal is handled. Test with the provider's test mode and clocks only.
