---
name: email-compliance
description: "Use when a product sends email or collects addresses for newsletters, product updates, promotions, or lifecycle campaigns, and you need to verify sender identity, transactional versus marketing separation, and that unsubscribe actually suppresses future sends. It traces the unsubscribe from link to stored state to the send path. Do not use it to stop at the presence of a link, to send real email to real people, or to state legal sufficiency."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "36,37"
  compliance-domains: "4"
---

# email-compliance

"Unsubscribe link exists" is not "unsubscribe works", and neither is "future marketing is suppressed". The failure that hurts people is the third one: they unsubscribed and kept getting mail.

## Activate when

- The product has a newsletter or waitlist form, an email provider (Resend, SendGrid, Postmark, Mailchimp, Loops, SES…), email templates, send routes, or scheduled campaigns.
- Not when no email is sent and no address is collected for messaging (record "not applicable" with the observed reason and the recheck trigger). Not to design campaigns.

## Inspect

1. **Classify each email** the product can send: **transactional** (receipt, password reset, security notice, requested confirmation) vs **marketing/promotional** (newsletter, announcements, upsell, re-engagement) vs **mixed** (transactional with promo content, which is where problems begin). Marketing content in a transactional email changes its category.
2. **Collection.** Signup forms and their wording: what the person is told they will receive; pre-ticked boxes; whether address collection for one purpose (account) is reused for another (marketing) without a separate choice; double opt-in if promised; where the subscription record is stored (list/provider or own DB) with timestamp and source if available.
3. **Sender identity.** From name/address, reply-to that receives replies, physical/business identification in the footer where relevant, no misleading subject or headers, custom-domain authentication config (SPF/DKIM/DMARC) if visible in DNS docs or provider config (report as SOURCE-INDICATED).
4. **Unsubscribe, end to end:**
   - **Link exists** in every marketing template, is not `#` or a placeholder, and points at a real route.
   - **Route works** (`observe-runtime` or manual, on staging with a test address): resolves without login, one step or one confirm, no dark patterns, clear confirmation.
   - **`List-Unsubscribe` / `List-Unsubscribe-Post` headers** present on marketing sends if the provider sends them (provider config or code).
   - **State changes:** find the code that handles it. Does it set a suppression flag / delete the subscription / call the provider's suppression API? Is it keyed by the *address* (case-normalized) as well as by the user, so the same address on another list or account is covered?
   - **Send path honors it:** locate every place marketing is sent (cron, campaign job, provider automation, admin "send to all"). Does each query exclude suppressed addresses **before** sending? A single unfiltered path is a bug.
   - **Provider vs app state:** if the provider holds the list, does the app sync unsubscribes back? Do bounces and complaints suppress?
5. **Preference controls** where implemented: do categories save, and are they enforced in the send path?
6. **Links in emails**: unsubscribe, view-in-browser, and CTAs resolve; no localhost or staging hosts (`check-links` on the template preview).
7. **Do not send** to real addresses. Use provider sandboxes, a local mail catcher, or preview rendering. On a staging backend use a `@example.test` address.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- OBSERVED needs the unsubscribe run on staging with a test address **and** a check that the address is excluded by the send-selection logic (a test send to the sandbox, or a query result).
- Handler sets a flag: SOURCE-INDICATED suppression. Add "send path filter verified" to upgrade it.
- Provider-side suppression you cannot inspect is UNKNOWN. Say what the owner should confirm in the provider dashboard.

## May change

- Fix a placeholder/dead unsubscribe link; wire an existing unsubscribe route to the real suppression mechanism; add the suppression filter to send queries; add `List-Unsubscribe` headers through the existing provider integration; fix localhost/staging URLs in templates; add an honest signup line near the form describing what will be sent ("Product updates, about monthly").
- Separate a marketing block out of a transactional email **only** with the owner's decision.
- Never send email, import lists, change provider accounts, or fabricate a sender address, business address, or consent record.

## Must not claim

"CAN-SPAM/GDPR/CASL compliant", "opted-in", "consent recorded" without evidence, or "unsubscribe works" when only the link was checked. Do not state jurisdiction-specific requirements (address in footer, opt-in vs opt-out, time limits) from memory.

## Verify

On staging with a test address: subscribe → confirm (if double opt-in) → trigger a marketing send to the sandbox (received) → unsubscribe → trigger the send again (**not** received) → resubscribe path (if any) works and is deliberate. Check that the unsubscribe survives a redeploy (stored, not in memory) and applies across lists as intended.

## Escalate

Consent basis, sender identification content, and regional requirements: REVIEW REQUIRED. A marketing path that ignores suppression and could email real users: HIGH, and warn the owner not to send until fixed. Purchased or imported lists: stop and ask.

## No change is valid when

No marketing email exists (no provider, no newsletter form, no send route), or only transactional messages are sent and templates contain no promotional content. Say so and name the recheck trigger (adding a newsletter form or email vendor).
