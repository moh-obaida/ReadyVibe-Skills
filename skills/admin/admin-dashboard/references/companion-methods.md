# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `design-system-reconnaissance`, `admin-authorization`, `admin-audit-log`, `data-rights`, `wcag-readiness`, `forms-readiness`, `mobile-readiness`, `failure-resilience`.

### design-system-reconnaissance
Find the project's tokens (CSS variables, Tailwind config, theme files), reusable components, layout shell, type scale, spacing, dark mode, and voice. View rendered pages at desktop and 375px. Build new UI from these; never introduce a new style or UI kit.

### data-rights
Trace "delete account" from the UI to the database, auth provider, storage, and vendors. Soft delete (`active=false`, `deleted_at`) is retention, not deletion. Verify with a test account that no personal data remains except documented retained records. Check export and opt-out too.

### wcag-readiness
Run an automated markup scan, then check by hand: alt text that conveys function, heading structure, labels and error messages, keyboard operation with visible focus and no traps, contrast of text and controls, reduced motion. State the depth reached; never claim conformance.

### failure-resilience
For each data-dependent view, force slow, empty, and failing responses on local or staging. No infinite spinners, blank screens, or swallowed errors; errors are readable with a retry; input is preserved.

### forms-readiness
Labels, validation, and server-side checks; then submit each form on local or staging with test data and confirm the record or message actually arrives; check the error and duplicate-submit paths. Never submit forms on a live site without the owner's authorization.

### mobile-readiness
At 375×812 and 768×1024: correct viewport meta, no horizontal overflow, working navigation, usable forms, scrollable tables, dialogs that fit, touch targets of at least about 24px, sticky bars that do not cover the action, and the main task completes.

### admin-authorization
List privileged pages, APIs, and actions. Each needs server-side authentication and authorization, not a hidden link. Test as anonymous, as a normal user, and as an admin on local or staging. Users must not be able to edit their own role.

### admin-audit-log
Privileged and destructive actions record who, what, on which object, and when, without secrets or full personal data; the log is append-only and readable only by appropriate roles.
