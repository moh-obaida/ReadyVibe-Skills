---
name: data-flow-mapping
description: "Use when you need a factual map of what personal data a site collects and where it goes: form fields, account data, database columns, API routes, cookies and identifiers, and every recipient from vendors to email and analytics. It is the input for privacy notices, deletion flows, and vendor reviews. Do not use it to decide a legal basis, to write the notice, or to guess flows you cannot find in code or traffic."
license: Apache-2.0
metadata:
  kind: foundation
  launch-checks: "1,7"
  compliance-domains: "2,9"
  helpers: "inventory-data-model"
---

# data-flow-mapping

Every privacy statement, deletion promise, and vendor list rests on one question: **what data enters, where does it go, and where is it stored?** This skill answers it from code and traffic.

## Activate when

- Before drafting or checking a privacy notice, a deletion/export flow, or a vendor list.
- The product has forms, accounts, checkout, uploads, or server routes that receive user data.
- Not to assign legal bases or conclude what is lawful.

## Inspect

1. **Entry points.** Every `<form>`, input, upload, OAuth/signup flow, API/server action, webhook, and analytics/identify call. For each: which fields (email, name, phone, address, DOB, payment, free text, files, location, IDs, IP).
2. **Storage.** Start with `node scripts/inventory-data-model.mjs --root .` (path relative to this skill's folder). It lists entities and columns from Prisma, SQL migrations, Drizzle, and Mongoose, and flags personal-data-like, secret-like, soft-delete, and owner columns; it shows what is *defined*, not populated, and names stores it cannot read (read those from code). Then read the database schema/migrations/ORM models, key-value stores, object storage buckets, logs, third-party CRMs. Identify tables/columns that hold personal data, and soft-delete flags, retention or cleanup code, backups you can see referenced.
3. **Flows out.** Server-side calls to email, payment, CRM, support, AI, analytics, storage APIs; client-side third-party requests (with `cookie-and-storage-audit`). Record what fields go to which recipient.
4. **Identifiers.** User IDs in URLs, cookies, localStorage, analytics distinct IDs; whether they are linkable to a person.
5. **Sensitive signals.** Health, finance, biometrics, precise location, children, government IDs, credentials, free-text fields that may contain any of these. Flag for `regulated-domain-triggers`.
6. **Verify a sample at runtime** on a local/staging build: submit a form with `observe-runtime --canary` and see which hosts receive the planted values.

Deliver a compact table: **field → collected where → stored where → sent to whom → deletable how (or "unknown")**, each row with an evidence label.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Code that sends a field to a vendor is SOURCE-INDICATED; a captured request is OBSERVED.
- A database column is SOURCE-INDICATED storage; it does not prove the field is populated.
- Third-party SaaS internals (what the vendor does after receipt) are UNKNOWN.

## May change

Only a map file (`.readyvibe/data-map.md`). It does not change the product. If you find unintended collection (an unused field storing PII, PII in URLs, PII in logs), report it and fix only when trivial and clearly unintended.

## Must not claim

That the map is complete. Say what you covered: files searched, routes exercised, backends not inspectable. Never claim "no personal data is collected" without checking forms, cookies, analytics, and server logs' visible configuration.

## Verify

Pick three fields at random and trace end to end (form → storage → recipient); the map should predict what you observe. Check every form in the crawl is in the map (`audit-markup` lists forms if useful).

## Escalate

Sensitive or regulated data; PII in URLs or client-side storage; a recipient nobody can identify; data flowing to a vendor with no disclosure.

## No change is valid when

The product genuinely has no forms, accounts, or data-receiving routes and no third-party requests: record "no personal-data flows found in: <places searched>".
