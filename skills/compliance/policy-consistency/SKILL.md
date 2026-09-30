---
name: policy-consistency
description: "Use when a site already has a privacy page, cookie notice, banner, terms, badges, or marketing claims about data and you need to compare what it says with what the product does: trackers, forms, cookies, storage, deletion, email, third parties. It reports contradictions and omissions as evidence-backed mismatches. Do not use it to rewrite the product to match a template, to certify a policy, or to compare against laws from memory."
license: Apache-2.0
metadata:
  kind: auditor
  launch-checks: "1,3,26"
  compliance-domains: "2"
  references: "official-sources,companion-methods"
---

# policy-consistency

"Privacy policy exists" is worthless if it says "we don't use analytics" while a pixel fires. The highest-value privacy findings are **contradictions between declaration and behavior**.

## Activate when

- Any privacy notice, cookie notice, consent banner text, terms clause, security/GDPR/"privacy-first" badge, or marketing claim about data exists.
- After behavior changes (new vendor, new field, deletion change) or before publishing a new notice.
- Not to write the notice (`privacy-policy`) or observe behavior from scratch (`cookie-and-storage-audit`, `data-flow-mapping`), though you consume their output.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `cookie-and-storage-audit`, `data-flow-mapping`, `data-rights`, `email-compliance`, `privacy-policy`.

## Inspect

1. **Extract declarations** from the notice, banner, footers, forms ("we'll never spam you"), FAQ, terms, badges, and marketing copy. Make a list of *checkable statements*, each with location and exact wording: e.g. "We do not use analytics." / "Analytics loads only after consent." / "We delete your data within 30 days." / "We don't sell your data." / "We collect only your email." / "Unsubscribe anytime." / "SOC 2 / GDPR compliant." / "Data stored in the EU."
2. **Collect behavior** for each: inventory of cookies, storage, third parties, and timing (`cookie-and-storage-audit`); data fields and recipients (`data-flow-mapping`); deletion code path (`data-rights`); email suppression path (`email-compliance`); the retention or cron code, if any.
3. **Compare, statement by statement.** Classify each: **matches** (behavior corroborates), **contradicted** (behavior shows the opposite), **incomplete** (behavior exists that the notice omits), **unverifiable** (cannot be checked; say why), **overclaims** (a compliance or security assertion no evidence can support: "fully GDPR compliant", "bank-level security", "your data is 100% private").
4. **Reverse check.** For each observed vendor, field, cookie, and recipient, ask "is it disclosed?" Omissions are the mirror of contradictions.
5. **Internal consistency.** Do the policy, banner, and terms disagree with each other (contact address, retention, controller name, dates)? Is the effective date sane? Do all links to the policy resolve?

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A declaration is DECLARED. A contradiction needs **behavior** (OBSERVED or SOURCE-INDICATED) that conflicts with it. Cite both.
- Source-only contradictions are SOURCE-INDICATED: "policy says X; code does Y (runtime not exercised)". Do not upgrade to observed.
- "Doesn't say" is not "says no". Omission findings are MEDIUM by default; contradictions about tracking, deletion, or selling data are HIGH when observed.
- The policy's legal adequacy is out of scope. You compare **statements to behavior**.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Options, in order of preference; ask the owner which direction is intended when both are plausible:

- **Fix the behavior** so it matches a promise the owner wants to keep (gate the tracker; actually delete).
- **Fix the statement** so it matches an observed fact the owner accepts (name the analytics vendor; remove "we don't use analytics").
- Remove **overclaims** that no evidence supports (compliance badges, "military-grade").
- Never insert new promises, retention periods, legal bases, or rights language; those come from the owner.

## Must not claim

"Consistent" as a general result: say "no contradictions found among the N statements checked against the behavior exercised". "Compliant", "adequate", "satisfies the law". A clean comparison is silent on legal sufficiency.

## Verify

Re-run the comparison after changes; each previously contradicted statement should now be matched or removed, and no new omission introduced by the change (a removed vendor may make the notice overstate; an added one may make it understate).

## Escalate

Contradictions about sale/sharing of data, children's data, sensitive data, or deletion promises; overclaims of certifications (SOC 2, ISO, HIPAA, PCI) that the owner cannot show; any statement whose truth depends on a contract or vendor setting you cannot see.

## No change is valid when

All checkable statements match behavior, or no declarations exist about the area. The absence of a notice is `privacy-policy`'s concern, not a mismatch.
