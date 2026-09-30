---
name: payments-readiness
description: "Use when a site takes payments through a provider such as Stripe, Paddle, Lemon Squeezy, or PayPal and you need to check integration mode, key handling, webhook verification, and that the checkout flow works and never touches card data. It verifies test versus live configuration and exercises checkout in test mode only. Do not use it to store card numbers, to enter real payment details, to move money, or to judge payment regulation."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "7,10"
  launch-checks: "38,35"
  helpers: "scan-secrets"
  references: "companion-methods"
---

# payments-readiness

Payment bugs are trust and money bugs: a test key in production means no revenue; a live secret in the browser means a drained account; an unverified webhook means free upgrades. This skill checks the integration's *plumbing*.

## Activate when

- A payment provider SDK, checkout link, pricing table button, or webhook exists.
- Before launch or a switch from test to live mode.
- Not for pricing/refund wording (`consumer-protection-readiness`) or recurring billing rules (`subscription-readiness`). Never handle real cards.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `consumer-protection-readiness`, `email-compliance`, `failure-resilience`, `public-support`, `regulated-domain-triggers`, `subscription-readiness`.

## Inspect

1. **Provider and integration style:** hosted checkout/redirect (safest), embedded provider fields (Stripe Elements), or custom card inputs (should not exist). Card data must never touch the app's own server, logs, or storage.
2. **Keys and secrets:** `node scripts/scan-secrets.mjs --root .` (paths relative to this skill's folder). Publishable keys (`pk_...`) in the client are expected; secret keys (`sk_...`, restricted keys), webhook secrets (`whsec_`), and API tokens must be server-only. Client-exposed env names with secret-like names are HIGH. Test vs live: `pk_test`/`sk_test` in a production deployment means checkout runs in test mode (owner confirms production env; do not read `.env` values).
3. **Server-side truth:** prices and amounts computed server-side from product IDs, not trusted from the client (`amount` in the request body); currency fixed; quantity validated; coupon logic server-side; the success page does not by itself grant access (fulfillment happens on a verified webhook or server confirmation).
4. **Webhooks:** endpoint verifies the provider's signature with the signing secret using the raw body; idempotent handling (repeated events); handles the events the business needs (paid, failed, refunded, canceled, dispute); returns 2xx quickly; route excluded from CSRF/auth middleware appropriately; not publicly logging payloads with personal data.
5. **Flow in test mode (local/staging only):** with the provider's published test card values in **test mode**, exercise: success; declined card; authentication-required card; abandoned checkout (cancel URL works); success redirect and fulfillment; duplicate submissions; refund path. Confirm checkout success/cancel URLs point at real routes on the intended host (no localhost). Never enter real card details.
6. **Trust surface:** HTTPS; recognizable provider branding/hosted page; totals shown before pay; receipts/emails sent and correct (`email-compliance`: transactional); refund and support contacts (`consumer-protection-readiness`, `public-support`).
7. **Failure states:** provider outage/timeouts; payment pending; user returns via back button (`failure-resilience`).
8. **Regulated angles:** marketplaces/payouts, money transmission, crypto, high-risk goods: `regulated-domain-triggers`.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Checkout completing in test mode is OBSERVED for test mode only; live-mode behavior is UNKNOWN until the owner runs a real (their own, refundable) transaction.
- A webhook handler that verifies signatures in code is SOURCE-INDICATED; prove it by sending a bad-signature request in staging and seeing rejection.
- Provider dashboard settings (statement descriptor, tax, payment methods) are DECLARED by the owner.

## May change

Move secret keys server-side; fix success/cancel URLs; add server-side amount computation using the project's price source; add signature verification and idempotency to webhooks; fix env wiring; add error states. Do not store card data, change providers, create products/prices in the provider account, or run live transactions.

## Must not claim

"PCI compliant", "secure payments", "checkout verified" without naming the mode and cases; "fraud-proof".

## Verify

Repeat test-mode cases; re-scan secrets on rebuilt output; send a forged webhook and confirm rejection; confirm fulfillment only after verified events; check URLs for host correctness.

## Escalate

Live secret exposed (HIGH: owner rotates); ability to alter amounts client-side; unverified webhooks in production; recurring/marketplace/regulated flows; anything needing a real transaction: UNVERIFIED for the owner to run.

## No change is valid when

The site takes no payments, or uses provider-hosted checkout with server-side verification and correct modes, all verified in test mode. Do not add payment code to a site without a purchase.
