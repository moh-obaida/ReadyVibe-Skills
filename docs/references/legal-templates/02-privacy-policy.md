# ReadyVibe Skills v1.1 — Privacy Policy Template

**Status:** Original drafting template. **Not a complete legal assessment or publication-ready notice.**

## What actually needs customization

This is a *data-flow-driven* template, not a list of everything a website might collect. Inspect frontend and backend code, production configuration, live network requests, authentication, forms, payment infrastructure, analytics, cookies/storage, vendors, logs and retention/deletion behavior. Never conclude that data is *not* processed merely because it was not observed in the browser: servers, CDNs and processors may still collect it.

| Item | Default decision | Required support |
|---|---|---|
| Website/service name, domain, visible features | **AUTO** | Canonical origin, routes, product UI; verify deployment |
| Submitted personal data | **AUTO → VERIFY** | Actual form fields, account models, API writes and recipients |
| Cookies, browser storage, pixels and analytics | **AUTO → VERIFY** | Runtime observations, cookie jar, storage, consent behavior, vendor configuration |
| Authentication/social logins | **CONDITIONAL / AUTO** | Real providers, scopes, callbacks and user profile fields |
| Payments and billing | **CONDITIONAL / AUTO → VERIFY** | Checkout/provider's actual role, which payment fields touch operator systems |
| AI providers, user uploads, support/chat, user-generated content | **CONDITIONAL / AUTO → VERIFY** | Real data flows, provider policies and contracts, retention behavior |
| Purposes and third-party recipients | **AUTO → OWNER CONFIRM** | Data-flow tracing and integration docs; owner verifies business purposes |
| Retention periods, deletion and backups | **AUTO where established; otherwise OWNER CONFIRM** | Config, scheduled jobs, system design, processor contracts; no guessed periods |
| Data controller/operator legal identity and contact | **OWNER CONFIRM** | Legal entity or actual individual operator and working privacy contact |
| Audience/children's data, geographic markets | **OWNER CONFIRM** | Product target, eligibility, where service operates; do not infer from language alone |
| Jurisdictional rights, lawful bases, international transfer safeguards, DPO/representative | **LEGAL REVIEW when applicable** | Confirmed reach, processing purposes, provider locations and actual legal arrangements |
| Effective date and material-update notice | **OWNER CONFIRM** | Actual approved publication date and real update/notice practice |

**Critical rule:** Mark unsupported claims **UNKNOWN** or **REVIEW REQUIRED** in the drafting report. Do not publish an invented privacy practice, promise or legal safeguard. Always reconcile the final notice against Terms, Cookie Policy, checkout, marketing consent and account deletion flows.

## Template controls

- `{{PLACEHOLDER}}`: Fill from verified source or owner confirmation. No placeholders may appear on a published page.
- `[[IF CONDITION]] ... [[END IF]]`: Keep only when verified applicable.
- `[[REVIEW REQUIRED: ...]]`: Internal review note to resolve, not something to leave in a public notice.
- Do not generate a privacy policy that declares a processing activity just because a potential template section exists.
- Laws and disclosure requirements change. Research current official sources for relevant jurisdictions and seek competent legal review for uncertain obligations.

---

# Privacy Policy

**Last updated:** {{VERIFIED_PUBLICATION_DATE}}

## Who we are and what this Policy covers

**{{PUBLIC_SERVICE_NAME}}** is operated by **{{VERIFIED_LEGAL_OPERATOR}}** ("we", "us" and "our"). This Policy describes our handling of personal information when you use **{{VERIFIED_SERVICE_URL}}** and **{{ACTUAL_COVERED_SERVICES_OR_APPLICATIONS}}**.

**Privacy contact:** {{VERIFIED_PRIVACY_CONTACT_METHOD}}.

[[REVIEW REQUIRED: Add registered address, company identifiers, data-protection officer or representative details where actually required; do not invent an organization merely because the website has a brand name.]]

## Personal information we collect

We collect the information described below in connection with the Service's actual features. The precise information may depend on how you use the Service.

{{VERIFIED_DATA_COLLECTION_TABLE}}

*Populate the table with columns: Category of personal information | Where it comes from | Why it is processed. Examples are not defaults. If only a contact form exists, list only fields that form and relevant server infrastructure actually process.*

[[IF ACCOUNTS_OR_AUTHENTICATION_EXIST]]
### Account information

When you register or sign in, we process **{{VERIFIED_ACCOUNT_DATA_CATEGORIES}}** to provide **{{VERIFIED_ACCOUNT_FUNCTIONS}}**. Authentication is handled using **{{VERIFIED_AUTHENTICATION_PROVIDERS_AND_ROLES}}**.

[[REVIEW REQUIRED: Differentiate email/password from third-party sign-in, and separate provider-held account data from data received by the site. Do not claim access to social contacts, friends or birthdays without actual permission scopes.]]
[[END IF]]

[[IF FORMS_UPLOADS_OR_USER_CONTENT_EXIST]]
### Information you submit

If you use **{{ACTUAL_FORM_OR_CONTENT_FEATURES}}**, we process **{{VERIFIED_SUBMITTED_INFORMATION}}** to **{{VERIFIED_PURPOSES}}**. **{{ACTUAL_CONTENT_VISIBILITY_AND_ACCESS_RULES}}**.

[[REVIEW REQUIRED: Confirm who can view submitted content, whether it is public, whether uploads contain personal data, and how/when it can be removed.]]
[[END IF]]

[[IF SERVER_LOGS_OR_DEVICE_TELEMETRY_ARE_VERIFIED]]
### Technical and usage information

When the Service is used, **{{VERIFIED_INFRASTRUCTURE_AND_VENDORS}}** process **{{VERIFIED_IP_DEVICE_LOG_AND_USAGE_FIELDS}}** for **{{VERIFIED_TECHNICAL_PURPOSES}}**.

[[REVIEW REQUIRED: Hosting/CDN logs may exist even when the site's JavaScript has no analytics. Verify processors' practices and avoid claiming all IP addresses are anonymized without proof.]]
[[END IF]]

[[IF PAYMENT_DATA_IS_PROCESSED]]
### Purchases and billing information

Purchases are handled through **{{VERIFIED_PAYMENT_PROVIDER}}**, acting as **{{VERIFIED_PROVIDER_ROLE_IF_KNOWN}}**. We receive or store **{{ACTUAL_BILLING_RECORDS_WE_PROCESS}}** for **{{PURCHASE_PROCESSING_PURPOSES}}**.

[[REVIEW REQUIRED: Do not claim to store full card numbers or security codes unless the operator actually does. Conversely, do not claim no payment information is processed merely because checkout is third-party-hosted.]]
[[END IF]]

[[IF INFORMATION_IS_RECEIVED_FROM_OTHER_SOURCES]]
### Information from other sources

We receive **{{ACTUAL_FIELDS_RECEIVED}}** from **{{VERIFIED_SOURCE}}** to **{{PURPOSE}}**.
[[END IF]]

[[IF SENSITIVE_INFORMATION_IS_PROCESSED]]
### Sensitive information

We process **{{CONFIRMED_CATEGORIES}}** only for **{{CONFIRMED_PURPOSES_AND_RELEVANT_CONDITIONS}}**.

[[REVIEW REQUIRED: Sensitive and special-category definitions differ by law. Never assert "we do not process sensitive data" solely because obvious fields are absent; examine free-text submissions and uploads.]]
[[END IF]]

## How and why we use information

We process the categories of information above for the purposes actually identified in our data inventory, including **{{VERIFIED_PURPOSE_SUMMARY}}**. We do not use all categories of information for all purposes.

[[IF APPLICABLE_LAW_REQUIRES_LAWFUL_BASE_DISCLOSURE]]
### Legal basis for processing

The lawful bases we rely on for each applicable processing activity are described here:

{{VERIFIED_PURPOSE_TO_LAWFUL_BASIS_MATRIX}}

[[REVIEW REQUIRED: Have the operator or qualified reviewer select and validate legal bases by processing activity and applicable jurisdiction. Do not automatically assign "consent" or "legitimate interests" to every purpose.]]
[[END IF]]

[[IF AUTOMATED_DECISION_MAKING_OR_AI_DATA_PROCESSING_REQUIRES_DISCLOSURE]]
### AI and automated processing

{{CONFIRMED_AI_FEATURES_PURPOSES_DATA_RECIPIENTS_AND_USER_IMPACT}}

[[REVIEW REQUIRED: Verify model providers, prompt/output handling, storage, training/retention terms, and whether a legally significant automated decision is made.]]
[[END IF]]

## Who receives information

We disclose personal information only as described below, and as otherwise required or permitted by applicable law:

{{VERIFIED_RECIPIENT_AND_PURPOSE_TABLE}}

*Populate with: Recipient/service | Category of information | Purpose | Role, where established. Name actual vendors when appropriate; do not paste a generic list of ad networks, social platforms, finance providers and government bodies.*

[[IF PERSONAL_INFORMATION_IS_PUBLIC_TO_OTHER_USERS]]
Information you choose to publish through **{{ACTUAL_PUBLIC_FEATURE}}** may be visible to **{{VERIFIED_AUDIENCE}}**. **{{ACTUAL_VISIBILITY_CONTROLS_OR_LIMITS}}**.
[[END IF]]

[[IF BUSINESS_TRANSFER_OR_LAWFUL_DISCLOSURE_CLAUSE_IS_APPROPRIATE]]
Information may also be disclosed where legally required or as part of an actual business reorganization, subject to applicable obligations.
[[END IF]]

## Where information is processed

Personal information may be stored or processed in **{{VERIFIED_COUNTRIES_OR_REGIONS_BY_PROVIDER_AND_SYSTEM}}**.

[[IF CROSS_BORDER_TRANSFER_RULES_APPLY]]
Where cross-border data-transfer laws apply, **{{ACTUAL_CONFIRMED_TRANSFER_MECHANISM_AND_SCOPE}}**.

[[REVIEW REQUIRED: Do not claim Standard Contractual Clauses, adequacy decisions, Binding Corporate Rules, certifications or other arrangements unless they really exist and apply to these data flows. Verify current legal validity with official sources.]]
[[END IF]]

[[REVIEW REQUIRED: If reliable location information is not yet available, request it from operators/processors rather than inventing country names.]]

## How long information is kept

We keep personal information according to **{{VERIFIED_RETENTION_RULES_BY_DATA_CATEGORY}}**, taking account of its purposes and applicable obligations.

{{VERIFIED_RETENTION_AND_DELETION_TABLE}}

*Populate with: Data category | Normal retention or decision rule | What happens on account closure/deletion request | Backup/processor exception, if verified.*

[[REVIEW REQUIRED: A disabled account is not the same as erased personal data. Do not promise a number of days or immediate removal unless implemented and confirmed, including logs, backups and vendors.]]

## Cookies and similar technologies

{{ACCURATE_SHORT_SUMMARY_OF_COOKIES_LOCAL_STORAGE_PIXELS_AND_OTHER_TRACKING}}

[[IF SEPARATE_COOKIE_POLICY_IS_JUSTIFIED_AND_EXISTS]]
Read our **[Cookie Policy]({{VERIFIED_COOKIE_POLICY_URL}})** for the technologies actually used and any relevant choices.
[[END IF]]

[[IF RELEVANT_COOKIE_OR_TRACKING_CONTROLS_EXIST]]
Manage optional technologies through **{{REAL_WORKING_CONSENT_OR_SETTINGS_CONTROL}}**. The available controls depend on the technologies used and applicable law.
[[END IF]]

## How we protect information

We use **{{VERIFIED_SECURITY_MEASURES_STATED_AT_APPROPRIATE_LEVEL}}** to reduce risks to personal information. No online service can guarantee complete security.

[[REVIEW REQUIRED: Only describe specific encryption, certifications, audits, employee access controls or incident procedures when supported by evidence. Avoid exposing secrets or security details that create unnecessary risk.]]

## Your choices and privacy rights

You may use **{{VERIFIED_ACCESS_CORRECTION_EXPORT_DELETION_AND_OPT_OUT_CHANNELS}}** to ask questions or request action concerning your information. We will respond in accordance with applicable law and the scope of the request.

[[IF MARKETING_MESSAGES_ARE_ACTUALLY_SENT]]
### Marketing preferences

You may stop receiving promotional messages using **{{WORKING_MARKETING_UNSUBSCRIBE_METHOD}}**. We may still send necessary service-related messages where permitted.
[[END IF]]

[[IF JURISDICTION_SPECIFIC_PRIVACY_RIGHTS_APPLY]]
### Additional rights for certain locations

{{ACCURATE_JURISDICTION_SPECIFIC_RIGHTS_AND_COMPLAINT_DETAILS}}

[[REVIEW REQUIRED: Determine whether EU/UK, UAE, US state, Canadian or other laws actually apply; include applicable requirements, exceptions, verification and appeal processes. Do not copy static statutory response deadlines without checking current rules.]]
[[END IF]]

## Children and younger users

{{OWNER_CONFIRMED_AUDIENCE_ELIGIBILITY_CHILDREN_DATA_HANDLING_AND_SAFEGUARDS}}

[[REVIEW REQUIRED: Do not default to "18+", "13+", parental consent or "no children's data" based solely on a generic template. Verify actual intended audience, feature access and relevant child-data rules.]]

## Changes to this Policy

We may update this Policy to reflect changes to the Service or applicable requirements. The date at the top reflects the version published. **{{ACTUAL_MATERIAL_CHANGE_NOTIFICATION_PROCESS_IF_ANY_OR_REQUIRED}}**.

## Contact us

For privacy requests and questions, contact **{{VERIFIED_PRIVACY_CONTACT_METHOD}}**.

[[IF A_POSTAL_ADDRESS_OR_FORMAL_CONTACT_IS_REQUIRED]]
**{{VERIFIED_LEGAL_OPERATOR}}**

{{VERIFIED_POSTAL_ADDRESS_OR_STATUTORY_CONTACT_INFORMATION}}
[[END IF]]

---

## Publication checks

1. Verify every listed data category and recipient against real code, infrastructure, runtime evidence, and vendor arrangements. Check both pre-consent and post-consent states where applicable.
2. Verify account deletion, data requests, consent changes, marketing opt-outs and links actually work; don't equate UI affordances with fulfilled requests.
3. Make retention, cookies, refunds, Terms and actual site behavior mutually consistent.
4. Confirm jurisdictional applicability before adding specialized sections; use current official references and legal review where appropriate.
5. Remove every template marker or flag the document **DRAFT — REVIEW REQUIRED** if important facts or legal decisions remain unresolved.
6. Do not publish this template's internal instructions as consumer-facing text.
