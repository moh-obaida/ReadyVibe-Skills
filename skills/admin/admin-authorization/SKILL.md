---
name: admin-authorization
description: "Use when a product already has admin, staff, moderator, or operator routes, screens, or APIs, and you need to verify that every privileged operation is protected by server-side authorization, not by a hidden link. It tests privileged routes as anonymous and as a normal user on a local or staging build. Do not use it to build the admin screens themselves, to accept a hidden menu item as authorization, or to test production accounts you do not own."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "10"
  launch-checks: "38,16"
---

# admin-authorization

The most common critical bug in vibe-coded apps: `/admin` is "protected" because the link is hidden, and the API behind it answers anyone. This skill checks the server, where authorization actually lives.

## Activate when

- Any admin/staff/operator route or API exists (`/admin`, `/dashboard/users`, `/api/admin/*`, role fields, "isAdmin" checks), or roles/permissions exist.
- `production-all`/`web-security` routes here.
- Not to design admin features (that is `admin-dashboard`, which calls this skill for access control). If the only "admin" is the database console, say so.

## Inspect

1. **Enumerate privileged surfaces** from routes, API handlers, server actions, database policies, and UI conditionals: user management, content moderation, refunds, exports, impersonation, feature flags, settings, data deletion, "run job" endpoints, internal tools.
2. **For each, find the check:** authentication (who are you?) and authorization (may *you* do *this* on *this* object?) executed **on the server** at the handler, middleware, or database policy. Client-side route guards, hidden links, `if (user.isAdmin)` in React, and obscure URLs are not authorization.
3. **Roles and grants:** where roles come from (database column, JWT claim, provider metadata); can a user modify their own role via any endpoint (mass assignment: `PATCH /api/me` accepting `role`)? First-user-becomes-admin logic; default/seed admins with default passwords; invite/reset flows for staff.
4. **Object-level access:** an admin's or user's request for another resource ID (`/api/orders/123`); listing endpoints returning all users' data to non-admins; database row-level security present for tables holding admin-only or per-user data.
5. **Test on local/staging** (never against production or other people's accounts): request each privileged route/API (a) with no session, (b) with a normal test user, (c) with an admin test user. Expect (a) and (b) denied (401/403, not a 200 with empty data and not a redirect that still leaks data), (c) allowed. Also try direct API calls that bypass the UI, and ID substitution.
6. **Discoverability:** admin routes not in the sitemap or `robots.txt` as a hint (`seo-readiness`); consistent `noindex`; login page protections: rate limiting, no user enumeration, MFA where the product warrants.
7. **Sensitive destructive actions:** confirmation, and an audit trail (`admin-audit-log`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Denied/allowed behavior seen in requests as specific test users: OBSERVED. A check present in source: SOURCE-INDICATED (it may not run on every path).
- A protected route with an unprotected sibling API is still a hole; report both.
- Third-party admin tools (provider dashboards) are outside the codebase: UNKNOWN.

## May change

Add server-side authentication and authorization checks to privileged handlers following the project's pattern (middleware, guards, RLS policies); remove role fields from writable user endpoints; remove default credentials from seeds; return proper 401/403; add a "no admin surface" note when true. Do not build a new admin interface, invent a role model, or change production users.

## Must not claim

"Secure admin area", "role-based access implemented", or "authorized" from UI conditionals. Report which endpoints you tested as which principals.

## Verify

Repeat the anonymous / normal-user / admin request matrix on every changed handler and the sibling API routes; confirm the UI still works for admins; confirm no data returns to non-admins in error bodies.

## Escalate

Any privileged route reachable by unauthorized principals: HIGH, fix or block before launch and tell the owner. Systems handling money, health, or others' personal data: recommend an independent security review. Real user data exposure: stop and report.

## No change is valid when

No privileged surfaces exist, or every one demonstrably enforces server-side authorization. Do not add roles to a product with one user type.
