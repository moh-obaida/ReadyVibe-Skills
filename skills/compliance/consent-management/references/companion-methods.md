# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `cookie-and-storage-audit`, `design-system-reconnaissance`.

### design-system-reconnaissance
Find the project's tokens (CSS variables, Tailwind config, theme files), reusable components, layout shell, type scale, spacing, dark mode, and voice. View rendered pages at desktop and 375px. Build new UI from these; never introduce a new style or UI kit.

### cookie-and-storage-audit
In a fresh browser context, record cookies, localStorage, sessionStorage, and network requests before any interaction, then after reject and after accept. Classify each item as necessary, functional, analytics, advertising, embed, or unknown; unknown is not essential. Compare with the disclosure.
