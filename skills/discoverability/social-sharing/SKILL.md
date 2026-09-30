---
name: social-sharing
description: "Use when a public page may be shared in chat, social, or search previews and its Open Graph and Twitter card tags need to be correct: title, description, absolute image URL, and canonical alignment. It reads rendered output and repairs missing or placeholder tags with product-specific copy. Do not use it to invent preview copy that misdescribes the product, to point images at localhost, or for pages that will never be shared."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "14"
  helpers: "inspect-metadata"
  references: "companion-methods"
---

# social-sharing

When someone pastes your link into Slack, WhatsApp, LinkedIn, or X, a crawler that does not run your JavaScript reads the raw HTML and decides whether you look real. A blank card or a "Vite + React" preview is a launch-day trust hit.

## Activate when

- The product will be shared publicly (launch posts, campaigns, referrals, press).
- `inspect-metadata` shows missing/relative/localhost `og:*` or `twitter:*`, or the preview looks broken.
- Not for pages behind login that are never shared.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `content-trust`.

## Inspect

1. Run `node scripts/inspect-metadata.mjs --url <site>` (paths relative to this skill's folder). Read **raw HTML as served, without JavaScript** (do not pass `--render` for this check), because social crawlers do not execute scripts. If tags appear only with `--render`, that is the finding.
2. Check per key page (home, main product/landing pages, key content pages): `og:title`, `og:description`, `og:image` (absolute HTTPS URL, resolves 200, sensible size: about 1200×630, under a few MB; PNG/JPG/WebP, not SVG), `og:url` (matches canonical), `og:type`, `og:site_name`, `twitter:card` (`summary_large_image` when an image exists), and image `alt` (`og:image:alt`) where supported.
3. **Placeholders and starters:** `vite.svg`, `next.svg`, `placeholder.png`, template hero images, a different product's name, localhost or staging URLs.
4. **Per-page uniqueness:** article/product pages should not all share the home card unless they truly are the same.
5. **Copy quality:** derive from the page's visible headline and product facts, not from a generic tagline; keep it truthful (`content-trust`).
6. **Image asset:** exists in the repo/public folder, is not huge, and is deployed to the production host.
7. **Optional real-world check:** platform debuggers (Facebook Sharing Debugger, LinkedIn Post Inspector, X card preview) need the live URL and are the owner's to run; do not claim their results.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Tags in raw served HTML: OBSERVED. Tags injected client-side: SOURCE-INDICATED for users, but effectively absent for many crawlers.
- Image reachability on a local origin proves nothing about production; UNKNOWN until the deployed URL is checked.
- How a specific platform renders the card is UNKNOWN unless its debugger was used.

## May change

Add or fix `og:*`/`twitter:*` tags through the project's metadata mechanism; create an OG image **only if the owner has brand assets to derive it from** (or generate a simple text-on-brand-color image using existing design tokens via the project's OG tooling such as `next/og`); use absolute URLs based on the confirmed production origin; align `og:url` with canonical. Do not use stock or AI imagery of people or invented product screenshots.

## Must not claim

That previews "will look right on every platform" or are "verified on X". Do not invent taglines, ratings, or numbers in preview copy.

## Verify

Re-run `inspect-metadata` (raw HTML): required tags present, absolute, image responds 200 with an image content-type at the expected host, no starter assets. Confirm the copy is truthful against the page.

## Escalate

Unknown production origin (ask before writing absolute URLs); brand assets missing (ask the owner for a logo or image rather than fabricating one); a preview that requires platform-specific verification.

## No change is valid when

The page is not meant to be shared, or tags are already complete, absolute, correct, and truthful. Do not rewrite good copy.
