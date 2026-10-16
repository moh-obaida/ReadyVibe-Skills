# ReadyVibe Skills v1.1 — Terms of Service Template

**Status:** Original, reusable drafting template — **not a published policy or legal approval**.

This template is designed for ReadyVibe's existing legal/compliance skills to adapt to **the actual website**, not for blanket publication. It is newly drafted; it does not reproduce the uploaded third-party Terms generator's wording.

## 1. What really needs customization

**Principle:** *Don't ask the owner to fill something that the project itself can establish reliably. Don't infer a legal/business decision from code.*

| Field or decision | Handling | Required evidence or decision |
|---|---|---|
| Public product name and canonical URL | **AUTO** | Deployed origin, routing and branding; verify canonical host |
| What the website actually does | **AUTO → CONFIRM** | Features, routes, product copy, public workflows; owner confirms the description |
| Accounts, login and hosted profiles | **CONDITIONAL / AUTO** | Actual auth, registration and account-management flows |
| User submissions, uploads, communities, reviews | **CONDITIONAL / AUTO** | Actual content-write/display flows; owner confirms licensing/moderation choices |
| Payments, subscriptions, trials, cancellations | **CONDITIONAL / AUTO → CONFIRM** | Live checkout/billing flows, configured commercial terms, provider terms; owner confirms promises |
| AI features, API usage, marketplaces, age-sensitive features | **CONDITIONAL / AUTO → CONFIRM** | Actual features plus applicable policy decisions |
| External sites/services | **AUTO** | Deployed links, integrations and data/operational dependencies |
| Operator's legal name | **OWNER CONFIRMATION REQUIRED** | Person, company or other organization legally responsible; never guess from GitHub or domain |
| Contact route for legal notices | **OWNER CONFIRMATION REQUIRED** | Tested inbox/form; include address/other methods only if required and verified |
| Effective date and notice mechanism | **OWNER CONFIRMATION REQUIRED** | Actual publication/approval date and a mechanism that really exists |
| Age eligibility and parental permissions | **OWNER + LEGAL REVIEW IF RELEVANT** | Target users, regional requirements and actual age gates |
| Ownership/license of customer content | **OWNER + LEGAL REVIEW IF RELEVANT** | What the service truly needs permission to do; never default to transfer/sale rights |
| Refund rights, tax, renewals and cancellation | **OWNER + LEGAL REVIEW IF SELLING** | Consumer law, checkout terms and actual billing capabilities |
| Governing law, forum, arbitration, indemnity, limits on liability | **LEGAL REVIEW** | Operator jurisdiction, consumer rights, enforceability; no universal defaults |
| Privacy and cookie disclosures | **LINK / CROSS-CHECK** | Actual Privacy and Cookie documents; inspect data and storage behavior separately |

### Minimum owner questions

Ask only questions unresolved after inspection. Generally:

1. What is the **exact legal name** of the person or organization operating the website, and which country/jurisdiction is it established in?
2. Which **working contact channel** should receive legal notices or complaints?
3. Are there any **age restrictions or participation rules** beyond what the website currently enforces?
4. **If money is collected:** what specific cancellation, refund, renewal and pricing commitments apply? Identify any undecided terms.
5. **If users contribute content:** may the service host/display that content, and under what rules? What moderation/account-termination practices actually exist?
6. Who will **approve the legal clauses** that require local counsel or an informed operator decision, and what is the actual go-live date?

Do not ask all six for a static brochure site. Do not hide unanswered items inside allegedly completed Terms.

## 2. Template assembly rules

- Only include optional modules with evidence that they apply. After assembling the page, number sections sequentially if the project’s style calls for numbered headings.
- Keep the default text clear and appropriately scoped; remove drafting notes, square-bracket section controls and unused options before publication.
- Values in `{{DOUBLE_BRACES}}` are facts that must be obtained and checked. **Never publish unresolved placeholders.**
- `[[IF ...]]` / `[[END IF]]` sections are conditional. Do not confuse code presence with a live product feature.
- `[[REVIEW REQUIRED: ...]]` must be resolved by informed operator review or legal counsel; do not invent a choice or silently publish the tag.
- When laws require disclosures or terms not covered here, add only research-supported, jurisdiction-appropriate language and flag legal review.
- A page's existence does not prove meaningful acceptance of Terms; verify registration/checkout assent if relevant.
- Cross-check all published promises against the actual website, billing provider, cancellation workflow, data practices and separate policies.
- If there is no meaningful contractual relationship, do **not** force a long Terms document simply to fill a checklist. Recommend a simpler notice where appropriate.

---

# Terms of Service

**Effective date:** {{EFFECTIVE_DATE}}

## About these Terms

These Terms explain the rules for using **{{SITE_NAME}}**, available at **{{SITE_URL}}**, and the services described below (together, the “Service”). The Service is operated by **{{LEGAL_OPERATOR_NAME}}** (referred to as “we,” “us,” or “our”).

By using the Service, you agree to follow these Terms to the extent a binding agreement is formed under applicable law. If you do not agree, do not use features that require agreement. These Terms do not take away rights that cannot legally be waived.

**What the Service does:** {{ACCURATE_SERVICE_DESCRIPTION}}

[[REVIEW REQUIRED: Confirm when and how users accept Terms. For account creation or purchase, ensure any acceptance control and record actually exist; don't claim that merely visiting creates legally binding agreement everywhere.]]

## Use of the Service

You may use the Service for its intended, lawful purposes. Do not attempt to interfere with its operation, gain unauthorized access, abuse other users, misuse their information, or introduce harmful code or content. Any usage limits we enforce must be described accurately in the Service or in applicable published plan terms.

We may take proportionate action against misuse, subject to applicable law and any rights you have. We do not promise monitoring, enforcement capabilities, or response times that we have not established.

[[IF THE SERVICE HAS ACCOUNTS]]
## Accounts

When creating an account, provide the information the Service requests accurately and keep your login credentials secure. You are responsible for activity under your account to the extent permitted by applicable law. Tell us promptly through **{{SUPPORT_CONTACT}}** if you believe your account has been used without authorization.

You can manage or close your account using **{{ACTUAL_ACCOUNT_MANAGEMENT_ROUTE_OR_PROCESS}}**. We may suspend or terminate accounts for material misuse or when necessary to protect the Service or its users, subject to applicable notice, appeals and consumer-rights obligations.

[[REVIEW REQUIRED: Only describe account deletion, exports, reinstatement or recovery if those workflows really work. Do not equate account deactivation with deletion of retained data.]]
[[END IF]]

[[IF THE SERVICE ENFORCES OR NEEDS AGE ELIGIBILITY CONDITIONS]]
## Age eligibility

{{AGE_ELIGIBILITY_TEXT_APPROVED_FOR_THIS_AUDIENCE_AND_JURISDICTION}}

[[REVIEW REQUIRED: Do not choose 13 or 18 by default or claim parental consent is obtained if it isn't. Align text, interface, enforcement and local law.]]
[[END IF]]

## Content and intellectual property

The Service's interface, branding and materials may be protected by intellectual-property rights. Except where an applicable license expressly permits otherwise, using the Service does not transfer ownership of these materials to you.

**Third-party and open-source material:** Any applicable third-party licenses continue to govern their respective materials. These Terms do not override those licenses.

[[IF THE SERVICE ALLOWS USER-GENERATED CONTENT OR UPLOADS]]
## Your content

You retain your rights in content you submit, to the extent you own those rights. You give us a **{{PRECISE_LIMITED_LICENSE_SCOPE}}** permission to process, store and display it only as needed for the actual Service functions you use. This permission must not be broader than the documented product need.

You are responsible for having the rights and permissions needed to submit your content and for following applicable rules. We may remove or restrict material that violates these Terms, applicable law or a published moderation policy, using the procedures the Service actually supports.

[[REVIEW REQUIRED: Confirm whether content is public, shared with other users, retained after account closure, licensed for model training, sublicensed or used for promotion. Do not imply any of these without an express decision and a matching privacy notice.]]
[[END IF]]

[[IF THE SERVICE SELLS PRODUCTS, SERVICES OR PAID ACCESS]]
## Purchases and pricing

Before you pay, we will show the applicable offer, price and important purchase terms through **{{ACTUAL_CHECKOUT_OR_ORDER_FLOW}}**. The actual provider handling payment is **{{VERIFIED_PAYMENT_PROVIDER_AND_ROLE}}**, where relevant. Additional taxes or charges will be presented as required by law.

[[IF SUBSCRIPTIONS OR RECURRING PAYMENTS ARE ACTUALLY OFFERED]]
### Subscriptions

The subscription plan, billing interval, renewal rules, price and any trial conditions are those presented and agreed to at checkout, together with any applicable plan-specific terms. You can cancel using **{{WORKING_CANCELLATION_METHOD}}**. Explain accurately when cancellation takes effect and whether access continues to the end of the paid period: **{{CONFIRMED_CANCELLATION_EFFECT}}**.

[[REVIEW REQUIRED: Verify auto-renewal notices, price changes, trial conversion, cancellation parity and subscription protections for relevant locations.]]
[[END IF]]

### Refunds and returns

Our **{{REFUND_POLICY_URL}}** describes applicable refund/return procedures and any voluntary commitments we make. Nothing in that policy removes mandatory statutory consumer rights.

[[REVIEW REQUIRED: If a separate Refund Policy is appropriate, ensure this link works and matches checkout, fulfillment and customer support. Never invent a blanket “no refunds” rule.]]
[[END IF]]

[[IF THE SERVICE HAS USER-TO-USER TRANSACTIONS OR A MARKETPLACE]]
## Marketplace interactions

{{VERIFIED_MARKETPLACE_ROLE_AND_RESPONSIBILITY_TEXT}}

[[REVIEW REQUIRED: Confirm whether the operator is merchant of record, an intermediary or seller, and whether disputes/returns are handled by the platform or another party.]]
[[END IF]]

[[IF THE SERVICE HAS AI-GENERATED RESULTS]]
## AI-assisted features

Certain features may produce automated outputs. These results can contain mistakes or incomplete information, so review them before relying on them for important decisions. Features and limits are described where they are offered in the Service.

[[REVIEW REQUIRED: Confirm how prompts and outputs are processed, stored, shared or used for training. Put factual processing disclosures in the Privacy Policy; do not invent accuracy guarantees or confidentiality promises.]]
[[END IF]]

[[IF THE SERVICE INTEGRATES OR LINKS TO INDEPENDENT THIRD-PARTY SERVICES]]
## External services

The Service may link to or operate alongside third-party services. Their own terms may apply when you use them. We are not responsible for independently operated websites merely because we link to them; any responsibilities arising from our own integrations remain subject to applicable law.
[[END IF]]

## Availability and changes

We may update, repair or change the Service over time. We cannot guarantee uninterrupted availability, but this does not affect any commitments we have expressly made to paying customers or rights that law protects.

We may revise these Terms when necessary. If a change is material, we will provide notice in the manner required by applicable law and any commitments we have made. The effective date at the top identifies the version currently published.

[[REVIEW REQUIRED: Verify the actual terms-notification workflow, including any additional opt-in/consent requirements for material changes.]]

## Privacy

Our **[Privacy Policy]({{PRIVACY_POLICY_URL}})** explains relevant personal-data practices. Where a separate cookie notice is appropriate, see **[Cookie Policy]({{COOKIE_POLICY_URL}})**.

[[REVIEW REQUIRED: Delete the Cookie Policy sentence if no separate policy is justified or present. A privacy notice is information, not blanket consent to international transfers or every processing operation.]]

## Responsibility and legal rights

Each party remains responsible for obligations imposed by applicable law. Nothing in these Terms excludes or limits rights or liabilities that cannot legally be excluded or limited.

[[REVIEW REQUIRED: Any warranty disclaimer, liability limit, indemnification obligation, governing-law choice, forum clause, arbitration agreement or claims deadline requires operator/legal review for the relevant jurisdictions and transaction type. Do not insert generic US state/county/AAA language by default. Add approved clauses here only when appropriate.]]

## Contact

For questions about these Terms or the Service, contact **{{VERIFIED_LEGAL_CONTACT}}**.

[[REVIEW REQUIRED: Include a postal address, company registration details, phone number, complaint mechanism or designated agent where required by applicable law; verify all contact details actually work.]]

---

## 3. Completion and publishing checklist

For each generated Terms page, ReadyVibe should output:

- **INCLUDED:** list of modules kept, with observed feature evidence.
- **OMITTED:** list of irrelevant modules, with reasons.
- **AUTO-FILLED:** facts, with where each was verified (site/config/deployment).
- **OWNER CONFIRMATION:** actual unanswered business details and policy choices.
- **LEGAL REVIEW:** jurisdiction-specific/enforceability issues that a coding agent cannot settle.
- **CONSISTENCY:** discrepancies between Terms, Privacy/Cookie/Refund documents, checkout, account controls and real behavior.
- **PUBLICATION GATE:** no unresolved placeholders, conflicting policy statements, unsupported legal assertions, dead links or promises contradicted by running functionality. Where legal review is required and pending, label the deliverable **DRAFT — REVIEW REQUIRED**, not “ready” or “compliant.”

**Do not treat the uploaded Termly-style generator text as license-cleared content for republication in a public skills repository.** Use original drafting and confirm any rights before incorporating third-party template text.
