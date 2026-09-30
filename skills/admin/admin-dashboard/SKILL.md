---
name: admin-dashboard
description: "Use when a launch requirement can be met in no other way than a small operator screen, for example fulfilling a data-deletion request, processing an unsubscribe suppression, reviewing reported user content, or reading form submissions that would otherwise be lost. It reviews existing admin surfaces for launch safety and, if unavoidable, builds the minimum screen from real models in the project's design system. Do not use it to build a general dashboard, analytics charts, or an admin product, or to invent metrics."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "24,37"
  compliance-domains: "6,10"
---

# admin-dashboard

ReadyVibe is not an admin-platform builder. An admin screen enters a launch review for one reason only: **a launch-critical task has nobody able to operate it.** Otherwise, the right output is "no admin UI needed".

## Activate when

- A launch requirement needs an operator action with no existing interface: reading submitted forms, handling a deletion or export request, reviewing reports of user content, managing unsubscribes, issuing a refund the provider dashboard cannot do.
- An existing admin screen must be reviewed for launch safety (unlabeled destructive buttons, no confirmation, exposed to non-admins).
- Not for KPIs, charts, growth dashboards, CRUD scaffolding for its own sake, or "an admin panel would be nice".

## Inspect

1. **Is there a real gap?** Can the task be done today via the database console, provider dashboard (Stripe, Supabase, email provider), or an existing screen? If yes, document the runbook step and stop; do not build UI.
2. **If a screen exists:** review for launch safety: server-side authorization (`admin-authorization`), destructive actions have confirmation and audit entries (`admin-audit-log`), no secrets or full personal data displayed unnecessarily, works at laptop and tablet widths, keyboard-usable, clear empty/error states (`failure-resilience`), not indexed or linked from public navigation.
3. **If a screen is unavoidable:** define the smallest useful scope from **real models and operations**: list and search records that exist, one detail view, the specific actions required (mark handled, delete, suppress, export), and nothing else. Data comes from actual tables; no mock or invented figures. Reuse the design system (`design-system-reconnaissance`) and existing components; place it under a route protected server-side.
4. **Sensitive data in the UI:** show only what the task needs (mask emails/IDs where possible), no bulk export unless required, and log access if it reveals personal data.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- The launch requirement and the lack of another way to do it must be shown (which check, which task, what was tried); otherwise no build.
- Data models and actions come from code and schema (SOURCE-INDICATED) and from exercising them on test data (OBSERVED).

## May change

Only when justified above: add a minimal authorized operator route with the required actions, wired to the existing models and audit logging; fix safety issues in an existing screen. Nothing else. Never invent metrics, charts, or data; never expose the screen without server-side authorization; never run destructive actions on real data while testing.

## Must not claim

"Admin dashboard complete", "operators can manage everything", or "secure admin". Describe the exact tasks it supports.

## Verify

As an admin test user: complete the required task end to end; as anonymous and normal users: confirm denial (`admin-authorization` matrix); confirm each action writes an audit entry; view at laptop and tablet widths.

## Escalate

Screens exposing sensitive or regulated data; impersonation features; anything a normal launch would handle with a provider dashboard.

## No change is valid when

The launch does not need an operator interface, or the task can be done in an existing tool. Report "no admin UI required; runbook: <step>" and do not build one.
