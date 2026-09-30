---
name: regulated-domain-triggers
description: "Use when starting a launch review, and again whenever features change, to detect whether a product touches a regulated or high-risk domain: health, finance and payments, education, children, legal or professional advice, employment, insurance, crypto, gambling, alcohol or cannabis, biometrics, precise location, or automated decisions. It stops ordinary web-compliance assumptions and routes to human specialist review. Do not use it to interpret those regimes or to clear a product as unregulated."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "11"
  launch-checks: "6"
  references: "official-sources"
---

# regulated-domain-triggers

General web compliance (a privacy page, a consent banner, a sitemap) does not cover a health-data product, a lender, or a children's game. This skill is a **tripwire**: it notices when the product has moved out of ordinary territory and says so *before* anyone reassures the owner with a checklist.

## Activate when

- Recon runs on a new project, or product scope changes (new feature, new data type, new audience).
- Product copy, fields, integrations, or categories suggest any domain below.
- Not to explain those regimes or to say they don't apply.

## Inspect

Search copy, routes, schemas, form fields, dependencies, integrations, and imagery for signals. **One signal is enough to escalate**; absence of signals is *not* proof of absence.

| Domain | Signals |
|---|---|
| Health / wellness | symptoms, diagnoses, medication, therapy, fitness data, wearable sync, patient/clinic/appointment, HIPAA-like words, mental-health, fertility, allergy |
| Finance / payments | lending, credit, investing, trading, brokerage, banking, KYC/AML, bank-account linking (Plaid), payouts/marketplace money movement, tax, insurance quotes, invoicing with custody of funds |
| Children / education | ages under 18, school, students, teachers, grades, classroom, parent portal, kids' content or games, edtech LMS |
| Legal / professional advice | legal, medical, tax, or financial advice, contracts as a service, "attorney", "licensed" claims |
| Employment / HR | hiring, screening, résumés, performance, background checks, gig workers |
| Crypto / gambling / restricted goods | tokens, wallets, exchanges, staking; betting, casino, lottery; alcohol, tobacco/vape, cannabis, weapons, adult content |
| Sensitive data | biometrics, face/voice, precise location, government IDs, race/ethnicity, religion, sexual orientation, union status, criminal records |
| Automated decisions / AI | scoring, ranking people, eligibility decisions, AI advice, AI chat with users (`ai-features-readiness`), synthetic media |
| Public-sector / critical | government customers, procurement forms, safety-critical, elections |

Record: domain, signal (file/route/copy), and what the product does with it.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A signal in copy is OBSERVED text. Whether the *regime* applies is REVIEW REQUIRED, always.
- "Wellness journal" with symptom tracking is health-adjacent; do not decide where the line is.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Only `.readyvibe/context.md` ("Regulated-domain flags"). Do not change product code. Do not soften copy to dodge a category ("we're not a bank") since that is a legal and honesty question for the owner.

## Must not claim

"Not regulated", "outside HIPAA/GLBA/FERPA/COPPA/PSD2/MiCA/…", "no license needed", or that ordinary privacy/terms/cookie work is sufficient here. Never advise on licensing or regime scope.

## Verify

Each flag cites its signal and the pages or files where it appears. Re-run when features change. Ensure other specialists are told: legal-page drafting (`privacy-policy`, `terms-of-service`), analytics/replay (`analytics-privacy`), and `consumer-protection-readiness` must treat this surface as REVIEW REQUIRED.

## Escalate

Every flag. Tell the owner plainly: "This product appears to touch <domain>. Ordinary launch checks do not cover the rules that may apply. Obtain qualified legal/compliance review before launch. I have not assessed those rules." Stop ordinary compliance work on the flagged surface (do not generate a generic policy for it) and continue technical work that is safe regardless (broken links, metadata, headers).

## No change is valid when

No signals were found in the searched places: record "no regulated-domain signals found in <places>; recheck when features, data types, or audience change." This is not clearance.
