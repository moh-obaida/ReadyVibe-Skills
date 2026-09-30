---
name: launch-identity
description: "Use when a site still carries generator or template leftovers, or its product identity is inconsistent: starter titles like Vite or Next, default favicons, placeholder company names, wrong product names in metadata and emails, missing app icons and manifest, mixed-up logos. It aligns name, titles, icons, and manifest with owner-supplied identity. Do not use it to invent a company or legal entity name, to design a logo, or to rebrand."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "15,9,26"
  helpers: "inspect-metadata"
  companions: "design-system-reconnaissance"
---

# launch-identity

Nothing signals "unfinished" like a browser tab that says "Vite + React" with a purple lightning-bolt icon. This skill makes the product's name and icon the same everywhere a visitor could see them.

## Activate when

- Titles, favicons, app names, manifest, or emails still show starter or template values, or names differ across the site.
- Before launch, or after a rename/rebrand.
- Not for designing identity, and not for legal entity naming (`legal-identity-notices`).

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `design-system-reconnaissance`.

## Inspect

1. **Canonical identity** from the owner (DECLARED): product name, tagline (if any), logo files, brand colors. Find it in README, docs, logo assets, existing copy; ask once if genuinely absent.
2. **Starter/template residue** (search rendered output and source): "Vite + React", "Create Next App", "React App", "Astro", "Document", "Untitled", "My App", "Your Company", "Acme", "Lovable/bolt/v0 App", default `vite.svg`/`next.svg`/`favicon.ico` from the template, `logo192.png`/`manifest.json` from CRA, generator meta tags, placeholder author fields in `package.json` and metadata (`author`, `description`, `name`).
3. **Where identity appears:** `<title>` and site name pattern; OG `site_name`; header/logo alt text; footer name and copyright; manifest `name`/`short_name`; app-store-ish fields; email "From" names and template headers; error pages; PWA/splash; docs/README; `package.json` name.
4. **Icons:** favicon (`.ico` or `.svg`), `apple-touch-icon` (180×180), manifest icons (192, 512, maskable if a PWA), theme color; all files exist, load (200), are square/appropriately sized, look right on light and dark tab backgrounds, are not the framework's.
5. **Consistency:** the same product name spelling and casing everywhere; no old names after a rename; the domain matches the name in metadata.
6. Run `node scripts/inspect-metadata.mjs --url <site>` (paths relative to this skill's folder): `META_TITLE_STARTER`, `FAVICON_MISSING`, `FAVICON_STARTER`, `FAVICON_BROKEN`.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- The rendered `<title>` and icon links are OBSERVED; source strings are SOURCE-INDICATED.
- The product name is DECLARED by the owner. Do not infer a name from a repo folder or package name if they conflict with visible copy; ask.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components, by the component ladder: reuse, compose, extend, and only then create a matching component. Never impose a ReadyVibe look on the user's site.

Replace starter titles/descriptions with product-specific values derived from owner-provided identity and visible content; swap the favicon and icons for the owner's logo (resize/convert existing brand assets; do not redraw); add missing `apple-touch-icon` and manifest icons; fix names in metadata, manifest, package fields; update copyright name to the owner-supplied one. If no logo exists, a neutral text-monogram icon in the brand color (clearly a placeholder) is acceptable only if the owner agrees; otherwise ask.

## Must not claim

That branding is "final" or "trademarked". Do not invent a company/legal name, tagline, logo, or brand colors.

## Verify

Re-run `inspect-metadata`; view the tab title/icon on the running site (light and dark); load each icon URL; search rendered pages for the starter strings and confirm none remain; confirm manifest validity if present.

## Escalate

Missing brand assets, conflicting names among owner materials, or possible trademark conflicts: ask the owner; recommend a clearance search before a commercial launch.

## No change is valid when

Identity is consistent, no starter residue remains, and icons are the owner's. Do not restyle a working favicon.
