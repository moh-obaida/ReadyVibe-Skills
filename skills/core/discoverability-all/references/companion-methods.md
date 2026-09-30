# Companion methods

A **companion** is another ReadyVibe skill whose method a skill may need to perform its own promised work. Each skill declares its companions in `metadata.companions`. Companions may be conditional: declaring one does not mean always running it, and a bundle may declare many lanes while only a few apply to a given site. When a companion's lane applies: if the skill is installed, use it, because it is deeper; if not, follow its entry below and say in your report which lanes ran **inline at reduced depth**. Never skip an applicable lane silently, and never claim a specialist ran when it did not.

A skill mentioned only for escalation, referral, documentation, or optional deeper follow-up is not a companion and not a dependency.

These entries are the essentials, not the full skills. Every entry shares the same rules: label claims OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass and never a failure; suspicion is not fact; fix only what is clearly safe; never invent legal terms, addresses, retention periods, testimonials, or metrics; never claim compliance; for legal specifics read the current text at an official source and cite it (`official-sources`); when changing anything visible, first look at the project's own design system and build from it.

This file contains only the entries for this skill's declared companions: `seo-readiness`, `social-sharing`, `launch-identity`, `deployment-cleanup`, `search-console-readiness`, `structured-data`, `multilingual-readiness`, `link-integrity`.

### seo-readiness
Unique specific titles and descriptions; canonicals on the production origin; robots.txt, sitemap.xml, and noindex agree; private routes absent from the sitemap; no localhost or staging hosts; sitemap URLs return 200. Read rendered HTML, not only source.

### social-sharing
In raw served HTML (no JavaScript): `og:title`, `og:description`, an absolute `og:image` that returns 200, `og:url` matching the canonical, `twitter:card`. No starter or localhost images.

### structured-data
Only for a real article, product, organization, event, or FAQ. JSON-LD must parse and match visible content. No invented ratings, reviews, or prices. No promise of rich results.

### search-console-readiness
Prepare verification and sitemap-submission steps for the owner to perform; add a verification token only if the owner supplies it. Never claim a page is indexed.

### link-integrity
Crawl internal links (nav, footer, CTAs, content), sitemap and canonical targets, mailto and tel. Confirmed broken means 404 or 410 after a retry; timeouts and 5xx are unknown. Fix targets; do not guess a destination for a dead CTA.

### launch-identity
Replace starter titles ("Vite + React"), default favicons, and template names with the owner's identity, consistently across titles, manifest, icons, and emails. Do not invent a name or logo.

### deployment-cleanup
Search source, config, and built output for localhost and staging URLs, debug routes, source maps, test keys, test data, and dev fallbacks that fail open. Confirm production environment parity with the owner; never edit production settings.

### multilingual-readiness
Locale routing, `html lang`, `hreflang` and per-locale canonicals, leaked translation keys, and legal and checkout pages in each offered language (or a clear note of which language governs).
