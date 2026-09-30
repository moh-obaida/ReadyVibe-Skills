# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `user-content-safety`, `payments-readiness`, `subscription-readiness`, `consumer-protection-readiness`, `ai-features-readiness`, `policy-consistency`, `design-system-reconnaissance`.

### design-system-reconnaissance
Find the project's tokens (CSS variables, Tailwind config, theme files), reusable components, layout shell, type scale, spacing, dark mode, and voice. View rendered pages at desktop and 375px. Build new UI by the component ladder: reuse an existing component; compose existing components; extend an existing primitive; only then create a new component that matches its neighbors. Match behavior patterns (dialogs, validation, empty states, dark mode, RTL) as well as looks. Never introduce a new style, UI kit, or icon set.

### policy-consistency
Extract every checkable statement from the privacy notice, banner, terms, badges, and marketing copy. Compare each with observed behavior. Report contradictions, omissions, overclaims ("fully compliant"), and unverifiable statements.

### ai-features-readiness
Provider keys are server-side only (scan the bundle); note what user data reaches the provider; check auth and rate limits on the AI route, output rendering safety, disclosure that AI is used, and failure behavior.

### user-content-safety
Where user content appears and to whom; a reporting route that reaches someone; a way to remove content and suspend users; safe rendering (no unsanitized HTML); upload validation; posting rate limits.

### consumer-protection-readiness
Trace one purchase from pricing to checkout to receipt: same price, currency, fees, and total. Check that trial, renewal, cancellation, and refund terms are shown at purchase and agree everywhere; merchant identity is findable; no fake urgency. Test mode on local or staging only.

### payments-readiness
Prefer provider-hosted checkout; secret keys stay server-side; compute amounts on the server; verify webhook signatures; confirm success and cancel URLs; exercise test mode on local or staging only. Never handle real card data.

### subscription-readiness
Renewal, trial conversion, and cancellation are disclosed at purchase and actually work; subscription state follows the provider via webhooks; a failed renewal is handled. Test with the provider's test mode and clocks only.
