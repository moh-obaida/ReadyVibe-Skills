---
name: data-rights
description: "Use when a product has accounts or stored personal data, or a policy promises access, correction, deletion, export, or opt-out, and you need to verify what those actions really do. It traces deletion, export, and opt-out through code and stored state. Do not use it to describe active=false as permanent deletion, to run destructive actions on real data, or to state which rights or deadlines apply legally."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "7,37"
  compliance-domains: "6"
  references: "official-sources"
  helpers: "inventory-data-model"
  companions: "design-system-reconnaissance"
---

# data-rights

The button says "Delete my account". What happens next is the whole question. A row flagged `active=false` is a hidden account, not a deleted one.

## Activate when

- There are accounts, profiles, uploads, orders, or messages, or the notice/footer promises deletion, export, correction, or opt-out.
- A "Delete account", "Export my data", "Do Not Sell/Share", or "Unsubscribe" control exists or is planned.
- Not when no personal data is stored and there are no accounts (record why). Not to decide which rights legally apply.

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `design-system-reconnaissance`.

## Inspect

1. **What is promised.** Read the notice, settings screens, and marketing copy for rights and timelines. Make each a checkable claim ("deletes your data within 30 days").
2. **Trace deletion.** Run `node scripts/inventory-data-model.mjs --root .` (path relative to this skill's folder) to list every entity holding personal data and every soft-delete or state column (`SOFT_DELETE_COLUMN`, `PERSONAL_DATA_COLUMNS`); these are what a real deletion must cover. Then follow the code, from the UI action → API/server action → DB operations:
   - Hard `DELETE`, anonymization/scrubbing, or **soft delete** (`deleted_at`, `active=false`, `status='deleted'`)? Soft delete that is never purged is retention, not deletion.
   - **Cascade coverage:** profile, sessions/tokens, uploads and storage objects, orders/invoices (some must be *retained*; record what and why), comments/content authored, audit/log tables, analytics/CRM/email-provider records (Mailchimp, HubSpot, Stripe customers, support tools), search indexes, caches, backups (retention windows).
   - **Auth side:** the auth provider account (Supabase/Firebase/Clerk/Auth0) deleted too, or only the app row?
   - **Confirmation and identity:** does the user re-authenticate? Is deletion irreversible, and does the UI say so?
   - **Third parties:** are downstream deletions triggered or documented as manual?
3. **Verify with a test account** on staging/local: create it, add data (a clearly fake test identity is easy to search for afterward), delete it, then query the DB and provider sandboxes for the identity. What remains?
4. **Export/access.** Does an export exist? Does it contain all personal data a user would expect (not only the profile row)? Format usable? Who can trigger it (only the account owner)?
5. **Correction and opt-out.** Can users edit their data? Is there an opt-out of marketing/analytics/sale-or-sharing where the product does those? Does the opt-out change behavior (see `email-compliance`, `consent-management`)?
6. **Request channel.** If rights are exercised by email/form, is that address real and monitored (`public-support`)?

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- "Delete action sets `active=false`" is not "user data is fully deleted". Say exactly what the code does.
- Handler code is SOURCE-INDICATED. A post-delete database/provider check on a test account is OBSERVED.
- Retained-by-design records (invoices) are not failures if disclosed; whether retention is legally required is REVIEW REQUIRED.
- Provider and backup contents you cannot inspect: UNKNOWN.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components, by the component ladder: reuse, compose, extend, and only then create a matching component. Never impose a ReadyVibe look on the user's site.

Low-risk fixes with the owner's agreement: extend an existing deletion to cover missed tables/objects; add a purge step after a soft delete so the data is actually removed; delete the auth-provider record; add an export that gathers existing fields; correct UI/notice copy to describe what deletion actually does. Test destructive code against **test data only**. Never delete real user data, run migrations against production, or invent timelines and deadlines.

## Must not claim

"Fully deleted", "GDPR/CCPA rights supported", "we honor all requests within X days" beyond what code and process show. Do not describe legal deadlines or scopes from memory.

## Verify

Repeat the test-account trace after changes: no personal data remains except documented retained records; the auth account is gone; downstream syncs ran or are listed as manual steps for the owner; the notice describes the same behavior.

## Escalate

Requests involving minors, legal holds, financial records, or verification of identity; retention duties; processor deletion you cannot trigger; any promised timeline the process cannot meet.

## No change is valid when

There are no accounts or stored personal data, or deletion/export demonstrably work as described. Record the trace you did.
