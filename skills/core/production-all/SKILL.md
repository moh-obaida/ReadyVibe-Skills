---
name: production-all
description: "Use when a site is about to go live and its forms, email unsubscribe, secrets, staging leftovers, security headers, or performance have not been verified. It runs one shared production sweep and routes to the forms, email, security, and performance specialists. Do not use it for penetration testing, load testing, or certifying security, and do not use it to send real email or submit real forms on a live site."
license: Apache-2.0
metadata:
  kind: bundle
  launch-checks: "35-40"
  helpers: "scan-secrets,audit-assets,check-links,observe-runtime"
  references: "companion-methods"
---

# production-all

Owns launch family E (checks 35–40): forms that submit, unsubscribe that works and suppresses, exposed secrets and staging artifacts, transport and headers, and performance. This is "will it actually work and stay safe in production."

## Activate when

- A launch, deploy, or domain cutover is near, or the user mentions forms, newsletters, env vars, secrets, headers, or speed.
- `launch-all` routes here.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `admin-audit-log`, `admin-authorization`, `admin-dashboard`, `dependency-security`, `deployment-cleanup`, `email-compliance`, `forms-readiness`, `launch-all`, `performance-readiness`, `security-headers`, `web-security`.

## Route

1. **Sweep once** (paths relative to this skill's folder):

   ```bash
   node scripts/scan-secrets.mjs --root .
   node scripts/audit-assets.mjs --url <site> --render
   node scripts/check-links.mjs  --url <site> --render
   node scripts/observe-runtime.mjs --url <site> --block-third-party
   ```
2. **Inventory the surfaces**: forms and their endpoints; email senders and templates; environment variables and where they are read; deployment config and headers; build output.
3. **Select specialists**:

| Concern | Specialist |
|---|---|
| forms exist and must submit and handle outcomes (35, 30) | `forms-readiness` |
| marketing email exists (36, 37) | `email-compliance` (skip if there is none; say why) |
| secrets, client env mistakes, debug routes, auth clues (38) | `web-security` |
| localhost/staging/dev artifacts, source maps, test data in production (17, 38) | `deployment-cleanup` |
| headers, CSP, HTTPS (39) | `security-headers` |
| vulnerable or abandoned dependencies | `dependency-security` |
| oversized assets, blocking resources, font/image waste (40) | `performance-readiness` |
| admin/operator routes exist | `admin-authorization`, `admin-audit-log` |
| operators need a screen to run launch-critical tasks | `admin-dashboard` |

## Evidence discipline

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Local headers are not production headers; a local build says nothing about the CDN or platform config. Mark UNKNOWN until the deployed URL is inspected.
- A form with an action is not a form that delivers. A send route is not a sent email. An unsubscribe link is not suppression.
- A secret-shaped string is SOURCE-INDICATED until you know whether it is a real, live credential or a public identifier.

## May change

Form handling wiring, labels, error/success states; env variable references (move secrets server-side); header/CSP configuration; removal of debug routes and source maps from production builds; asset optimization; unsubscribe route wiring. Never rotate, revoke, or use a credential; report it for the owner.

## Must not claim

"Secure", "hardened", "PCI/SOC/ISO compliant", "penetration-tested", "fast", or "will handle N users". Report findings verified and areas not reached.

## Verify

Exercise forms end to end against a local/staging backend with planted test data (`observe-runtime --canary`). Never submit forms or send email on a live production origin without the owner's explicit authorization. Re-run `scan-secrets` after fixes. Re-run `audit-assets` and confirm sizes moved. Re-check headers on the deployed URL when available.

## Escalate

- **An exposed credential is HIGH and urgent.** Removing it from code does not un-expose it; it must be rotated by the owner, and git history may retain it.
- Forms that collect sensitive or regulated data, payment flows, and auth flows you cannot exercise safely: report UNVERIFIED and state what is needed.
- Anything suggesting active compromise: stop and tell the owner.

## No change is valid when

The site has no forms, no email, no server code, and a clean scan. Then say so; do not add a contact form or a CSP header just to have something to show.
