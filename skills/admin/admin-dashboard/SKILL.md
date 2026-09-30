---
name: admin-dashboard
description: "Use when someone asks for an admin dashboard, back office, or operator panel, or when a launched product needs operators to manage users, content, payments, subscriptions, support messages, privacy requests, or moderation. It reads the actual application, works out what this product's operators need, and builds a complete admin tailored to that product and to the project's existing design system, with server-side authorization and only real data. Do not use it to paste in a generic admin template, to show invented revenue, charts, growth, or users, or to impose a new visual style."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "24,37"
  compliance-domains: "6,10"
  helpers: "inventory-data-model"
  references: "companion-methods"
---

# admin-dashboard

Build a **complete admin UI for this specific website**: its own information architecture, vocabulary, and screens, in its own design. The admin for a newsletter, a marketplace, a course platform, and a portfolio should look and work differently, because their operators do different things. Everything shown comes from the application's real models and operations. If one exists already, improve it; if none does, build it.

## Activate when

- The user asks for an admin dashboard, admin panel, back office, CMS-style management, or "a way for me to manage this".
- The product has data or workflows nobody can operate: submissions, users and roles, content or listings, orders and subscriptions, support requests, reported content, privacy requests, email suppression.
- An admin exists and needs improving, or a launch review (`launch-all`, `production-all`) found an operator task with no screen.
- Not for a site with nothing to operate and no request for one.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `admin-audit-log`, `admin-authorization`, `data-rights`, `design-system-reconnaissance`, `failure-resilience`, `forms-readiness`, `launch-all`, `mobile-readiness`, `production-all`, `wcag-readiness`.

## Inspect

**1. Is there an admin already?** Search for `/admin`, `/dashboard`, `/manage`, role checks, admin API routes (`inventory-data-model` lists them). If yes, read it, list what it covers and misses, and improve it in place. If the project already uses an admin framework (react-admin, Refine, AdminJS, Payload, Strapi), extend it instead of building a parallel one.

**2. Inventory the application.** Run the helper (path relative to this skill's folder):

```bash
node scripts/inventory-data-model.mjs --root .
```

It lists entities and columns from Prisma, SQL migrations, Drizzle, and Mongoose, flags personal-data, secret-like, soft-delete, role, and owner columns, and reports the stack (auth, database, payments, email), the UI kit and table library, and existing admin routes. It shows what is *defined*, not what is populated, and names stores it cannot read (Firestore, TypeORM, Sequelize): read those from code. Then read the app itself: auth and how roles work, the routes and features, forms and submissions, payments and subscriptions, user content and reports, email, and privacy flows (`data-rights`).

**3. Write the admin brief.** Follow section 0 of [references/admin-blueprint.md](references/admin-blueprint.md). Decide, from *this* product: who the operators are and their five most frequent tasks; the product's own vocabulary; the navigation order and grouping; the landing view; the navigation idiom, density, and personality copied from the existing site; where to invest real workflow depth and where a simple list is enough; the right view for each entity (table, calendar, board, media grid). Ask the owner only about facts the code cannot tell you.

**4. Inspect the design system before writing UI.** Run `design-system-reconnaissance`: tokens, components, layout shell, table/form/dialog patterns, navigation, motion, voice. Build every screen from them. Never introduce a new UI kit or a ReadyVibe look.

**5. Review what the admin will touch:** sensitive fields to minimize or mask, destructive actions and the audit trail they need (`admin-audit-log`), and how deletion really works (`data-rights`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Entities, fields, roles, and operations come from the schema and code (SOURCE-INDICATED) and, for behavior, from exercising them on a local or staging database (OBSERVED).
- What operators need is partly DECLARED by the owner. Read the code first, then ask about the rest.
- Every number on screen comes from a real query. No data source, no figure.
- A schema defined only in a hosted dashboard, or a store the helper cannot read, is UNKNOWN until read from code.

## May change

Build or improve the admin using the project's stack and existing design system, shaped by the brief:

- **A full admin**, not a stub: an app shell and navigation in the site's own idiom, a landing view of real "what needs me?" items, and a management area for every entity operators handle, with search, filters, sort, pagination, detail and edit screens, validation, empty/loading/error/success states, and confirmation for destructive actions. Add workflows where the product needs them: review queues, approvals, status changes, bulk actions with counts. The module catalog in the blueprint is a menu: rename, merge, split, and reorder to fit the product.
- **Access:** every admin page, API route, and server action authenticates and authorizes **on the server** (`admin-authorization`); nothing is linked from public navigation; `noindex`, not in the sitemap. First-admin bootstrap through a one-time, documented mechanism (an allow-listed email in server environment, or a seed command that prompts for a password); never default credentials. A new role column or table is a migration: propose it and get the owner's go-ahead before applying it to anything but a local database. Secrets and elevated credentials never reach the browser.
- **Actions:** only operations the app genuinely supports, executed server-side, each recorded through `admin-audit-log` (actor, action, target, time, no secrets). Refunds and other money movement go through the payment provider's server API with confirmation, or link out to the provider.
- **Data honesty:** counts and recent activity from real queries. A chart appears only when a real time series exists and the owner wants it, labeled with its source and range. Never invent revenue, MRR, conversion, growth, active users, or trends, and never seed fake customers or metrics into anything shipped. Create test users and records in a local database to verify.
- **Quality:** accessible (semantic tables, keyboard, visible focus, announced errors; `wcag-readiness`), responsive at laptop and tablet widths (`mobile-readiness`), forms done properly (`forms-readiness`), failure states handled (`failure-resilience`).

## Must not claim

"Admin dashboard complete", "secure", or "operators can manage everything". Describe exactly which tasks it supports and what remains out of scope. Never present placeholder or invented figures as live.

## Verify

- As an **admin test user**, complete each module's main task end to end on a local or staging build (read a submission, approve a listing, suspend a user, handle a privacy request, remove reported content).
- As **anonymous** and as a **normal user**, request every admin route and API directly; confirm denial with no data in the response (`admin-authorization` matrix).
- Confirm each destructive action wrote an audit entry without secrets, and that deletions really remove or anonymize data.
- Confirm every number traces to a query, and empty states appear with no data.
- **Design match:** compare with an existing page at laptop and tablet widths: same fonts, colors, components, spacing, and voice.
- **Distinctiveness:** the navigation, labels, landing view, and entity views should be recognizably this product's. If the admin would be interchangeable with another product's, redo the brief.
- Keyboard-only pass through one list, one edit form, and one dialog.
- Anything you could not run is UNVERIFIED, with what would settle it.

## Escalate

- Sensitive or regulated data in the admin (health, financial, children's data), impersonation ("log in as user"), or bulk export: REVIEW REQUIRED; recommend an independent security review before launch.
- Money movement: provider server API with the owner's confirmation and an audit trail, or link out.
- Any privileged route reachable by an unauthorized principal is HIGH: fix it first.
- Procedures and deadlines for privacy requests come from `data-rights`, which looks them up; never invent them.

## No change is valid when

The user did not ask for an admin and existing tools (provider dashboards, the database console) already cover every operator task. Then report the runbook step for each task instead of building screens nobody needs.
