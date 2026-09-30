---
name: privacy-policy
description: "Use when a site needs a privacy notice, or an existing one must reflect real behavior: it inspects what is collected, by whom, for what, and where it goes, separates supported facts from missing owner facts, and drafts only what evidence supports with clearly marked gaps. Do not use it to paste generic boilerplate, to invent addresses, retention periods, legal bases, or contacts, or to state that the notice makes the site compliant."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "1"
  compliance-domains: "2"
  references: "official-sources"
  companions: "data-flow-mapping,cookie-and-storage-audit,analytics-privacy,third-party-privacy,data-rights,email-compliance,minors-readiness,payments-readiness,policy-consistency,design-system-reconnaissance"
---

# privacy-policy

A privacy policy that does not describe the product is worse than none: it is a false statement. This skill drafts (or repairs) a notice **from evidence**, and refuses to fill gaps with plausible fiction.

## Activate when

- The product collects, stores, or transmits anything personal and there is no notice, an outdated one, or one written for a different product.
- The footer or forms link to a privacy page that does not exist (coordinate with `legal-navigation`).
- Not when a lawyer's finished text exists (compare it with `policy-consistency` instead), and not to certify anything.

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `data-flow-mapping`, `cookie-and-storage-audit`, `analytics-privacy`, `third-party-privacy`, `data-rights`, `email-compliance`, `minors-readiness`, `payments-readiness`, `policy-consistency`, `design-system-reconnaissance`.

## Inspect

1. **Use existing evidence first**: `.readyvibe/context.md` (if present), `data-flow-mapping` (fields, recipients), `cookie-and-storage-audit` (cookies, storage, third parties), `analytics-privacy`, `data-rights` (deletion/export behavior), `email-compliance` (sender, marketing), `minors-readiness`, `payments-readiness`, `third-party-privacy`. If they have not run, run the ones that apply (or follow their entries in the companion methods if not installed); do not guess what the product does.
2. **Build a fact sheet** with an evidence label for every line:

   | Topic | What we know | Source |
   |---|---|---|
   | Who we are | operator name/entity, address, contact | owner-supplied / site footer / **MISSING** |
   | Data collected | fields per form/account/checkout; automatic data (IP, device, cookies) | observed / source |
   | Purposes | why each is collected | documented / inferred / **MISSING** |
   | Recipients | processors, analytics, payments, email, hosting, support | observed / source |
   | Retention | periods or criteria | **usually MISSING** |
   | Legal basis / markets | | **REVIEW REQUIRED** |
   | User rights and how to exercise | contact/mechanism that actually works | observed (`data-rights`) / **MISSING** |
   | Transfers | where vendors process data | **UNKNOWN** unless documented |
   | Children | audience and age handling | `minors-readiness` |
   | Cookies/trackers | inventory | `cookie-and-storage-audit` |
3. **Decide what can be written**: statements you can support with the fact sheet. Everything else becomes a **visible, unmissable placeholder**, e.g. `[[OWNER TO PROVIDE: legal entity name and postal address]]`. Placeholders must fail loudly (an unfinished marker in the rendered page), not read like finished prose.
4. **Structure for the reader**, plain language, headings that match what visitors look for: who we are; what we collect and why; who we share it with; cookies and similar technologies; how long we keep it [gap]; your choices and rights (with the working contact route); children; changes to this notice; how to contact us. Reflect *this* product's actual features, not a full menu of clauses.
5. **Match the site**: reuse the project's page shell and components (`design-system-reconnaissance`), add the page at a stable URL (`/privacy`), and link it from the footer and from every form that collects data.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Every sentence in the notice that states a fact about the product needs a source in the fact sheet. If it does not have one, it is either a placeholder or it is cut.
- Vendor names come from observed requests or code, not from a template list of "typical" vendors.
- Contact points must be real and working: verify the email/form exists (`public-support`).
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Create or update the privacy page and its links; correct statements to match the fact sheet; add data-collection notices near forms where a short pointer helps. Leave the owner's legal text alone: if a lawyer-authored notice exists, produce a **diff of mismatches**, not a rewrite.

## Must not claim

That the notice "complies with GDPR/CCPA/…", "covers all requirements", or "is legally sufficient". Do not invent: legal entity or address, DPO or representative, retention periods, legal bases, transfer safeguards, rights timelines, "we never sell your data" without evidence, age thresholds, or jurisdiction-specific sections. Do not copy another company's policy.

## Verify

- Every observed cookie, vendor, and data field appears in the notice; nothing in the notice contradicts `policy-consistency` results.
- All links resolve (`check-links`); the page renders with the site's styling at desktop and 375px; a footer link and form links exist.
- Placeholders are visible and enumerated in the reply as "the owner must supply: …".

## Escalate

The moment markets, audience, or data types imply specific statutory content (children's data, health, finance, biometric, precise location, employee data, cross-border transfers, automated decisions): mark REVIEW REQUIRED, look up the relevant requirements at an official source, cite them, and say what specifically you could not determine (for example the legal basis, retention, or transfer safeguards). Keep the recommendation proportional: name the specific unresolved fact or risk that warrants it (minors, sensitive data, a regulated domain, cross-border sale, unclear markets, contested wording), and do not tell an ordinary low-risk site to hire a lawyer. A small site that collects an email address and runs one disclosed analytics tool, with facts the owner has confirmed, can be reported as: notice matches observed behavior; owner-only facts listed.

## No change is valid when

Nothing personal is collected, stored, or transmitted (verified, not assumed) and a notice would describe nothing; or an existing notice matches behavior and the owner has legal-reviewed it. Then report "no privacy notice change needed; recheck if forms, accounts, analytics, or email are added".
