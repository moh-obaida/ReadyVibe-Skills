---
name: security-headers
description: "Use when a site is deployed or about to be, and you need to inspect HTTPS, redirects, HSTS, and response security headers, and to propose a Content-Security-Policy based on the origins the site actually loads. It reads live headers and the observed vendor list, then drafts a policy in report-only form first. Do not use it to paste a generic script-src 'self' policy, to break third-party functionality, or to judge production headers from a local dev server."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "39"
  compliance-domains: "10"
  helpers: "observe-runtime"
---

# security-headers

Headers are set by the *deployment*, not by the code alone: the platform, CDN, and reverse proxy all matter. So this skill starts by asking whether it is looking at production.

## Activate when

- A deployed URL (production or a production-like preview) exists, or the owner is about to configure hosting.
- `production-all` routes here (check 39).
- Not on a local dev server as a verdict (it is UNKNOWN), and not as a replacement for a security review.

## Inspect

1. **Where are you looking?** Local dev, preview, or production. Headers on `localhost` say almost nothing about a Vercel/Netlify/Cloudflare deployment.
2. **Fetch headers**: `curl -sI -L https://<site>/` and a few key pages, an API route, and a static asset. Note the redirect chain (`http://` → `https://`, apex ↔ `www`), status, and each hop's headers. TLS certificate validity and expiry (`curl -vI` output or `openssl s_client`), HTTP→HTTPS redirect, mixed content (`observe-runtime` reports `MIXED_CONTENT`).
3. **Evaluate each header for *this* site:**

   | Header | Good baseline | Notes |
   |---|---|---|
   | `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (add `preload` only when committed) | only once HTTPS is solid; on the production host |
   | `Content-Security-Policy` | tailored; starts in `Content-Security-Policy-Report-Only` | see below |
   | `X-Content-Type-Options` | `nosniff` | |
   | `Referrer-Policy` | `strict-origin-when-cross-origin` or stricter | consider what URLs may leak |
   | `Permissions-Policy` | disable unused features (camera, microphone, geolocation, payment) | |
   | Framing | `frame-ancestors` in CSP (or `X-Frame-Options: DENY/SAMEORIGIN`) | unless embedding is intended |
   | `Cross-Origin-*` (COOP/COEP/CORP) | only where needed | can break embeds; do not add blindly |
   | Cookies | `Secure`, `HttpOnly`, `SameSite` | `web-security` |
   | Info leaks | remove `X-Powered-By`, verbose `Server` versions | low priority |
   | Caching | private pages `Cache-Control: private/no-store` | authenticated pages must not be publicly cacheable |

4. **CSP from evidence, not from a template.** Get the real origins from `observe-runtime` (vendors and third-party hosts per page, with `--steps` covering key flows: login, checkout, embeds, consent) and source (inline scripts, `eval`, web workers, WebSockets, frames, fonts, images, forms, service workers). Build directives: `default-src 'self'`; `script-src` with nonces/hashes for inline scripts (avoid `'unsafe-inline'` and `'unsafe-eval'` where the framework supports it; Next.js supports nonces; some analytics/tag managers require allowances); `connect-src` for APIs/analytics/websockets; `img-src`, `font-src`, `style-src`, `frame-src`, `form-action`, `base-uri 'self'`, `object-src 'none'`, `frame-ancestors`. Ship as **Report-Only** first, collect violations against real usage (`report-to`/`report-uri`), and tighten. Flag anything that forces `'unsafe-inline'`/`'unsafe-eval'` and why.
5. **Mismatch between consent and CSP:** a CSP that allows vendors the consent design says are gated is fine; one that blocks a needed vendor breaks the site: test both states.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Headers from the deployed URL: OBSERVED. Headers configured in `next.config.js`/`vercel.json`/`_headers`: SOURCE-INDICATED (platform may override).
- A CSP is verified only by running the real flows under it and seeing no violations, not by reading it.
- "No CSP" is a finding on a deployed site handling accounts or data, but low-risk marketing sites may reasonably start with a Report-Only policy.

## May change

Add headers via the project's mechanism (`next.config.js` `headers()`, `vercel.json`, `netlify.toml`/`_headers`, server middleware, Cloudflare rules); add HSTS after confirming HTTPS works on the production host; start CSP as Report-Only with the observed origin list; remove leaky headers. Do not enforce a CSP that has not been run against real flows; do not add `preload`; do not disable a working third-party integration to make a policy stricter.

## Must not claim

"Secure headers", "A+ on securityheaders.com", "protected against XSS/clickjacking", or that a policy is enforced when it is Report-Only.

## Verify

Fetch headers again on the deployed URL after each change; run the key user flows under the policy in a browser with the console open (no CSP violations); confirm no third-party feature broke (embeds, payments, consent, analytics as designed); confirm redirect chain and HSTS.

## Escalate

A CSP needing `unsafe-inline`/`unsafe-eval` for critical scripts (owner and security review); payment or auth pages where a bad CSP would block checkout; multi-subdomain HSTS/preload decisions; anything requiring platform-level access you do not have.

## No change is valid when

Only a local build exists (mark UNKNOWN and prepare the config), or deployed headers already match the site's needs. Do not add a strict CSP to a site you cannot test.
