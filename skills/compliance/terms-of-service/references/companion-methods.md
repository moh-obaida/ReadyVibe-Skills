# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `user-content-safety`, `payments-readiness`, `subscription-readiness`, `consumer-protection-readiness`, `ai-features-readiness`, `policy-consistency`, `design-system-reconnaissance`.

### design-system-reconnaissance
Find the project's tokens (CSS variables, Tailwind config, theme files), reusable components, layout shell, type scale, spacing, dark mode, and voice. View rendered pages at desktop and 375px. Build new UI by the component ladder: reuse an existing component; compose existing components; extend an existing primitive; only then create a new component that matches its neighbors. Match behavior patterns (dialogs, validation, empty states, dark mode, RTL) as well as looks. Never introduce a new style, UI kit, or icon set.

### policy-consistency
Extract checkable statements from privacy/cookie/returns notices, banner, Terms, badges, checkout and marketing copy. Compare each with actual behavior and report contradictions, omissions, overclaims and unverifiable statements with evidence labels. Use a bundled template only as a conditional drafting reference; do not rewrite owner-approved text just to match it. Verify links and described controls. Never publish unresolved markers or turn UNKNOWN into a claim.

### ai-features-readiness
Provider keys are server-side only (scan the bundle); note what user data reaches the provider; check auth and rate limits on the AI route, output rendering safety, disclosure that AI is used, and failure behavior.

### user-content-safety
Where user content appears and to whom; a reporting route that reaches someone; a way to remove content and suspend users; safe rendering (no unsanitized HTML); upload validation; posting rate limits.

### consumer-protection-readiness
Trace one purchase from price to checkout and receipt. Classify physical goods, digital products/access, booked services, one-time purchases, subscriptions and marketplaces; use only matching modules from the bundled Returns/Refunds template. Keep cancellation of future renewal separate from refunds of past charges. Confirm seller/merchant-of-record identity with the owner and provider evidence. Never invent windows, fees, shipping/RMA steps, refund timing or business identity. Implement and verify an appropriate policy route in the site's design system; test provider flows only in local/staging test mode.

### payments-readiness
Prefer provider-hosted checkout; secret keys stay server-side; compute amounts on the server; verify webhook signatures; confirm success and cancel URLs; exercise test mode on local or staging only. Never handle real card data.

### subscription-readiness
Renewal, trial conversion, and cancellation are disclosed at purchase and actually work; subscription state follows the provider via webhooks; a failed renewal is handled. Cancellation of future renewal is not a refund of an existing charge. Use only applicable Terms/refund modules; confirm commercial promises with the owner. Test with provider test mode and clocks only.
