---
name: subscription-readiness
description: "Use when billing recurs: subscriptions, trials that convert, auto-renewing plans, or metered billing. It checks that renewal, trial conversion, price changes, and cancellation are disclosed, actually work in the billing system, and agree across page, checkout, terms, and emails. Do not use it on products without recurring billing, to invent cancellation or refund terms, or to state renewal-law requirements from memory."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "7"
  launch-checks: "2,35"
  references: "official-sources"
---

# subscription-readiness

Recurring billing is where good products lose trust: a free trial that quietly charges, a plan you can sign up for in two clicks and cancel only by emailing someone. This skill checks the *mechanics and the honesty* of recurrence.

## Activate when

- Plans renew, trials convert, seats/usage are billed periodically, or "cancel anytime" appears in copy.
- Not for one-time purchases (`payments-readiness`), and not for wording requirements (`consumer-protection-readiness` escalates those).

## Inspect

1. **Model:** plan names, price, currency, interval, trial length and what triggers first charge, proration on upgrade/downgrade, seats/metered usage, grandfathered prices, discounts that expire.
2. **Disclosure at the point of purchase:** amount and interval, renewal date or trigger, trial-to-paid conversion, and how to cancel are stated **next to the buy button and in the confirmation and receipt**, not only in the terms. The wording agrees with the actual billing configuration (a "14-day trial" in copy vs. a 7-day trial configured in the provider is a bug).
3. **Cancellation:** a working path that is at least as easy as signup, reachable while logged in without contacting support (billing portal or in-app button); cancellation takes effect at period end or immediately as stated; confirmation shown and emailed; access after cancel behaves as promised; what happens to data (`data-rights`).
4. **Failed payments and dunning:** what the user sees; grace period; emails (transactional); access handling; recovery path.
5. **Changes and reminders:** price change communication process; renewal reminders if promised; trial-ending reminders if promised; the promised emails actually exist and send (`email-compliance` for transactional vs marketing).
6. **Refund policy consistency:** the same policy across FAQ, checkout, terms, and support text; refunds mechanically possible (provider settings and admin capability).
7. **Webhook/state sync:** subscription status in the app follows the provider (canceled, past_due, paused); an "active" flag not updated on cancel is a launch bug (`payments-readiness`).
8. **Exercise in test mode on local/staging** (never live): subscribe with a trial, verify conversion configuration, cancel via the UI, simulate failed renewal (provider test clocks/cards), and confirm state and emails. Fast-forward using the provider's test-clock tools where available.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Test-mode flow completed: OBSERVED in test mode. Live billing, tax collection, and provider dashboard policies are DECLARED/UNKNOWN.
- Copy vs configuration mismatch requires reading both (the price/interval in the provider config or code, and the rendered copy).
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Make displayed renewal/trial/price statements match the real configuration; surface cancellation and renewal info near the buy button and in confirmation emails/receipts using **owner-provided** wording; fix a broken cancel route or portal link; sync subscription state from webhooks; add renewal/trial reminders only if the owner wants them. Do not create plans/prices in the provider, invent refund or cancellation windows, or hide the cancel path.

## Must not claim

"Cancel anytime", "no hidden fees", "compliant with auto-renewal laws", or any legal requirement about renewals, cooling-off, or notices.

## Verify

Repeat the test-mode subscribe → trial → cancel → failed-renewal cases; confirm copy, checkout, terms, emails, and provider config agree on price, interval, trial, renewal, and cancellation; confirm access state after cancel.

## Escalate

Any recurring billing to consumers, trials, regional pricing, or auto-renewal wording: REVIEW REQUIRED, recommend legal review of terms and checkout disclosures before launch. Flows you cannot exercise in test mode: UNVERIFIED.

## No change is valid when

There is no recurring billing (say so; recheck when plans are added), or disclosure, cancellation, and state sync are all verified consistent.
