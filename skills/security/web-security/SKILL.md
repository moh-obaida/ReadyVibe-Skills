---
name: web-security
description: "Use when preparing a public launch of a site or app that has client and server code, environment variables, accounts, or APIs, to find launch-blocking security mistakes: exposed secrets and client-side env misuse, missing authorization on routes and APIs, publicly reachable private routes, debug endpoints, unsafe redirects and rendering, and insecure session handling. It reports evidence and fixes clear low-risk issues. Do not use it as a penetration test, to claim a site is secure, to use or rotate credentials, or to treat a hidden admin link as authorization."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "38,16"
  compliance-domains: "10"
  helpers: "scan-secrets,audit-assets"
  companions: "admin-authorization"
---

# web-security

A pre-launch security review looks for the mistakes that AI-generated and rushed code make most: keys in the browser, API routes with no auth, "hidden" admin pages, and permissive CORS. This is a baseline, not an audit.

## Activate when

- Any deployment is planned, code has server routes or a database, or users can sign in.
- `production-all` routes here (check 38), or a secret or debug artifact was reported.
- Not a substitute for a professional penetration test or a dependency audit (`dependency-security`).

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `admin-authorization`.

## Inspect

**1. Secrets and env.** Run `node scripts/scan-secrets.mjs --root .` (paths relative to this skill's folder). It reports secret-shaped values (redacted), client-prefixed env variables with secret-like names (`NEXT_PUBLIC_*SECRET*`, `VITE_*KEY` for private keys), tracked `.env` files, and source maps and localhost in shipped output. Then reason: which findings are truly private (a Stripe secret key, a Supabase `service_role`, a database URL, a webhook secret, an AI provider key) versus public identifiers by design (publishable keys, anon keys, analytics IDs)? For each real one: where is it used, was it committed, is it in git history? (`git log -S` only for the *fact*, never print the value.)

**2. Authorization and exposure (source, then runtime on staging).** For every route, server action, and API handler: is authentication required where data is private; is authorization checked **on the server** per resource (object-level: can user A fetch user B's record by changing an ID?); admin routes guarded server-side (`admin-authorization`); client-side route guards alone are not security. Database access: row-level security enabled and policies present (Supabase/Firebase rules), not `allow read, write: if true`. Check that "private" pages are not publicly reachable: request them unauthenticated, and check that robots/sitemap do not advertise them (`seo-readiness`).

**3. Debug and dev leftovers.** Debug/test/seed/reset routes, GraphQL introspection/playground open, verbose error responses with stack traces, `console.log` of tokens or user objects, permissive CORS (`*` with credentials), source maps in production, test accounts/default passwords, `NODE_ENV`-dependent code that fails open, feature flags exposing admin tools (`deployment-cleanup` shares this).

**4. Input and output handling.** Unsafe HTML rendering (`dangerouslySetInnerHTML`, `innerHTML`, markdown without sanitization); SQL/NoSQL query construction with user input; open redirects (`?next=` unvalidated); SSRF in fetch-by-URL features; file upload validation (`user-content-safety`); CSRF on cookie-authenticated state-changing routes.

**5. Sessions and auth.** Cookie flags (`HttpOnly`, `Secure`, `SameSite`), token storage in `localStorage`, session expiry and logout invalidation, password reset flow (tokens single-use, expiring; no user enumeration), brute-force protection on login, secrets in JWTs, "remember me" sanity, rate limits on sensitive endpoints, email verification where relied on.

**6. Transport and headers.** HTTPS everywhere and HSTS on production; headers and CSP (`security-headers`); mixed content (`observe-runtime` reports `MIXED_CONTENT`).

**7. Unsafe external resources and supply chain.** `node scripts/audit-assets.mjs --url <site> --render` reports `INSECURE_SUBRESOURCE` (scripts, frames, or images over `http://`), `CDN_SCRIPT_NO_INTEGRITY`, and `CDN_SCRIPT_UNPINNED` (a `@latest` script means what you tested is not what visitors run). Also review third parties that can inject code (tag managers, chat, A/B tools) (`third-party-privacy`, `dependency-security`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A secret-shaped string is SOURCE-INDICATED until you know it is a real, live credential (OBSERVED in shipped output means visitors can read it; it does not prove it is valid).
- Missing authorization is SOURCE-INDICATED from code; **OBSERVED** only after requesting as the wrong user on a staging build. Never test against production data or other people's accounts.
- Header, cookie, and TLS behavior of production is UNKNOWN until the deployed site is inspected.

## May change

Move secrets to server-side env and remove client prefixes; add server-side auth/authorization checks on routes that clearly lack them (following the project's pattern); remove debug routes and source maps from production builds; tighten CORS; add `HttpOnly`/`Secure`/`SameSite` cookie options; sanitize rendering; validate redirect targets; add `.env*` to `.gitignore`; provide an `.env.example` with placeholder values. **Never use, print, rotate, or revoke a credential; never delete history; never run exploits against production or third parties.** If a live credential was exposed, tell the owner to rotate it.

## Must not claim

"Secure", "hardened", "no vulnerabilities", "penetration tested", "OWASP compliant", or "safe from X". Say what was checked and the depth.

## Verify

Rebuild and re-run `scan-secrets` on the new output; on staging, re-request protected resources as unauthenticated and as another user and confirm denial; confirm removed debug routes 404; confirm cookie flags and CORS in responses; retest the flow you changed.

## Escalate

**An exposed live credential is HIGH and urgent**: owner rotates it; removing it from code is not enough, and history may retain it. Publicly reachable personal data, missing authorization on account/payment/admin routes, signs of compromise, or any regulated data: stop and report at once. Recommend a professional security review before launching anything handling money, health, or sensitive data.

## No change is valid when

The scan is clean, private routes demonstrably require server-side authorization, and no debug artifacts ship. Say what you covered and what remains untested; do not add "security" code for its own sake.
