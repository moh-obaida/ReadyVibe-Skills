---
name: consumer-protection-readiness
description: "Use when a product shows prices, sells goods or services, offers trials, subscriptions, or refunds, and you need to check that pricing, fees, renewal, cancellation, refund terms, delivery, and merchant identity are shown clearly and consistently across page, checkout, terms, and emails. Do not use it to invent refund or cancellation terms, to state consumer-law requirements from memory, or for sites that take no money and show no offers."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "7"
  launch-checks: "2,25"
  references: "official-sources"
  companions: "design-system-reconnaissance,subscription-readiness,payments-readiness"
---

# consumer-protection-readiness

People feel cheated by *inconsistency and surprise*: a price that changes at checkout, a trial that quietly bills, a cancel button that does not exist. This skill checks that what the product **shows, charges, and promises** agree. Legal specifics are the owner's and counsel's.

## Activate when

- Prices, plans, checkout, invoices, trials, subscriptions, auto-renewal, discounts, refunds, returns, shipping, or digital delivery exist.
- Not for a free product with no offers (record "not applicable"). Integration security of the payment provider is `payments-readiness`. Recurring mechanics in depth are `subscription-readiness`.


## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `design-system-reconnaissance`, `subscription-readiness`, `payments-readiness`.

## Inspect

1. **Price honesty.** Trace one purchase from pricing page → cart → checkout → confirmation → email/receipt. Compare displayed price, currency, tax/VAT presentation, shipping, fees, and total at each step. Any surprise (added fees, price change, different currency) is a finding. "From $X" claims and struck-through "was" prices need a real basis (`content-trust`).
2. **Terms of the offer.** Is what is being bought, its duration, delivery method, and any limits stated before payment? Are trial length, what triggers billing, and the first charge date stated near the button, not only in the terms?
3. **Recurring billing** (with `subscription-readiness`): renewal amount and cadence disclosed at purchase; a working cancellation path that is at least as easy as signup; confirmation of cancellation; what happens to access after cancel; reminders if promised.
4. **Refunds and returns.** Is there a stated policy, and does it agree across FAQ, checkout, terms, and emails? Are statutory-style promises made in copy ("30-day money back") that no policy or process backs?
5. **Merchant identity.** Legal/trading name, contact route, and where relevant address and registration details are findable from checkout (`legal-identity-notices`, `public-support`).
6. **Dark patterns.** Pre-selected add-ons, hidden decline, fake urgency/scarcity timers, confirm-shaming, hard-to-find cancel. Note as trust and consumer-risk issues; timers that reset on reload are provably fake (verify by reloading).
7. **Payment surface sanity**: HTTPS, provider-hosted payment fields, no card data touching the app's own server (verify with `payments-readiness`).
8. **Exercise** the flow on a staging/test-mode provider only. Never enter real cards; use the provider's published test values in test mode on a local/staging origin.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Price and total mismatches are OBSERVED only from a run through the flow. Reading templates is SOURCE-INDICATED.
- Refund/cancellation *terms* are DECLARED by the owner. A missing one is a gap to ask about, not something to write.
- Whether wording or flows satisfy any consumer law is REVIEW REQUIRED.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components, by the component ladder: reuse, compose, extend, and only then create a matching component. Never impose a ReadyVibe look on the user's site.

Make displayed prices, totals, currency, and renewal/trial information **consistent** with what the backend actually charges; surface existing terms near the purchase button; fix a broken cancellation route; align FAQ/checkout copy with the owner's real policy; remove fake timers or misleading struck prices. Do not invent refund periods, cancellation windows, warranty language, tax statements, or business identity.

## Must not claim

"Compliant with consumer law", "cancel anytime" or "money-back guarantee" unless behavior and policy exist, "transparent pricing", or anything about withdrawal rights, cooling-off periods, or auto-renewal statutes.

## Verify

Repeat the test-mode purchase and cancel: the total at each step equals the charge; the renewal statement matches the subscription created; cancel ends renewal and access behaves as stated; refund/cancel wording is the same in page, checkout, terms, and emails.

## Escalate

Recurring billing, trials, cross-border sales, digital goods, B2C sales to consumers in regulated regions, refunds or warranty promises, and any payment/auth flow that cannot be exercised: REVIEW REQUIRED where the wording or applicable rule is unclear; look up the rule at an official source and cite it. Keep the recommendation proportional: name the specific unresolved fact or risk that warrants it (minors, sensitive data, a regulated domain, cross-border sale, unclear markets, contested wording), and do not tell an ordinary low-risk site to hire a lawyer.

## No change is valid when

No prices or offers exist, or price, terms, and cancellation are consistent and the owner's policy is documented. Say so, and name the recheck trigger (adding a plan, trial, or checkout).
