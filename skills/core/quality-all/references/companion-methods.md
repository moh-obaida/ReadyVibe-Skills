# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `wcag-readiness`, `forms-readiness`, `mobile-readiness`, `rtl-readiness`, `multilingual-readiness`.

### wcag-readiness
Run an automated markup scan, then check by hand: alt text that conveys function, heading structure, labels and error messages, keyboard operation with visible focus and no traps, contrast of text and controls, reduced motion. State the depth reached; never claim conformance.

### forms-readiness
Labels, validation, and server-side checks; then submit each form on local or staging with test data and confirm the record or message actually arrives; check the error and duplicate-submit paths. Never submit forms on a live site without the owner's authorization.

### mobile-readiness
At 375×812 and 768×1024: correct viewport meta, no horizontal overflow, working navigation, usable forms, scrollable tables, dialogs that fit, touch targets of at least about 24px, sticky bars that do not cover the action, and the main task completes.

### multilingual-readiness
Locale routing, `html lang`, `hreflang` and per-locale canonicals, leaked translation keys, and legal and checkout pages in each offered language (or a clear note of which language governs).

### rtl-readiness
`dir="rtl"`, logical CSS properties instead of left and right, mirrored directional icons only, correct bidi handling of mixed text, and script-appropriate typography. Do not mirror logos or media controls.
