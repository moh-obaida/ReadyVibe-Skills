---
name: rtl-readiness
description: "Use when an RTL language such as Arabic, Hebrew, Persian, or Urdu is served or planned, and layout and behavior must mirror correctly: dir attribute, logical CSS properties, mirrored navigation, bidi text, icons, and forms. It checks rendered pages in RTL and fixes layout logic. Do not use it to mirror non-directional icons, to flip images with text, or on sites with no RTL locale."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "33,28"
  helpers: "observe-runtime"
---

# rtl-readiness

RTL is not "flip the page". Direction, layout, and reading order change; icons, numbers, and mixed-language text have their own rules. A half-mirrored site tells RTL readers it was not built for them.

## Activate when

- An RTL locale is offered or planned; content includes RTL text; users report backwards layouts.
- Not for LTR-only sites.

## Inspect

1. **Direction:** `<html dir="rtl" lang="ar">` (or `dir="auto"` for user content); set on the document, not by ad-hoc per-element hacks; switching locale switches `dir`.
2. **CSS logic:** physical properties (`margin-left`, `padding-right`, `left: 0`, `text-align: left`, `float`, `border-left`) that should be logical (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`, `border-inline-start`); Tailwind `ms-*`/`me-*`/`ps-*`/`pe-*` and `rtl:` variants vs `ml-*`/`mr-*`; flexbox/grid order relying on physical direction; transforms/animations translating on X axis; scrollbars and carousels.
3. **Rendered pass** at desktop and 375px with the RTL locale (`observe-runtime --viewport 375x812 --steps steps.json` with a `goto` to the RTL path; `--screenshots` to look at it; paths relative to this skill's folder): navigation order and alignment, header/logo/menu placement, breadcrumbs, forms (labels, inputs, validation icons on the correct side), tables (column order), dialogs and close buttons, toasts, pagination arrows, progress bars.
4. **Icons and media:** directional icons (arrows, chevrons, back/forward, send, breadcrumbs) mirror; non-directional icons (logos, play, clock, checkmarks, brand marks, media controls) do not; images with baked-in text or diagrams with left-to-right flow are handled deliberately.
5. **Bidi text:** mixed RTL/LTR strings (brand names, numbers, URLs, emails, phone numbers, code) render in the correct order; punctuation at the wrong end; `<bdi>`/`dir="auto"` for user-generated strings; numerals (Western vs Arabic-Indic) chosen deliberately and consistently; input fields for emails/URLs are LTR.
6. **Typography:** font supports the script well (weight, diacritics); line-height and size adequate (Arabic/Persian often need more); no letter-spacing on connected scripts (it breaks joining); no forced uppercase.
7. **Locale formatting:** dates, numbers, currency via `Intl` for the locale; calendar expectations (a product decision: owner).
8. **Metadata and legal:** the RTL-language pages have translated trust/legal pages (`multilingual-readiness`), `lang`/`hreflang`, and correct social text.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Rendered RTL layout at the tested sizes: OBSERVED. CSS using logical properties: SOURCE-INDICATED.
- Language and translation quality need a native reader: UNKNOWN unless one reviewed it.

## May change

Set `dir`/`lang`; convert physical CSS to logical properties or add `rtl:` variants; mirror directional icons; fix flex/grid ordering; wrap mixed-direction strings; adjust typography for the script; fix RTL-specific overflow. Preserve the design system; do not rewrite styles wholesale. Do not mirror logos or media controls, and do not machine-translate copy.

## Must not claim

"RTL-ready" or "fully localized". State the pages, sizes, and locales viewed and that a native-speaker review is pending.

## Verify

Re-screenshot the same pages in RTL and LTR: LTR unchanged; RTL mirrored where it should be; no overflow at 375px; forms and dialogs operate correctly; keyboard order follows visual order.

## Escalate

Content or UX decisions that depend on cultural/locale knowledge; legal translations; complex editors, charts, and maps in RTL.

## No change is valid when

No RTL locale is served or planned; or RTL pages already render and behave correctly.
