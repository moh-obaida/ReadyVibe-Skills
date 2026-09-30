# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `data-flow-mapping`, `cookie-and-storage-audit`, `analytics-privacy`, `third-party-privacy`, `data-rights`, `email-compliance`, `minors-readiness`, `payments-readiness`, `policy-consistency`, `design-system-reconnaissance`.

### design-system-reconnaissance
Find the project's tokens (CSS variables, Tailwind config, theme files), reusable components, layout shell, type scale, spacing, dark mode, and voice. View rendered pages at desktop and 375px. Build new UI from these; never introduce a new style or UI kit.

### data-flow-mapping
List every form, field, and API route that receives personal data; where it is stored (schema); which vendors receive it. Produce a table of field, storage, recipients, and how it is deleted (or unknown). Trace three fields end to end.

### cookie-and-storage-audit
In a fresh browser context, record cookies, localStorage, sessionStorage, and network requests before any interaction, then after reject and after accept. Classify each item as necessary, functional, analytics, advertising, embed, or unknown; unknown is not essential. Compare with the disclosure.

### analytics-privacy
List analytics, advertising, replay, and tag-manager tools from source and network; when each fires; what personal data it receives (emails in URLs, identify calls, form capture); whether the notice names it. "Present in source" is not "fires before consent": prove timing at runtime.

### third-party-privacy
List third-party hosts from network and source; what each receives (at least IP and page URL); whether it is necessary; whether it is disclosed; lower-exposure alternatives (self-hosted fonts, click-to-load embeds).

### policy-consistency
Extract every checkable statement from the privacy notice, banner, terms, badges, and marketing copy. Compare each with observed behavior. Report contradictions, omissions, overclaims ("fully compliant"), and unverifiable statements.

### minors-readiness
Compare the stated audience with the evident audience. Check age fields for real enforcement (server-side, no retry loophole), trackers on child-plausible pages, and public features. Any child-directed signal is review required.

### email-compliance
Classify emails as transactional or marketing. For marketing: sender identity, unsubscribe link that is not `#`, a working route, a state change (suppression flag or provider suppression), and a send path that excludes suppressed addresses. Test on staging with a test address; never send real email.

### data-rights
Trace "delete account" from the UI to the database, auth provider, storage, and vendors. Soft delete (`active=false`, `deleted_at`) is retention, not deletion. Verify with a test account that no personal data remains except documented retained records. Check export and opt-out too.

### payments-readiness
Prefer provider-hosted checkout; secret keys stay server-side; compute amounts on the server; verify webhook signatures; confirm success and cancel URLs; exercise test mode on local or staging only. Never handle real card data.
