---
name: link-integrity
description: "Use when links, buttons, and route targets across a site must actually resolve: navigation, footer, CTAs, content links, canonical and sitemap targets, mailto and tel links, form actions, and external references. It separates confirmed broken routes from transient network failures and repairs internal links safely. Do not use it to declare an external site broken from a single timeout, to crawl a site you do not have permission to test, or to replace browser testing of client-side interactions."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "22,23,17"
  helpers: "check-links"
  references: "companion-methods"
---

# link-integrity

Broken links in the nav or footer are the fastest way to look abandoned. But a flaky external server is not a broken link, and `#` is not a destination. This skill makes those distinctions with evidence.

## Activate when

- Before launch, after a routing/rename/migration, or when links look wrong.
- `launch-all`/`trust-all`/`discoverability-all` route here for checks 22, 23 (dead hrefs), or 17 (dev/staging hosts in links).
- Not for behaviors that need JavaScript interaction only (clicking a menu); check those in a browser.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `discoverability-all`, `error-pages`, `launch-all`, `legal-navigation`, `privacy-policy`, `production-all`, `terms-of-service`, `trust-all`.

## Inspect

Run the checker (paths relative to this skill's folder). Serve a local build if none is running; add `--render` for client-rendered apps, and `--external` to also check outbound links:

```bash
node scripts/check-links.mjs --url http://localhost:3000 --render
node scripts/check-links.mjs --url https://staging.example --external
node scripts/check-links.mjs --dir ./dist          # static only; client-routed links are reported UNVERIFIED
```

What it checks and how to read it:

| Finding | Meaning | Confidence |
|---|---|---|
| `LINK_BROKEN` (nav/footer/CTA = HIGH) | internal route returns 404/410 after a retry | confirmed |
| `LINK_SOFT_404` | returns 200 but the page says not found | confirmed behavior; fix status too (`error-pages`) |
| `LINK_UNVERIFIED` | timeout, DNS, 5xx, 401/403/429/999 from the target | **unknown; not evidence of breakage**; retry later or verify by hand |
| `LINK_DEAD_HREF` | `#`, empty, `javascript:` | source-indicated: a script may handle it; verify in browser |
| `LINK_FRAGMENT_MISSING` | `#section` has no matching id | observed on that page |
| `LINK_PLACEHOLDER_TARGET` | `example.com`, placeholder mailto/tel/form action | observed |
| `LINK_DEV_HOST` | localhost/staging host in a link or form action | observed (HIGH) |
| `SITEMAP_URL_BROKEN`, `CANONICAL_TARGET_BROKEN` | sitemap/canonical targets do not resolve | observed |
| `LINK_REDIRECT_CHAIN` / `LINK_INSECURE_SCHEME` | > 2 redirects; `http://` external | observed, low |

Then think beyond the tool: important **external** links (docs, social profiles, app-store, payment, calendar) by hand; **email links** (templates) for localhost/staging hosts; buttons implemented as `<button onClick>` that navigate (the checker cannot see them; read the code); dynamic routes and locale prefixes; links that need auth (401/403 is protected, not broken).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Confirmed broken requires an HTTP 404/410 (or a static build lacking the file with no SPA fallback) after retry. Timeouts, TLS errors, bot-blocking codes, and 5xx are UNKNOWN.
- Static-directory mode cannot see client-side routing: those links stay UNKNOWN. Serve the build and use `--url --render`.
- Coverage is limited to crawled pages (`--max-pages`): state how many.

## May change

Fix internal links to the correct existing route; add a redirect when a route moved; restore a deleted page **only if** it should exist; replace placeholder targets with owner-supplied ones; remove links that lead nowhere with no intended destination (and say so); correct localhost/staging hosts to the confirmed production origin; add `rel="noopener noreferrer"` to external `target="_blank"` links. Do not guess a target for a dead CTA: ask the owner what it should do.

## Must not claim

"No broken links" (say "0 confirmed broken among N pages crawled, M links unverified"). Do not report unreachable external sites as broken from one failure.

## Verify

Re-run the same command. Pass = zero `LINK_BROKEN`, zero `LINK_DEV_HOST`, zero placeholder targets, dead hrefs either fixed or explained, sitemap/canonical targets resolve. Retry `LINK_UNVERIFIED` items once later; leave them labeled if still unknown.

## Escalate

Links to legal pages that do not exist (`legal-navigation`, `privacy-policy`, `terms-of-service`); payment/auth flows behind broken links (HIGH, `production-all`); large-scale route changes needing a redirect map.

## No change is valid when

All internal targets resolve and any unverified ones are explained. Do not remove working external links because a single check timed out.
