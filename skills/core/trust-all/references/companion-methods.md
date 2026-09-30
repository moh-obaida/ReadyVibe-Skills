# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `content-trust`, `faq-readiness`, `error-pages`, `link-integrity`, `failure-resilience`, `public-support`, `launch-identity`, `legal-navigation`.

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

### launch-identity
Replace starter titles ("Vite + React"), default favicons, and template names with the owner's identity, consistently across titles, manifest, icons, and emails. Do not invent a name or logo.

### public-support
Contact routes exist, work, and agree across footer, contact page, and legal pages; no placeholder addresses; promised routes (privacy requests, refunds, abuse) exist. Never invent an address, phone, or response time.

### legal-navigation
Footer, signup, and checkout link to legal pages that exist and resolve. Missing pages are reported to their owning lane; do not create empty placeholder pages to satisfy links.
