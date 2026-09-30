---
name: compliance-all
description: "Use when a site or app needs a privacy, consent, communications, age, data-rights, commerce, or legal-disclosure review, or when someone asks \"are we GDPR/CCPA compliant?\". It works out which of the 12 compliance domains apply from evidence, activates only those specialists, verifies behavior against disclosures, and states what needs legal review. Do not use it to force a cookie banner or a policy onto a site that does not need one, to run every legal skill, or to certify compliance."
license: Apache-2.0
metadata:
  kind: bundle
  helpers: "observe-runtime,inventory-data-model"
  launch-checks: "1-8"
  compliance-domains: "1-12"
  references: "official-sources"
  companions: "jurisdiction-applicability,site-reconnaissance,cookie-and-storage-audit,data-flow-mapping,policy-consistency,privacy-policy,terms-of-service,privacy-readiness,consent-management,analytics-privacy,third-party-privacy,email-compliance,minors-readiness,data-rights,consumer-protection-readiness,subscription-readiness,payments-readiness,wcag-readiness,web-security,security-headers,deployment-cleanup,regulated-domain-triggers,ai-features-readiness,legal-identity-notices,public-support,legal-navigation"
---

# compliance-all

Compliance is a layer of **12 applicability-driven domains** ([references/compliance-domains.md](references/compliance-domains.md)), not one checkbox and not "run every legal skill". This skill decides which domains are live for *this* product, gathers evidence, verifies behavior against what the product says, fixes what is technical and safe, and marks everything else as review required.

It must never produce "GDPR ✅", "CCPA ✅", or "ADA ✅".

## Activate when

- Privacy, cookies, tracking, consent, newsletters, unsubscribe, age, deletion, subscriptions/refunds, or legal pages are in scope.
- `launch-all` routes here for launch checks 1–8.
- The user says "make us compliant". Reframe it (see Escalate) and proceed with what can be inspected.
- Not for pure SEO, layout, or performance work.

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. The lanes this bundle can activate are companions because it promises to run them when they apply: consider them all, activate only the ones that fit. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `jurisdiction-applicability`, `site-reconnaissance`, `cookie-and-storage-audit`, `data-flow-mapping`, `policy-consistency`, `privacy-policy`, `terms-of-service`, `privacy-readiness`, `consent-management`, `analytics-privacy`, `third-party-privacy`, `email-compliance`, `minors-readiness`, `data-rights`, `consumer-protection-readiness`, `subscription-readiness`, `payments-readiness`, `wcag-readiness`, `web-security`, `security-headers`, `deployment-cleanup`, `regulated-domain-triggers`, `ai-features-readiness`, `legal-identity-notices`, `public-support`, `legal-navigation`.

## Route

Start with domain 1, because it gates everything else.

1. **Establish context** (reuse `.readyvibe/context.md` if present; otherwise `site-reconnaissance`): what personal data flows, what loads, who the audience is, what markets are *documented*.
2. **Run `jurisdiction-applicability`** to record markets as DECLARED / INFERRED / UNKNOWN, and which official sources apply to look up (`references/official-sources.md`). A source you could not consult means UNKNOWN / REVIEW REQUIRED; technical checks still proceed.
3. **Take an inventory once.** Runtime: `node scripts/observe-runtime.mjs --url <site> --block-third-party` (paths relative to this skill's folder) records cookies, storage, and third parties before any interaction; extend it with a steps file for reject/accept (this is the `cookie-and-storage-audit` method). Static: `node scripts/inventory-data-model.mjs --root .` lists stored personal data, and the forms and recipients you find complete the `data-flow-mapping` picture. Every later domain reuses this inventory.
4. **Select domains** from the table. Activate a domain only when its "Applies when" evidence is present, and record the reason for every domain you do not activate.

| Domain | Specialist(s) | Skip when (record the observed reason) |
|---|---|---|
| 1 Jurisdiction / market | jurisdiction-applicability | never skipped; it is cheap |
| 2 Disclosure vs behavior | policy-consistency, privacy-policy, data-flow-mapping, privacy-readiness | nothing personal is collected, stored, or sent |
| 3 Cookies / trackers / consent | cookie-and-storage-audit, consent-management, analytics-privacy | no cookies, storage, or third-party trackers observed or in source |
| 4 Marketing communications | email-compliance | no email provider, newsletter form, or send route |
| 5 Age / minors | minors-readiness | clearly adult/B2B, no age fields, no child signals |
| 6 Privacy rights | data-rights | no accounts and no stored personal data |
| 7 Consumer protection | consumer-protection-readiness, subscription-readiness, payments-readiness | no prices, checkout, or billing |
| 8 Accessibility obligations | wcag-readiness | never fully skipped for a public product; legal weight is always REVIEW REQUIRED |
| 9 Vendors / data sharing | third-party-privacy | no third-party hosts or SDKs |
| 10 Security / production | web-security, security-headers, deployment-cleanup | never skipped once deployed |
| 11 Regulated-domain triggers | regulated-domain-triggers (plus ai-features-readiness when models are called) | product language, fields, and features touch no regulated domain |
| 12 Legal identity / IP / notices | legal-identity-notices, public-support, legal-navigation | never skipped for a public product |
| Legal pages (launch checks 1 and 2) | privacy-policy, terms-of-service | privacy notice: nothing personal is collected, stored, or sent; terms: no accounts, user content, purchases, or commitments (see each skill's "No change is valid" section) |

Do not invoke a specialist merely to find out that nothing exists. If recon already shows the surface is absent, record "not currently applicable, because …, recheck if …".

## Coordinate

Common cross-domain facts are established once and shared, not re-derived by each specialist:

- **Inventory**: cookies, storage keys, third-party hosts, vendors, forms and their fields, stored personal data.
- **Declarations**: what the privacy page, banner, terms, badges, and marketing copy claim.
- **Behavior**: what runtime showed, at which moment (load, after reject, after accept, after form submit).

Then compare declarations to behavior (domain 2). The high-value findings are contradictions, not absences.

## Evidence discipline

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Source-indicated vendor is not runtime-proven loading. Say "integration present; pre-consent gating not proven" and route to runtime proof.
- A requirement is *identified* from an official source you read during this run (cite it and the access date), not remembered. If you cannot consult one for a market, say **source not consulted / UNKNOWN** and report only technical facts.
- A notice that mentions X is not proof that behavior matches X.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Technical implementation where the requirement and intended behavior are known: gating a script behind an existing consent state, wiring an unsubscribe route to suppression, making a delete action actually delete or anonymize, correcting disclosure text **that states a fact you observed**, adding a link to an existing page. Each specialist defines its own limits.

Changes need the owner's facts, not yours: legal entity, address, contact email, retention periods, legal bases, governing law, age thresholds, refund terms. Ask or leave a marked gap.

## Must not claim

"Compliant", "fully/legally compliant", "GDPR/CCPA/ADA/COPPA compliant", "this policy satisfies all laws", "no consent needed", or "consent is required" without an official source you read this run and a stated scope. Do not treat a passing scan as a legal conclusion. Prefer: requirement detected; implementation appears inconsistent; behavior verified; disclosure mismatch; source not consulted; review required; legal review recommended.

## Verify

Verification for this bundle is behavioral:

- Re-run the runtime pass after any change: load, reject, accept, withdraw/reset, reload. Confirm what fires at each moment.
- Submit forms with planted test data on a local/staging origin (`observe-runtime --canary`) and confirm where it goes.
- After a deletion or unsubscribe change, trace the stored state: confirm the record is gone or suppressed, not just hidden.
- Re-compare declarations to behavior. A fixed behavior may make the old notice wrong, and vice versa.

## Escalate

- **Any legal-applicability question** (does this rule apply, what must the wording be, what is the retention limit): REVIEW REQUIRED. State what you verified technically and what remains.
- **Regulated-domain or child-directed signals**: hand to `regulated-domain-triggers` / `minors-readiness`; stop ordinary compliance work for that surface.
- **Exposed credentials or possible personal-data exposure**: report immediately; needs owner action beyond code.
- **Requests that create theater**: "Just add a cookie banner" when nothing needs gating: show the observed evidence (no non-essential trackers before interaction) and decline to add a decorative banner, and tell them what would change the answer. "Make us GDPR compliant": say which technical facts were checked, list the open review boundary, and do not say the outcome. "Generate a privacy policy" with key facts missing: draft only what evidence supports, mark the rest as unresolved, and list what the owner must supply.

## No change is valid when

The domain does not apply on the evidence, or the behavior already matches the disclosure, or the only available "fix" would invent a fact or add a control with nothing behind it. Say so, with the recheck trigger.

## Output

One block per activated domain in the shape shown in the references file: status (not currently applicable / behavior verified / review required / applicable concern / unknown), then Observed, Unknown, Next. Then the usual launch report sections if called from `launch-all`.
