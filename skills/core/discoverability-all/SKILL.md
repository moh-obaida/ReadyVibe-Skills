---
name: discoverability-all
description: "Use when a public site should be found and shared correctly, or when titles, descriptions, canonicals, robots.txt, sitemap.xml, social previews, favicon, and indexing directives need one coordinated review. It runs one shared sweep, then routes only to the specialists whose findings need work. Do not use it as a ranking promise, for a private or intentionally unindexed product beyond confirming it is consistently noindex, or for a single-file fix a specialist already owns."
license: Apache-2.0
metadata:
  kind: bundle
  launch-checks: "9-18"
  helpers: "inspect-metadata,check-links"
  references: "companion-methods"
---

# discoverability-all

Owns launch family B (checks 9–18): titles, descriptions, canonicals, robots.txt, sitemap.xml, social metadata, favicon/icons, indexing sanity, staging/localhost references, and public URL consistency.

The signals in this family **contradict each other far more often than they are missing**: a localhost canonical on a page the sitemap advertises, a `noindex` page listed in the sitemap, robots blocking what the sitemap lists, a staging host in an Open Graph URL. Existence checks miss all of that. This skill reviews the relationships once, then hands specialists a shared picture so none of them re-crawls the site.

## Activate when

- The site is public and should be discoverable or shareable, or a launch/rebrand/domain move is near.
- `launch-all` routes here.
- Not when the product is private or intentionally unindexed. In that case confirm it is *consistently* noindex (meta or header, no sitemap, robots not advertising private paths) and stop.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `deployment-cleanup`, `launch-all`, `launch-identity`, `link-integrity`, `multilingual-readiness`, `search-console-readiness`, `seo-readiness`, `social-sharing`, `structured-data`, `web-security`.

## Route

1. **Intent and host.** Establish: should this be indexed? What is the production origin (scheme + host, `www` or not)? Which routes are public, which are private (account, dashboard, admin, checkout, preview)? Read `.readyvibe/context.md`, deployment config, and env templates. If the production URL is unknown, ask once; otherwise use the declared one.
2. **Shared sweep.** Run once and reuse the output (paths are relative to this skill's folder; add `--render` for client-rendered apps):

   ```bash
   node scripts/inspect-metadata.mjs --url <site> --render --private-path /dashboard
   node scripts/check-links.mjs      --url <site> --render
   ```

   Serve a build locally if needed. Without a server, use `--dir <build output>` and mark server-dependent items UNKNOWN.
3. **Select specialists** from the findings, not the table:

| Findings show | Specialist |
|---|---|
| titles, descriptions, canonicals, robots, sitemap, noindex, URL agreement (9–13, 16, 18) | `seo-readiness` |
| missing/incorrect Open Graph or Twitter tags, share image (14) | `social-sharing` |
| starter favicon, missing icons, product-name mismatch in titles (15) | `launch-identity` |
| localhost/staging/preview hosts anywhere shipped (17) | `deployment-cleanup` |
| the owner wants Search Console/Bing verification steps | `search-console-readiness` |
| a real article, product, organization, or FAQ page and JSON-LD exists or would help | `structured-data` |
| more than one language | `multilingual-readiness` (hreflang, per-language canonicals) |
| broken sitemap or canonical targets | `link-integrity` |

Skip `structured-data` and `search-console-readiness` unless there is a concrete reason. Do not add JSON-LD to a page whose content is not what the schema claims.

## Evidence discipline

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A sitemap that exists is not a sitemap that is safe and correct. Correctness means: canonical, public, live, non-redirecting, not blocked, not noindex.
- Source with a canonical tag is not proof of the *rendered* canonical (a framework may override it). Read rendered HTML.
- Indexing intent is a fact about the owner's plan: DECLARED or asked, never guessed from the framework.
- Never claim a page "will be indexed" or "will rank". Indexing needs search-engine data.

## May change

Metadata tags and site config that generate them, `robots.txt`, `sitemap.xml` (or its generator), favicon/icon files and links, canonical values (only once the production origin is known). Specialists define their own limits.

## Must not claim

"SEO-optimized", "will rank", "will be indexed", "Google-approved", or a score. Report agreements and contradictions found, and fixes verified.

## Verify

Re-run the sweep after changes. Success means the *relationships* hold: every sitemap URL is canonical, public, returns 200, is not noindex and not blocked; every canonical target resolves; the production host is the same everywhere; no localhost/staging strings remain. For a deployed site, spot-check the live URL, not just local output.

## Escalate

- Production origin unknown or about to change: ask before writing any absolute URL.
- A private route that is *reachable* (not just listed) is a security finding: hand to `web-security`.
- Multi-domain, multi-language, or migration setups with redirects: REVIEW REQUIRED for the redirect map.

## No change is valid when

The site is intentionally private and consistently noindex; or a single-page site legitimately has no sitemap; or the findings are explained by context (a `noindex` on `/dashboard` is correct). Do not add a sitemap or structured data just to satisfy a checklist.
