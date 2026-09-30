---
name: design-system-reconnaissance
description: "Use when about to create or change any visible UI in a project, such as a 404 page, legal page, consent control, or footer link, to record the design tokens, components, layout patterns, and copy tone already in use so new pieces look native. Do not use it to design a new visual style, to redesign the site, or when no visible UI will be created or changed."
license: Apache-2.0
metadata:
  kind: foundation
---

# design-system-reconnaissance

Fixes that look bolted on erode the trust they were meant to build: a 404 in a different font, a cookie control in someone else's blue, a privacy page with default browser styles. This skill records what already exists so new UI is built from it.

## Activate when

- About to add or modify visible UI: `error-pages`, `privacy-policy`/`terms-of-service` pages, `consent-management` controls, footer/nav links, empty/error states, forms.
- Skip it when the change is invisible (metadata, robots, headers) or when a fresh, recent `.readyvibe/design.md` exists.

## Inspect

1. **Tokens.** CSS variables, Tailwind config (`theme.extend`), theme files, `tokens.json`: colors (brand, neutrals, semantic), type scale and families, spacing, radii, shadows, breakpoints. Note dark-mode handling.
2. **Components.** Existing Button, Link, Heading, Container, Card, Dialog, Form field, Footer, Header, Alert. Prefer reuse over new markup. Note variants and how they are composed (Tailwind classes, CSS modules, styled-components, shadcn/ui, MUI).
3. **Layout patterns.** Page shell (header/main/footer), max content width, section rhythm, how text pages (about, blog) are laid out; this is the template for legal pages.
4. **Voice.** Tone and person in existing copy ("we" vs. "Acme"), casing of headings and buttons, punctuation. Legal or policy copy still needs to be clear; match register without adopting jokes in legal text.
5. **Assets.** Logo files, favicon, illustration style, icon set.
6. **Rendered check.** Open the running site at desktop and 375px to see it as visitors do; source can mislead (a component may be overridden).
7. **The component ladder** (write it into your note, and follow it when building): (1) reuse an existing component as is; (2) compose existing components; (3) extend an existing primitive with a variant or prop; (4) only when nothing fits, create a new component that matches the tokens, spacing, and behavior of its neighbors. Never introduce a "ReadyVibe style", and never casually add another UI library, CSS framework, or icon set; if the project already uses one, use it.
8. **Behavior patterns too, not just looks:** how dialogs, menus, forms, validation errors, toasts, loading states, and empty states already behave (focus handling, motion, dark mode, RTL/locale handling); new UI must behave the same way.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Token in source, but unused or overridden: SOURCE-INDICATED. Confirm in the rendered page.
- A style guide in the docs is DECLARED. If the site diverges, the site's actual look wins for consistency.

## May change

Only an optional working note, `.readyvibe/design.md`: a short list of the tokens, components, behavior patterns, and the component ladder the specialist should use, with file paths. Never product code.

## Must not claim

That the site "has a design system" when it has ad-hoc styles; say "no consistent system found; these are the most-used values". Never invent a new palette, typeface, or component library.

## Verify

A specialist that follows the notes should produce UI that uses existing tokens and components. After the UI is built, compare it with an existing page at desktop and 375px; the difference should be the content, not the styling.

## Escalate

Contradictory styles across the site (three buttons, four grays): note it and pick the dominant one for new UI; flag the inconsistency for the owner instead of "fixing" the whole site.

## No change is valid when

The change is not visual, or the project has one page with inline styles you can mirror directly. Then skip the file and match that page.
