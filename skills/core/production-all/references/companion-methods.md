# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `forms-readiness`, `email-compliance`, `web-security`, `deployment-cleanup`, `security-headers`, `dependency-security`, `performance-readiness`, `admin-authorization`, `admin-audit-log`, `admin-dashboard`.

### email-compliance
Classify emails as transactional or marketing. For marketing: sender identity, unsubscribe link that is not `#`, a working route, a state change (suppression flag or provider suppression), and a send path that excludes suppressed addresses. Test on staging with a test address; never send real email.

### forms-readiness
Labels, validation, and server-side checks; then submit each form on local or staging with test data and confirm the record or message actually arrives; check the error and duplicate-submit paths. Never submit forms on a live site without the owner's authorization.

### performance-readiness
Look for oversized images and scripts, render-blocking scripts, many third-party origins, unsized images, and font waste. Fix obvious waste; report sizes before and after; make no score promises.

### web-security
Scan source and shipped output for secrets and client-exposed env names. Check that private routes and APIs enforce authorization on the server per resource. Look for debug routes, unsafe HTML rendering, weak session cookies. Never use, rotate, or print a credential; report exposed ones for the owner to rotate.

### security-headers
Inspect headers on the deployed URL (a local server proves nothing about production): HSTS, `X-Content-Type-Options`, referrer policy, framing rules, CSP. Propose a CSP from observed origins and ship it report-only first.

### dependency-security
Audit from the lockfile without running install scripts; separate production from dev dependencies; apply patch and minor fixes only; propose major upgrades as a list.

### deployment-cleanup
Search source, config, and built output for localhost and staging URLs, debug routes, source maps, test keys, test data, and dev fallbacks that fail open. Confirm production environment parity with the owner; never edit production settings.

### admin-dashboard
Check for an existing admin. Read the data model, auth, and features to learn what operators do. Write a short brief (operators, frequent tasks, product vocabulary, navigation order, landing view). Build or improve a complete admin in the project's own design system, tailored to this product, with server-side authorization, audit logging for destructive actions, and only real data (no invented metrics).

### admin-authorization
List privileged pages, APIs, and actions. Each needs server-side authentication and authorization, not a hidden link. Test as anonymous, as a normal user, and as an admin on local or staging. Users must not be able to edit their own role.

### admin-audit-log
Privileged and destructive actions record who, what, on which object, and when, without secrets or full personal data; the log is append-only and readable only by appropriate roles.
