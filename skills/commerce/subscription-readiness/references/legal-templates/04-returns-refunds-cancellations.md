# ReadyVibe Skills v1.1 — Returns, Refunds and Cancellations Policy Template

**Status:** Original drafting template. **Only generate if products, paid services, digital goods or subscriptions are actually sold, or applicable law requires a relevant notice.**

## What really needs customization

The supplied return-policy example assumes **shipped physical merchandise**. ReadyVibe must first determine what is being sold and who the seller/merchant of record is. It must not transplant postage, packaging, return-label, restocking or RMA procedures onto a subscription website.

| Item | Default handling | Required support |
|---|---|---|
| Public storefront name and URL | **AUTO** | Live storefront/product identity |
| What is sold (physical, digital, service, subscription, marketplace) | **AUTO → CONFIRM** | Product catalog, checkout and actual fulfillment |
| Payment platform and merchant of record | **AUTO → OWNER CONFIRM** | Checkout contract, invoices, payment provider role |
| Cancellation method and effect | **AUTO → VERIFY** | Real billing/account UI plus tested server/provider action |
| Delivery method, account access, shipping regions | **AUTO → VERIFY** | Confirmed fulfillment system and order flow |
| Voluntary return/refund window and eligibility | **OWNER DECISION + LEGAL REVIEW** | Actual business offer and mandatory consumer-law limits |
| Refund calculation, payment method, timing | **OWNER DECISION + VERIFY** | Provider workflow and actual operational policy |
| Shipping charges, return address, labels, RMA, restocking fee | **CONDITIONAL / OWNER CONFIRM** | Physical merchandise operations only; lawful fee rules |
| Defects, non-delivery, incorrect product, statutory rights | **LEGAL REVIEW** | Applicable jurisdictions and category of goods/services |
| Trial, auto-renewal and price-change policy | **CONDITIONAL / OWNER CONFIRM** | Subscription offer and what checkout actually promises |
| Support/refund contact | **OWNER CONFIRM** | Working channel with clear routing and capability |
| Effective date | **OWNER CONFIRM** | Actual approval/publication date |

### Decision tree

1. **No money collected and no returnable products sold:** Do not publish a meaningless refund/return policy just to fill a launch checklist.
2. **Physical goods:** Include physical return and shipping sections. Review defective-goods and mandatory consumer remedies.
3. **Downloadable digital goods or digital access:** Include delivery, cancellation/withdrawal, compatibility and defect provisions *as applicable*; do not assume digital goods are always nonrefundable.
4. **Recurring subscriptions:** Include renewal, cancellation method, cutoff, access after cancellation, charges, trials, and separate refund rules. Cancellation of future renewal is not automatically a refund of past charges.
5. **Custom services/bookings:** Add accurately described scheduling, milestones and cancellation conditions; get owner/legal review.
6. **Marketplace:** Establish who contracts with the customer, who takes payment, and which party resolves refund requests; do not falsely claim the platform is seller.

### Assembly markers

- `{{...}}`: Verified information or approved business choice; unresolved values block publication.
- `[[IF ...]]`: Keep only if applicable to this actual website.
- `[[REVIEW REQUIRED: ...]]`: Operator/legal decision required, not text for end users.

---

# Returns, Refunds and Cancellation Policy

**Last updated:** {{VERIFIED_PUBLICATION_DATE}}

This Policy explains the available returns, refunds and cancellation processes for purchases made through **{{VERIFIED_STORE_OR_SERVICE_NAME}}** at **{{VERIFIED_STORE_URL}}**, operated by **{{VERIFIED_SELLER_OR_MERCHANT_OF_RECORD}}**.

**What this Policy covers:** {{EXACT_PRODUCTS_SERVICES_AND_PLANS_COVERED}}.

Nothing in this Policy limits any legal rights or remedies that cannot lawfully be excluded or restricted.

## How to ask for help with an order or charge

Contact **{{VERIFIED_SUPPORT_OR_REFUND_CHANNEL}}**. When contacting us, please provide **{{MINIMUM_NECESSARY_ORDER_DETAILS_OR_SECURE_PORTAL_METHOD}}**. Do not send full payment-card details or passwords.

[[REVIEW REQUIRED: Use an actually monitored support channel and verified refund workflow. If provider manages charges or merchant-of-record refunds, describe the correct contact destination.]]

[[IF PHYSICAL_PRODUCTS_ARE_SOLD]]
## Returning physical products

### Eligible returns

For **{{ACTUAL_PHYSICAL_PRODUCTS_OR_CATEGORIES}}**, we offer **{{APPROVED_VOLUNTARY_RETURN_WINDOW_AND_START_EVENT}}**, subject to **{{APPROVED_CONDITION_AND_EXCLUSION_RULES}}**.

If your item is faulty, misdescribed or otherwise covered by mandatory consumer protections, the legal remedies available to you may differ from the voluntary return rules above.

### Starting a return

To begin a return, **{{TESTED_REQUEST_PROCESS}}**. We will explain **{{VERIFIED_RETURN_SHIPPING_METHOD_AND_PACKAGE_INSTRUCTIONS}}** once the return is accepted.

[[IF A_REAL_RMA_WORKFLOW_EXISTS]]
Include the return authorization number **{{ACTUAL_RMA_PROCESS_REFERENCE}}** as instructed.
[[END IF]]

**Return destination or collection process:** {{VERIFIED_RETURN_ADDRESS_OR_COLLECTION_PROCESS}}.

### Return shipping and fees

**{{OWNER_APPROVED_RETURN_SHIPPING_RESPONSIBILITY}}**. Any applicable charge is **{{SPECIFIC_LAWFUL_FEE_AND_WHEN_IT_APPLIES}}**.

[[REVIEW REQUIRED: Do not invent an RMA number, address, prepaid label, tracking requirement, fee, "final sale" exclusion or deadline. Review applicable mandatory return and defect remedies.]]
[[END IF]]

[[IF DIGITAL_PRODUCTS_OR_ONE_TIME_DIGITAL_PURCHASES_ARE_SOLD]]
## Digital products and one-time digital purchases

Digital purchases made through the Service include **{{ACTUAL_DIGITAL_PRODUCTS}}**, provided through **{{VERIFIED_DELIVERY_OR_ACCESS_METHOD}}**.

Requests to cancel or obtain a refund are handled according to **{{OWNER_APPROVED_DIGITAL_REFUND_CONDITIONS_AND_APPLICABLE_LEGAL_EXCEPTIONS}}**. If a product is defective, inaccessible or not supplied as described, contact us through **{{REAL_SUPPORT_CHANNEL}}** so we can assess the problem and your available remedies.

[[REVIEW REQUIRED: Verify when digital delivery begins, whether legally required withdrawal rights apply, what customers expressly agree to during checkout, and how issues are remedied. Never use a blanket "all digital sales are final" default.]]
[[END IF]]

[[IF SUBSCRIPTIONS_OR_RECURRING_BILLING_EXIST]]
## Subscriptions and recurring charges

### Renewals and billing

The subscription you select is charged **{{VERIFIED_BILLING_FREQUENCY_AND_RENEWAL_CONDITIONS}}** at the price shown at checkout, subject to the plan terms you accept. **{{ACTUAL_TRIAL_AND_PROMOTIONAL_CONDITIONS_IF_ANY}}**.

### Canceling a subscription

You can stop future renewal using **{{TESTED_SELF_SERVICE_CANCELLATION_URL_OR_REAL_SUPPORT_PROCESS}}**. To avoid another charge, cancel **{{CONFIRMED_RENEWAL_CUTOFF_OR_NOTICE_RULE}}**.

When you cancel, **{{CONFIRMED_ACCESS_AFTER_CANCELLATION_EFFECT}}**. Cancellation does not by itself mean a charge already made will be refunded.

### Refunds of subscription charges

For charges already made, refund requests are considered according to **{{OWNER_APPROVED_PAID_PERIOD_REFUND_RULES_SUBJECT_TO_MANDATORY_LAW}}**. **{{VERIFIED_PRO_RATA_OR_FULL_REFUND_PRACTICE_IF_APPLICABLE}}**.

[[REVIEW REQUIRED: Verify checkout wording, paid-period start, trial conversion, cancellation cutoff, actual provider API/state, reactivation and price notices; do not invent partial refunds. Consumer statutes may override voluntary no-refund rules.]]
[[END IF]]

[[IF SERVICE_BOOKINGS_OR_CUSTOM_WORK_ARE_SOLD]]
## Booked or custom services

For **{{ACTUAL_SERVICE_CATEGORY}}**, the scheduling, rescheduling, cancellation and refund conditions are **{{OWNER_APPROVED_SERVICE_TERMS_AND_MILESTONE_RULES}}**, subject to applicable law. Contact **{{SUPPORT_CHANNEL}}** to make a request.
[[END IF]]

[[IF THE_PLATFORM_HOSTS_THIRD_PARTY_SELLERS]]
## Purchases from third-party sellers

When **{{VERIFIED_SELLER_RELATIONSHIP}}**, **{{ACTUAL_SELLER_OR_PLATFORM_NAME}}** is responsible for **{{CONFIRMED_REFUND_OR_FULFILLMENT_SCOPE}}**. Requests should be directed to **{{ACTUAL_WORKFLOW_OR_CONTACT}}**, without limiting any rights against other responsible parties under applicable law.

[[REVIEW REQUIRED: Confirm platform/merchant of record and contractual responsibilities; don't shift legally retained platform obligations to sellers with a generic disclaimer.]]
[[END IF]]

## How approved refunds are processed

If a refund is approved, it is processed through **{{VERIFIED_PAYMENT_AND_REFUND_METHOD}}**. Our handling time is **{{ACTUAL_INTERNAL_REFUND_TIMELINE_OR_ACCURATE_NONNUMERIC_DESCRIPTION}}**; the time for funds to appear may also depend on your payment provider.

We will communicate the outcome through **{{ACTUAL_NOTIFICATION_CHANNEL}}**.

[[REVIEW REQUIRED: Do not promise 1–2 billing cycles or a fixed number of days without provider and operational confirmation. Distinguish refund initiation from money received.]]

## Purchases requiring additional assistance

If you received the wrong item, did not receive a purchased product or service, or have a concern about a defect or billing error, contact **{{VERIFIED_SUPPORT_CHANNEL}}**. We will handle the request subject to the terms that apply to the purchase and any mandatory rights.

## Changes to this Policy

We may revise this Policy. The date above shows the currently published version. Updates will apply in accordance with applicable law and the terms of any existing transactions.

## Contact

**{{VERIFIED_LEGAL_SELLER_OR_OPERATOR}}**

**{{VERIFIED_SUPPORT_AND_COMPLAINT_CHANNEL}}**

[[IF A_PHYSICAL_OR_REGISTERED_ADDRESS_IS_REQUIRED]]
{{VERIFIED_POSTAL_ADDRESS}}
[[END IF]]

---

## Publication checks

1. Match each product class to the relevant modules; do not leave irrelevant physical-return or subscription language.
2. Compare Terms, checkout, plan descriptions, payment/provider records, invoices and this Policy for consistency.
3. Test that cancellation really prevents renewal and that refund requests reach a working handler (without executing a live payment/refund unless explicitly authorized).
4. Confirm who the seller and merchant of record is; determine relevant customer jurisdictions and mandatory rights.
5. Do not publish invented refund windows, fees, exclusions, return addresses or refund processing times.
6. If owner choices or legal review are unresolved, mark **DRAFT — REVIEW REQUIRED** rather than describing the page as complete.
