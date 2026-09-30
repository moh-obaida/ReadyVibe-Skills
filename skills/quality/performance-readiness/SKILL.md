---
name: performance-readiness
description: "Use when public pages must load acceptably before launch and you want practical evidence of high-impact waste: oversized images, huge JavaScript bundles, render-blocking scripts, unnecessary fonts and third parties, unsized media causing layout shift, and heavy above-the-fold content. It records lab signals and fixes obvious waste. Do not use it to promise a Lighthouse score or Core Web Vitals outcome, to invent field data, or as a performance laboratory."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "40"
  helpers: "audit-assets,observe-runtime"
  references: "companion-methods"
---

# performance-readiness

Most launch-day slowness comes from a handful of avoidable things: a 4 MB hero PNG, five font files, a chat widget and two trackers on the first paint. Fix those. Deep tuning is a separate project.

## Activate when

- Any public page before launch, or the site feels slow on a phone.
- `production-all` routes here (check 40).
- Not for load testing, server capacity, or database performance.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `production-all`, `third-party-privacy`.

## Inspect

1. **Asset and markup sweep** (paths relative to this skill's folder; production build, served with compression if possible):

   ```bash
   node scripts/audit-assets.mjs --url <site> --render
   node scripts/audit-assets.mjs --dir ./dist          # static sizes
   node scripts/observe-runtime.mjs --url <site> --viewport 375x812 --block-third-party   # request counts per snapshot, console/request failures
   ```
   Findings: `ASSET_OVERSIZED_IMAGE/JS/CSS/FONT`, `RENDER_BLOCKING_SCRIPT`, `MANY_THIRD_PARTY_ORIGINS`, `EXTERNAL_FONT_HOST`, `FONT_DISPLAY_NOT_SWAP`, `MANY_FONT_FAMILIES`, `IMG_NO_DIMENSIONS`, `IMG_NOT_LAZY`, `PAGE_WEIGHT_HIGH`.
2. **Look at what matters most:**
   - **Images:** oversized dimensions vs displayed size; PNG photos that should be WebP/AVIF; no responsive `srcset`/`sizes`; hero image not prioritized (`fetchpriority="high"`, `priority` in `next/image`) while below-the-fold images are not lazy; images without width/height (layout shift).
   - **JavaScript:** large bundles (check build output stats: `next build` size table, `vite build` report, `source-map-explorer`); whole libraries imported for one function (moment, lodash, icon packs); server-only code in the client; unnecessary client components; hydration of static content; heavy above-the-fold JS.
   - **CSS/fonts:** unused CSS frameworks shipped whole, too many font families/weights, no `font-display: swap`, external font hosts (self-hosting fonts removes a request and a third party: `third-party-privacy`).
   - **Blocking resources:** synchronous scripts and stylesheets in `<head>`; late-discovered critical resources; missing `preconnect` for unavoidable third parties.
   - **Third parties:** tag managers, chat widgets, replay, ads loaded eagerly; defer until interaction or consent.
   - **Compression and caching:** gzip/brotli on text assets; long-lived `Cache-Control` with hashed filenames; CDN for static assets (deployment layer: UNKNOWN locally).
   - **Video/animation:** autoplaying large video; heavy scroll animations; lottie/three.js on marketing pages.
3. **Optional lab measurement**, if Lighthouse is available locally, on a production build with throttling, as *lab data only*. Do not install heavy tooling just for this; the helper signals suffice for a launch pass.
4. **Mobile emphasis:** test at 375px on a throttled connection profile if available; the first screen should be usable quickly.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Measured sizes of served assets: OBSERVED for that build and server. Local dev servers skip compression and caching; production behavior is UNKNOWN until the deployed URL is measured.
- Lab numbers are not field performance. Never state LCP/INP/CLS values you did not measure, and never predict them.
- A "heavy" dependency is SOURCE-INDICATED cost until you measure its bundle contribution.

## May change

Resize/compress/convert images (keep originals); add `width`/`height`, `loading="lazy"`, `srcset`, `priority` for the hero; `defer`/`async` scripts; dynamic import heavy components; replace a heavy library with a lighter or native equivalent when trivial; self-host and subset fonts with `font-display: swap`; remove unused CSS/JS and unused dependencies (with the owner's confirmation); lazy-load third parties. Do not rewrite architecture, remove features, or change visible design without asking.

## Must not claim

"Fast", "optimized", "will score N", "passes Core Web Vitals". Report before/after sizes and counts, and what was measured where.

## Verify

Rebuild and re-run `audit-assets` on the same pages: oversized items resolved, blocking scripts fewer, total referenced weight lower; visually check that images still look right at desktop and 375px and nothing broke; confirm no layout shift from resized images.

## Escalate

Poor performance rooted in architecture (heavy SPA hydration, chatty APIs, slow backend), large media libraries, or performance-critical products: deeper profiling beyond this pass; recommend field measurement (RUM) after launch.

## No change is valid when

Assets are reasonably sized, nothing blocks render unnecessarily, and third parties are limited. Do not micro-optimize a healthy page.
