---
name: error-pages
description: "Use when a routed site needs a launch-quality 404 (and 500) experience: unknown URLs must return a real 404 status, render in the product's own design, help the visitor recover with useful navigation, and expose no debug details. It verifies status codes and fixes framework defaults and soft-404s. Do not use it to add a decorative page served with status 200, to invent site sections for the links, or for expected redirects."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "21"
  helpers: "check-links"
  references: "companion-methods"
---

# error-pages

A launch-ready 404 is not "404 Page Not Found" on a blank framework default. It is a page that **returns 404**, looks like your product, and gets the visitor moving again. And a pretty 404 served with HTTP 200 is a soft-404 that search engines treat as real content.

## Activate when

- Any site with routes; especially SPAs (Vite/CRA) where unknown URLs fall through to `index.html` with 200.
- The 404 is a framework default, unstyled, missing, or `LINK_SOFT_404` showed up in `check-links`.
- Not for intentional redirects or for private/authenticated route handling (that is authorization).

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `design-system-reconnaissance`, `failure-resilience`.

## Inspect

1. **Status code.** Request a clearly invalid URL and read the *status*, not just the page: `curl -s -o /dev/null -w "%{http_code}" <site>/definitely-not-a-page-xyz`. Also try a deep path (`/blog/nope/nope`), a URL with a trailing slash, a wrong-case path, an unknown file (`/missing.png`), and a bad dynamic ID (`/products/999999`, `/users/abc`). Expect 404 (or 410) for each; a *missing resource* (dynamic route with a not-found ID) should also be a real 404 and not an empty product page with 200.
2. **Framework mechanism** (where the fix belongs): Next.js `app/not-found.tsx` + `notFound()` in dynamic routes (and `pages/404.tsx`); Astro `src/pages/404.astro`; SvelteKit `+error.svelte`; Nuxt `error.vue`; Remix `$.tsx` splat route with a 404 status; Vite/React SPA with a router: client-rendered NotFound route **plus** hosting configuration that returns a real 404 for unknown paths *or* an explicit trade-off (SPA fallback returns 200, so pair with `noindex` on the not-found view and server-side route allow-lists where possible); static hosts (`404.html` at root for Netlify/GitHub Pages/Cloudflare Pages/Vercel); Express/others: catch-all with `res.status(404)`.
3. **Design.** Uses the site's layout shell, header/footer, typography, and colors (`design-system-reconnaissance`); works at 375px and in dark mode if the site has it.
4. **Recovery.** Says plainly that the page was not found; offers useful navigation: link home, main sections (the site's own nav), search if the product has one, and a contact/support route; possibly popular pages if real ones exist. Copy in the site's voice. No jokes that block understanding; no dead-end.
5. **No leakage.** No stack traces, file paths, framework debug overlays, internal route lists, or environment info in 404 or 500 pages, in production mode. Check with a production build, not dev mode (dev overlays are expected).
6. **500/error boundary.** A generic, styled server-error page that does not leak details, plus a client-side error boundary for React apps (`failure-resilience`).
7. **Indexing.** A 404 should not be in the sitemap; the 404 page itself may carry `noindex` (harmless with 404 status; required for SPA 200 fallbacks). `check-links` reports `LINK_SOFT_404` if title/h1 say not found while status is 200 (paths relative to this skill's folder: `node scripts/check-links.mjs --url <site> --render`).
8. **API routes** under `/api/*` should return JSON 404s, not the HTML page.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Status code from a real request to the running (production-mode) site: OBSERVED. A `not-found` component existing in source is SOURCE-INDICATED.
- The hosting layer decides the final status for static and SPA deployments; local dev servers often differ from production. If production is not reachable, status behavior is UNKNOWN for that layer.

## May change

Create/replace the not-found and error pages with the project's layout and components; add `notFound()` calls for missing dynamic resources; configure hosting rules (`_redirects`, `vercel.json`, `netlify.toml`, server catch-all) that return true 404s where the platform supports it; add `noindex` on SPA not-found views; remove debug output. Do not invent new site sections or nav items to populate the page: link only to real ones.

## Must not claim

"404 handled everywhere" (list the URL classes tested), or that the host returns 404 when you only tested a dev server.

## Verify

Re-request every URL class tested and confirm status 404 (or 410 where deliberate) with the designed page; view at desktop and 375px; confirm the links on the page resolve (`check-links`); confirm no unexpected `LINK_SOFT_404`; view a production build for absence of debug info.

## Escalate

A platform that cannot return a 404 status for an SPA (record the limitation and the mitigation: `noindex`, prerendering, or a host change); authenticated areas where unknown URLs should redirect to login rather than reveal existence.

## No change is valid when

Unknown URLs return a real 404 in the product's design with recovery paths and no debug details. Do not restyle a working 404 for taste.
