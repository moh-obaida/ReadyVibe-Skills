---
name: quality-all
description: "Use when a site needs a combined accessibility and responsive-quality review: alt text, headings, keyboard use, focus, contrast, form labels, reduced motion, phone and tablet layouts, overflow, tables, dialogs, touch targets, sticky bars. It runs one shared runtime pass and routes to the accessibility and mobile specialists. Do not use it to claim WCAG conformance, to replace assistive-technology testing, or for backend or SEO work."
license: Apache-2.0
metadata:
  kind: bundle
  launch-checks: "27-34"
  helpers: "audit-markup,observe-runtime"
  companions: "wcag-readiness,forms-readiness,mobile-readiness,rtl-readiness,multilingual-readiness"
---

# quality-all

Owns launch family D (checks 27–34). The web looks fine on the developer's laptop and fails for keyboard users, screen-reader users, and everyone holding a phone. Automated scans catch only a slice; this bundle makes sure the rest is looked at deliberately.

## Activate when

- Any public UI is about to launch, or the user mentions accessibility, mobile, responsive, keyboard, or "works on my phone".
- `launch-all` routes here.
- Not for legal conclusions about accessibility. That is REVIEW REQUIRED under `compliance-all` domain 8.

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. The lanes this bundle can activate are companions because it promises to run them when they apply: consider them all, activate only the ones that fit. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `wcag-readiness`, `forms-readiness`, `mobile-readiness`, `rtl-readiness`, `multilingual-readiness`.

## Route

1. **Sweep once** (paths relative to this skill's folder; add `--render` for client-rendered apps):

   ```bash
   node scripts/audit-markup.mjs --url <site> --render
   node scripts/observe-runtime.mjs --url <site> --block-third-party --viewport 375x812
   node scripts/observe-runtime.mjs --url <site> --block-third-party --viewport 1280x800 --steps steps.json   # {"do":"tab","times":15}
   ```
2. **Pick the key flows** (home, main task, one form, one dialog/menu if present, pricing/table if present) and carry them through both viewports. Depth on key flows beats shallow coverage of every page.
3. **Select specialists**:

| Concern | Specialist |
|---|---|
| alt text, semantics, headings, keyboard/focus, contrast, motion, dialogs, error announcement (27–29, 31, 32) | `wcag-readiness` |
| form labels, instructions, validation and errors (30) | `forms-readiness` (with `wcag-readiness` for the accessibility side) |
| phone/tablet layout, overflow, tables, dialogs, touch targets, sticky UI (33, 34) | `mobile-readiness` |
| right-to-left locale served | `rtl-readiness` |
| multiple languages | `multilingual-readiness` |

## Evidence discipline

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- "No horizontal scrollbar" is not mobile readiness. "No axe violations" is not accessibility. State the depth reached.
- Markup scans read the DOM. Keyboard operability, focus order, contrast, and layout behavior need interaction or rendering: mark them UNKNOWN until exercised.
- Handlers attached in JavaScript are invisible to markup scans; read the component source for clickable non-buttons.

## May change

Semantic markup, labels, alt text (only where meaningful text can be derived from visible context), focus styles, media queries, layout constraints, touch-target sizing, `prefers-reduced-motion` handling, viewport meta. Preserve the existing design system.

## Must not claim

"WCAG conformant", "accessible", "ADA compliant", "mobile-friendly", or a pass from a lightweight scan. Say what was checked and at which viewport.

## Verify

Re-run both viewports and the keyboard pass after fixes. Confirm the specific findings cleared and the key flow still completes at 375px and by keyboard alone. Take screenshots if the runtime helper is given `--screenshots`.

## Escalate

Flows that need assistive-technology testing (screen reader on a checkout, complex widgets, charts), and any legal significance of accessibility: REVIEW REQUIRED.

## No change is valid when

Findings are decorative alt text correctly left empty, or a scan hit that the rendered UI does not show. Do not invent alt text ("image of a chart") to silence a scanner.
