---
name: mobile-readiness
description: "Use when a site must work on phones and tablets, and you need real evidence from rendered layouts at small viewports: viewport meta, horizontal overflow, navigation, reading width, forms, tables, dialogs, touch targets, sticky bars, and whether the main task can be completed. Do not use it to treat \"no horizontal scrollbar\" as mobile readiness, to claim device coverage from one emulated size, or to redesign the site."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "33,34"
  helpers: "audit-markup,observe-runtime"
---

# mobile-readiness

Mobile CSS existing is not the same as the site working at mobile sizes. The question is: **can a person on a phone complete the main task, read the content, and reach the actions?**

## Activate when

- Any public web UI before launch, after a redesign, or when users report phone problems.
- `launch-all`/`quality-all` route here (checks 33, 34).
- Not for native app testing or device-lab coverage.

## Inspect

**1. Sweep** (paths relative to this skill's folder; serve a build locally if needed):

```bash
node scripts/audit-markup.mjs --url <site> --render          # VIEWPORT_MISSING, VIEWPORT_ZOOM_DISABLED, FIXED_WIDTH_ELEMENT
node scripts/observe-runtime.mjs --url <site> --block-third-party --viewport 375x812   # HORIZONTAL_OVERFLOW, SMALL_TOUCH_TARGETS, STICKY_UI_COVERS_VIEWPORT, VIEWPORT_LAYOUT_MISMATCH
node scripts/observe-runtime.mjs --url <site> --block-third-party --viewport 768x1024
```
The helper measures against the *device* width, so a desktop-width layout scaled down on a phone (missing viewport meta) and overflowing content are reported separately. Use `--screenshots dir` with `{"do":"screenshot","name":"home-375"}` steps to look at the result.

**2. Walk the key flows at 375×812 and 768×1024 by steps file** (navigate, click, fill), on the pages that matter: home, primary task, pricing/table, a form, a long article, a dialog or menu. Look at, not just measure:

- **Viewport:** `width=device-width, initial-scale=1`; zoom not disabled.
- **Overflow:** any horizontal scroll (the offender list names elements); images and iframes constrained; long words/URLs wrapped; `100vw` misuse; fixed pixel widths.
- **Navigation:** menu opens, closes, is reachable, and links work; no hover-only menus; current-page indication; the primary action stays reachable.
- **Task continuity:** the whole main flow (signup, checkout, booking) completes without dead ends, hidden buttons, or off-screen controls.
- **Reading:** line length, font size (body text at least ~16px), line height, contrast in sunlight-ish conditions, no text clipped or overlapping.
- **Forms:** correct input types trigger the right keyboard; labels visible; the focused field is not hidden behind the keyboard or a sticky bar; validation messages visible.
- **Tables and data:** wide tables scroll inside a container or reflow; charts resize; code blocks scroll.
- **Dialogs/drawers/cookie banners:** fit the viewport, can be closed, do not trap the user, and do not cover the primary action permanently.
- **Touch targets:** interactive elements at least about 24×24 CSS px (WCAG 2.2 minimum), ideally 44×44, with spacing; the helper lists small ones.
- **Sticky/fixed UI:** headers, chat bubbles, bottom bars do not eat a quarter of the screen or hide content.
- **Content priority:** the important thing appears without endless scrolling; nothing critical lives only in a hover state.
- **Orientation:** landscape phone does not break layout (`--viewport 812x375`).
- **Performance on mobile:** heavy images and third parties (`performance-readiness`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Emulated 375px Chromium is OBSERVED for that engine and size. iOS Safari quirks (100vh, safe areas, input zoom below 16px) and real touch behavior are UNKNOWN unless tested on a device.
- "No overflow at 375" says nothing about 320px or landscape; list the sizes you tested.
- CSS media queries in source are SOURCE-INDICATED only.

## May change

Add/fix the viewport meta; constrain media and containers (`max-width: 100%`); wrap long text; make tables scroll in containers; fix menu behavior; enlarge touch targets and spacing; reduce sticky-element height; ensure dialogs fit (`max-height`, scroll); set input types; fix `100vh` with `dvh` where appropriate. Use the project's tokens and components (`design-system-reconnaissance`). Do not restructure the design or remove content to hide overflow.

## Must not claim

"Mobile-friendly", "responsive", or "works on all devices". Say "no overflow and main flow completes at 375×812 and 768×1024 in Chromium emulation; not tested on physical devices".

## Verify

Re-run the sweep and the flow walk at the same sizes after changes; confirm `HORIZONTAL_OVERFLOW`/`VIEWPORT_LAYOUT_MISMATCH` cleared, the main task completes at 375px, and desktop did not regress (1280×800).

## Escalate

Complex apps (dashboards, editors, maps) whose mobile support is a product decision; features that cannot work on touch (hover-only tools); real-device-only bugs (Safari) the owner must test.

## No change is valid when

The site works at the tested sizes and the main task completes. Do not add mobile-only elements or hamburger menus to sites that already fit.
