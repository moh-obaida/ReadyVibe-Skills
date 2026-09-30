---
name: seo-readiness
description: "Use when public pages should be found in search, and titles, meta descriptions, canonicals, robots.txt, sitemap.xml, indexing directives, and URL consistency need to be correct and agree with each other. It checks rendered output and the relationships between files, and repairs localhost canonicals, private routes in sitemaps, and starter metadata. Do not use it to promise indexing or ranking, to keyword-stuff, or on a product that is intentionally private."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "9,10,11,12,13,16,18"
  helpers: "inspect-metadata,check-links"
  references: "companion-methods"
---

# seo-readiness

File existence is the easy 10%. The failures that cost launches are **contradictions**: canonical says localhost, sitemap advertises `/admin`, a `noindex` left over from staging, robots blocking the pages the sitemap lists. This skill reads the relationships.

## Activate when

- The product has public pages meant to be found, or launch/domain/redesign is near.
- Titles look like "Vite + React", canonicals or sitemap hosts look wrong, or the site has never been indexed.
- Not for a private/internal product (confirm it is consistently `noindex`), not for ranking strategy or keyword research.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `multilingual-readiness`, `search-console-readiness`, `site-reconnaissance`, `web-security`.

## Inspect

1. **Intent.** Should this site be indexed? Production origin (scheme, host, `www`)? Public vs private routes? Ask only if `.readyvibe/context.md` and config do not say (`site-reconnaissance`).
2. **Run the sweep** (paths relative to this skill's folder; add `--render` for client-rendered apps; serve a build locally if needed):

   ```bash
   node scripts/inspect-metadata.mjs --url <site> --render --private-path /dashboard
   node scripts/check-links.mjs      --url <site> --render     # sitemap/canonical target status
   ```
   Read **rendered** HTML: frameworks can override tags after hydration. Compare with source (`<Head>`, `metadata` exports, `next-seo`, `react-helmet`, `index.html`) to find where each value comes from, so fixes land in the right place.
3. **Relationships to reason about:**

   | Signal A | vs. Signal B | Problem |
   |---|---|---|
   | canonical host | production origin | localhost/staging/preview host in a canonical (HIGH) |
   | sitemap `<loc>` host | canonical host | search engines get two truths |
   | sitemap lists path | page is `noindex` or private route | contradictory signals; private exposure (HIGH for admin/dashboard/api) |
   | sitemap lists path | robots blocks it | unfetchable listing |
   | sitemap lists path | canonical points elsewhere | non-canonical URL listed |
   | sitemap lists path | returns 404/redirect/soft-404 | dead listing (`check-links`) |
   | robots `Sitemap:` | actual sitemap URL/host | wrong or dev sitemap advertised |
   | robots `Disallow: /` | production intent | whole site blocked (HIGH) |
   | robots `Disallow: /_next/` `/assets/` | rendering | crawlers cannot render |
   | robots lists `/admin` | route reachable? | robots is not access control; hands attackers a map |
   | `noindex` on home/most pages | launch intent | staging leftover (HIGH) |
   | `x-robots-tag` header | meta robots | header may override; check both |
   | several pages | the same canonical URL (`CANONICAL_DUPLICATE_TARGET`) | template copied from the home page; tells engines to ignore the rest |
   | robots blocks a linked public page (`ROBOTS_BLOCKS_PAGE`) | page's title, description, and `noindex` are never read | crawler cannot see it |
   | trailing slash / `www` / `http` variants | canonical + redirects | duplicate URL forms |

4. **Titles and descriptions:** unique per page, specific to the page's content, front-load the topic, roughly 50-60 / 120-160 characters as a guideline (truncation, not a rule); no framework defaults; no keyword stuffing. Derive copy from the page's visible content and product facts; do not invent claims.
5. **Multi-language:** `hreflang` pairs, per-language canonicals (with `multilingual-readiness`).
6. **JS-only pages:** if content appears only after JavaScript and no server rendering or prerender exists, say indexing depends on the crawler executing JS: SOURCE-INDICATED risk, not proven.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Rendered tag from the running site: OBSERVED. Tag in source only: SOURCE-INDICATED.
- Local checks cannot show what the production CDN redirects, rewrites, or serves. Verify the live URL when one exists; otherwise mark host/redirect behavior UNKNOWN.
- Never state a page "is indexed", "will rank", or "Google will show X"; that needs Search Console (`search-console-readiness`).

## May change

Set/repair titles, descriptions, canonicals (only once the production origin is known: DECLARED or asked), robots.txt, sitemap.xml or its generator (`next-sitemap`, `app/sitemap.ts`, `@astrojs/sitemap`), `noindex` on genuinely private routes, removal of private routes from the sitemap, redirects for duplicate URL forms. Preserve intentional owner copy; improve only starter, missing, duplicate, or placeholder values.

## Must not claim

"SEO-optimized", "will be indexed", "will rank", "Google-friendly" or a numeric score. Do not claim a sitemap is correct because it exists; correctness is the agreement list above.

## Verify

Re-run `inspect-metadata` and `check-links`. Pass = no HIGH; every sitemap URL is public, canonical, 200, not noindex, not blocked; every canonical target resolves and is on the production host; no localhost/staging strings remain; robots and sitemap agree. Then spot-check one page in the rendered DOM.

## Escalate

Unknown production origin (ask before writing absolute URLs); a private route that is *reachable* (hand to `web-security`); site migrations with redirects; sites with several domains or heavy JS rendering where search visibility matters (deep technical SEO is beyond this pass).

## No change is valid when

The site is intentionally private and consistently noindex; a one-page site has no sitemap by design; an apparent finding is explained by context (`noindex` on `/dashboard`). Do not generate a sitemap or rewrite good copy to hit a length target.
