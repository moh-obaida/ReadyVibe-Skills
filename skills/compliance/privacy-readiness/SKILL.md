---
name: privacy-readiness
description: "Use when a product stores or processes personal data and you need to judge minimization, retention signals, exposure of personal data in URLs, logs, client storage, or public routes, and whether stored data is protected sensibly. It finds unintended exposure and unused collection. Do not use it to certify privacy compliance, to choose retention periods, or to remove data the product needs."
license: Apache-2.0
metadata:
  kind: specialist
  helpers: "observe-runtime"
  launch-checks: "1,7"
  compliance-domains: "2,6"
  references: "official-sources"
  companions: "data-flow-mapping"
---

# privacy-readiness

After you know *what* is collected (`data-flow-mapping`), ask whether the product handles it with restraint: collects no more than it uses, does not leak it, and does not keep it forever by accident.

## Activate when

- Personal data is stored or processed, especially accounts, profiles, uploads, or messages.
- Reviewing before launch, after a data-model change, or before answering data-rights requests.
- Not to define legal retention periods (owner/legal decision).

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `data-flow-mapping`.

## Inspect

1. **Minimization.** For each collected field: is it used anywhere (feature, email, billing)? Fields collected "just in case" (DOB, phone, address, company size on a newsletter form) are candidates for removal or optional status. Are required fields truly required?
2. **Exposure paths.** Personal data in URLs (`?email=`), in client-side storage (localStorage tokens with PII), in public API responses (list endpoints returning other users' emails), in error messages and logs (console/log statements printing user objects), in analytics events, in public storage buckets, in static exports/sitemaps/JSON-LD, in `robots`-hidden but reachable routes.
3. **Access control on the data.** Row-level security or authorization checks on reads/writes of personal data; per-user scoping of queries; admin views (`admin-authorization`).
4. **Retention signals.** Cleanup jobs, TTLs, soft-delete flags never purged, backups, logs. "We keep data for X" claims vs code (`policy-consistency`). If nothing removes data, the honest state is "indefinite by default".
5. **Secrets and tokens** stored in user-visible places (`web-security`).
6. **Runtime spot-check** on staging: create a test account, submit planted data (`node scripts/observe-runtime.mjs --url <staging-url> --canary --steps form.json`, path relative to this skill's folder), and look for it in URLs, third-party requests, and API responses.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A query without a user filter is SOURCE-INDICATED exposure. Prove it by requesting as a different test user before saying data leaks.
- "No retention job found" is SOURCE-INDICATED within the code you can see; managed databases may have policies you cannot see: UNKNOWN.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Clear, low-risk fixes: remove personal data from URLs and logs, drop unused fields from forms *with the owner's confirmation*, scope an obviously unscoped query, make a public bucket private, stop sending PII to analytics. Do not delete existing user data or alter schemas destructively without explicit authorization and a backup plan.

## Must not claim

"Privacy-compliant", "data-minimized", "secure", or a retention policy. Do not select retention periods.

## Verify

Repeat the exposure checks on the fixed code paths; re-run with a second test user to confirm scoping; confirm form and notice still agree (`policy-consistency`).

## Escalate

Exposure of other users' data, credentials, or sensitive categories: HIGH, report immediately. Retention decisions and lawful-basis questions: REVIEW REQUIRED.

## No change is valid when

Collection is already minimal and used, exposure paths were checked and are clean, and retention is documented. Say what you checked.
