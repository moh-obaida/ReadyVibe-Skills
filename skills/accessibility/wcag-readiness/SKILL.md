---
name: wcag-readiness
description: "Use when a site should be usable with a keyboard, screen reader, zoom, and different vision and motion needs: image alternatives, semantic structure and headings, keyboard operation and visible focus, contrast, form labels and errors, dialogs, reduced motion, and touch targets. It checks rendered behavior and fixes what is clearly wrong. Do not use it to claim WCAG conformance from an automated scan, to invent alt text a scanner wants, or to assert a legal accessibility outcome."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "27,28,29,30,31,32"
  compliance-domains: "8"
  helpers: "audit-markup,observe-runtime"
  references: "official-sources"
---

# wcag-readiness

Roughly a third to half of WCAG issues can be found automatically. The rest, such as whether alt text is *useful*, whether focus order makes sense, and whether an error is understandable, require someone to use the page. This skill does both, and is honest about which it did.

## Activate when

- Any public or account UI before launch; after adding dialogs, menus, forms, charts, or animation.
- `quality-all` routes here (checks 27–32).
- Not to assert conformance or legal compliance.

## Inspect

**1. Automated pass** (paths relative to this skill's folder; add `--render` for client-rendered apps):

```bash
node scripts/audit-markup.mjs --url <site> --render
```
Covers `LANG_MISSING`, `IMG_ALT_MISSING/FILENAME`, `H1_*`/`HEADING_SKIP`, `LANDMARK_MAIN_MISSING`, `CONTROL_NO_LABEL`, `PLACEHOLDER_ONLY_LABEL`, `LINK_NO_NAME`, `BUTTON_NO_NAME`, `LINK_GENERIC_TEXT`, `CLICKABLE_NON_SEMANTIC`, `IFRAME_NO_TITLE`, `DUPLICATE_ID`, `ARIA_HIDDEN_FOCUSABLE`, `TABINDEX_POSITIVE`, `AUTOPLAY_WITH_SOUND`, `VIEWPORT_ZOOM_DISABLED`. If `axe-core` / `@axe-core/playwright` is installed in the project, run it on key pages as an additional source; it is not required and its clean result is not a pass.

**2. Manual, per key flow (home, main task, a form, a dialog/menu, a data view):**

- **Images and non-text (27):** every meaningful image has alt that conveys its *function or content in context* (not "image", not the filename); decorative images `alt=""`; icon-only buttons have accessible names; charts/infographics have a text summary or data table; video has captions/transcript where speech matters; SVGs have titles where meaningful; text is real text, not baked into images.
- **Structure (28):** one logical heading outline (no skipping for styling); landmarks (`header`, `nav`, `main`, `footer`); lists and tables use real elements with header cells; buttons are `<button>`, links are `<a href>`; page `<title>` unique and descriptive; `lang` correct; skip link when the header is heavy.
- **Keyboard and focus (29):** Tab through the whole page (`{"do":"tab","times":N}` in `observe-runtime`, then look at `focusSamples` and `KEYBOARD_FOCUS_*`). Everything interactive is reachable and operable with Enter/Space/Arrows/Escape; order matches visual order; **focus is always visible** with sufficient contrast; no keyboard traps; dialogs move focus in, trap it, restore it on close, and close on Esc; menus/tabs/accordions follow expected key patterns or standard elements; custom widgets have roles and states; "focus not obscured" by sticky bars.
- **Forms (30):** every field has a programmatically associated label; instructions and required-ness announced; errors identified in text, associated with the field (`aria-describedby`), announced (`role=alert` or focus move), and suggest a fix; autocomplete attributes for personal data; don't rely on color alone.
- **Contrast and readability (31):** text at least 4.5:1 (3:1 for large text), UI component boundaries and focus indicators at least 3:1; check the real rendered colors including hover/disabled states, text over images/gradients, placeholder text, and dark mode; text resizes to 200% and reflows at 320px without loss; body text size and line length sensible; links distinguishable beyond color.
- **Motion (32):** any animation, parallax, auto-playing carousel or video respects `prefers-reduced-motion` (check CSS/JS for the media query and test with emulated reduce); nothing flashes more than three times per second; auto-updating content can be paused.
- **Touch targets:** interactive targets at least 24×24 CSS px (WCAG 2.2), preferably larger (`observe-runtime --viewport 375x812` lists small ones).
- **Other:** zoom not disabled; content not locked to one orientation; timeouts explained; error pages accessible.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Scanner output is OBSERVED for the DOM at that moment, and a clean scan is not a pass. Keyboard, focus, contrast, and screen-reader behavior are UNKNOWN until you exercised them.
- Alt text quality needs human judgment about the image's role; you must *see* the image and its context.
- State the depth reached: "scan + keyboard pass on 4 flows; no screen-reader testing".
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Semantic markup, labels, `aria-*` only when native elements cannot do the job, alt text that describes the image's function using visible context (leave decorative images `alt=""`), heading levels, focus styles, dialog focus management, skip links, error association and announcement, `lang`, reduced-motion styles, contrast adjustments using design tokens (`design-system-reconnaissance`), touch-target sizing. Prefer native HTML over ARIA. Do not write invented alt text to satisfy a scanner; do not add `aria-label`s that contradict visible text; do not add an "accessibility overlay" widget.

## Must not claim

"WCAG 2.2 AA conformant", "ADA compliant", "accessible", "passes accessibility". Report criteria checked, method, and what remains: "automated scan + keyboard walk of N flows; contrast spot-checked on M components; screen-reader testing not done".

## Verify

Re-run `audit-markup`; redo the keyboard walk on the flows you changed (visible focus everywhere, no traps, dialog behavior); recheck contrast on modified colors; test at 200% zoom and 320px width; verify reduced-motion by emulating the preference.

## Escalate

Legal significance of accessibility (public sector, education, commerce, regulated markets): REVIEW REQUIRED; recommend an audit by an accessibility specialist including assistive-technology testing for anything launching commercially. Complex widgets (rich text editors, drag-and-drop, maps, charts) need specialist testing.

## No change is valid when

Findings are correct empty alt on decorative images, scanner artifacts the rendered UI does not show, or the checks pass in the exercised flows. Do not touch working accessible components.
