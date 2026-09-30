---
name: production-readiness
description: "Use when a site must be cleaned of development, staging, and test artifacts before going live: localhost and staging URLs, preview hostnames, test data and accounts, debug routes, source maps, console noise, placeholder environment values, and mismatches between build modes. It finds them in source, config, and shipped output and repairs the safe ones. Do not use it for penetration testing, for deployment itself, or to modify production infrastructure or environment values."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "17,38"
  compliance-domains: "10"
  helpers: "scan-secrets,inspect-metadata,check-links"
---

# production-readiness

The site works, but it still thinks it is running on someone's laptop: canonical to `localhost:5173`, sitemap on `staging.`, `NEXT_PUBLIC_API_URL=http://localhost:3001`, a test-mode payment key, a `/debug` route. This skill hunts those leftovers.

## Activate when

- Before any launch, domain cutover, or move from preview to production.
- `discoverability-all`/`production-all` route here (checks 17, 38).
- Not to deploy, change DNS, or edit production secrets.

## Inspect

1. **Shipped-output sweep** (run against a production build, not dev):

   ```bash
   node scripts/scan-secrets.mjs --root .            # DEV_URL_IN_SHIPPED_OUTPUT, SOURCEMAP_EXPOSED, DEBUG_ROUTE_PRESENT, secrets
   node scripts/inspect-metadata.mjs --url <site> --render     # localhost/staging in canonical, OG, sitemap, robots, JSON-LD
   node scripts/check-links.mjs --url <site> --render          # LINK_DEV_HOST, placeholder targets, form actions
   ```
   Paths are relative to this skill's folder.
2. **Search config and source** for: `localhost`, `127.0.0.1`, `0.0.0.0`, `.local`, `staging`, `preview`, `.vercel.app`/`.netlify.app` (ok only if intended), `ngrok`, `example.com`, `TODO`/`FIXME`/`XXX` in user-visible strings, `console.log`/`debugger` with sensitive data, `if (process.env.NODE_ENV !== "production")` guards that fail open, feature flags defaulting to "on" for admin/debug, `NEXT_PUBLIC_*`/`VITE_*` URLs pointing at dev services.
3. **Environment parity:** which env vars the code needs (`.env.example`, config reads) vs. which are set in the deployment (owner confirms; you cannot read production values). Missing values silently falling back to dev defaults (`process.env.API_URL ?? "http://localhost:3001"`) are launch bugs.
4. **Test vs live modes:** payment provider keys (`pk_test`/`sk_test` vs live), OAuth redirect URIs, webhook endpoints, email provider sandbox mode, analytics property IDs (dev vs prod), captcha test keys (`1x00000000000000000000AA` style always-pass keys), map/API key restrictions (HTTP-referrer or origin restricted?).
5. **Test data and accounts:** seed users, default admin passwords, demo content, "test" products/orders, fake reviews, sample emails; sitemap/robots/noindex states appropriate for launch (a `noindex` left on production, or removed on a site meant to stay private).
6. **Build hygiene:** production build succeeds without warnings that indicate misconfiguration; source maps excluded or access-restricted; no `dist`/`.next` cache directories committed; drafts and preview routes not shipped; `robots.txt` correct for production.
7. **Ops basics** (ask, do not assume): error monitoring installed and pointing at the right project; analytics environment separation; uptime check; backup for the database; domain/HTTPS/redirect policy set (`security-headers`); rollback path known.
8. **Domain-move checklist** when switching hosts: canonical/sitemap/OG/host absolutes updated; redirects from old hosts; OAuth/webhook URLs updated.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A string in the shipped bundle or served HTML: OBSERVED. A string in source or config: SOURCE-INDICATED (it may not reach production).
- Production environment values are the owner's; ask them to confirm which are set. Do not read secrets from `.env` files.
- A `.vercel.app` or platform hostname may be *the* production host; do not call it a leftover without confirming intent.

## May change

Replace dev/staging URLs with the confirmed production origin (via env-driven config, not hardcoding); remove dev fallbacks that fail open (fail loudly instead); remove or gate debug routes and console noise; exclude source maps from production; delete test data from seeds shipped to production; fix `noindex`/robots for the intended state; add `.env.example` entries; update docs listing required production env vars. Do not change deployment settings, DNS, or environment values on the platform.

## Must not claim

"Production-ready", "clean", or "no dev artifacts" beyond what the sweep covered. Say which builds and paths were scanned.

## Verify

Rebuild and re-run the three commands; grep the rebuilt output for `localhost`/`staging`; confirm debug routes 404 in production mode; confirm behavior with only production env values present (missing var now errors clearly).

## Escalate

Test-mode keys in production or live keys exposed (owner action needed); real user data in test fixtures; anything requiring platform access; missing backups or monitoring for a launch with real users.

## No change is valid when

The sweeps are clean and the owner confirms production env parity. Do not remove intentional staging banners on a staging site.
