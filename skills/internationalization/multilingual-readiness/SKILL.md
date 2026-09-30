---
name: multilingual-readiness
description: "Use when a site offers more than one language or locale, and you need to check locale routing, html lang, hreflang and canonicals per language, untranslated fallbacks, and whether trust and legal pages exist in each language. Do not use it to translate content yourself without the owner's approval, to call a site multilingual when key pages are missing in a language, or on single-language sites."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "1,12"
  launch-checks: "18,9"
  helpers: "inspect-metadata"
  companions: "design-system-reconnaissance"
---

# multilingual-readiness

A language switcher that leads to half-translated pages, or a privacy policy only in English on a Spanish site, looks careless and can mislead users about what they agreed to.

## Activate when

- The site has a language/locale switcher, locale-prefixed routes, translation files (i18n libs), or `hreflang`.
- Markets are being expanded (also update `jurisdiction-applicability`).
- Not for single-language sites (say so).

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `design-system-reconnaissance`.

## Inspect

1. **Locales and routing:** list supported locales; URL scheme (`/es/`, subdomain, ccTLD, query param); default locale and redirect behavior (auto-redirect by `Accept-Language` can trap crawlers/users; always allow switching); language switcher works and preserves the current page.
2. **`<html lang>`** matches the page language on every locale; `dir` set for RTL locales (`rtl-readiness`).
3. **SEO signals per locale** (`node scripts/inspect-metadata.mjs --url <site>/<locale> --render`; paths relative to this skill's folder): unique titles/descriptions in the page's language; canonical points to the same-language URL (not everything to the default); reciprocal `hreflang` alternates including self-reference and `x-default`; sitemap lists locale URLs (optionally with `xhtml:link` alternates).
4. **Translation completeness:** untranslated strings leaking (keys like `nav.home`, English in the middle of a translated page); fallbacks; pluralization/date/number/currency formatting per locale; text expansion breaking layouts; images with baked-in text.
5. **Trust and legal pages per language:** privacy, terms, contact, refund, cookie notice exist in each supported language or the site states clearly which language governs and links to the version available. **Do not call the site "multilingual" if the privacy notice or checkout is not translated.**
6. **Forms and errors** translated, including validation messages, emails, and 404/500 pages.
7. **Legal implication:** offering a language may imply a target market: record it (`jurisdiction-applicability`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Rendered locale pages: OBSERVED. Translation files: SOURCE-INDICATED (completeness must be checked against rendered pages).
- Translation *quality* needs a fluent speaker: UNKNOWN unless the owner confirms.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components, by the component ladder: reuse, compose, extend, and only then create a matching component. Never impose a ReadyVibe look on the user's site.

Set `lang`/`dir`, `hreflang`, per-locale canonicals and sitemap entries; fix switcher behavior and fallbacks; expose missing-key strings for the owner; link the legal pages that exist per language. Do not machine-translate legal pages or marketing copy into production without the owner's approval; mark drafts clearly if requested.

## Must not claim

"Fully translated", "localized", or "compliant in <language market>". State which pages exist in which locales.

## Verify

Crawl each locale; confirm `lang`, canonicals, `hreflang` reciprocity, and no leaked keys on key pages; confirm legal pages reachable in each locale or clearly explained.

## Escalate

New markets implied by added languages; legal text translations (need qualified review); machine-translated commerce/legal content.

## No change is valid when

The site serves one language and no locale features exist, or all locales are complete and consistent.
