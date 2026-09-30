---
name: jurisdiction-applicability
description: "Use when privacy, consent, consumer, or accessibility questions depend on where users and the business are, and you need to record markets and audience from evidence and see whether any reviewed rule source exists for them. It separates declared from inferred markets and marks unresolved applicability as review required. Do not use it to state which laws apply from memory, to pick a jurisdiction for the user, or to invent obligations."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "1"
  launch-checks: "4,6"
---

# jurisdiction-applicability

Most compliance questions are really "where, and for whom?" ReadyVibe does not know your legal exposure and must not pretend to. This skill records what is *known* about markets, and what rule material is *actually available*, so every other skill states its limits honestly.

## Activate when

- `compliance-all` begins, or any specialist needs to decide whether a rule-dependent behavior (consent gating, retention, age, refunds, accessibility duty) matters.
- Markets change: new language, currency, country selector, shipping region, or audience.
- Not to draft legal analysis or select a "primary jurisdiction" for the owner.

## Inspect

1. **Operator location and entity** (DECLARED): footer, terms, invoices, company registration text, contact page. Missing is common: UNKNOWN.
2. **Target markets** (DECLARED > INFERRED): stated countries served; shipping or pricing tables by country; currencies offered; languages and locales; `hreflang`; regional domains or subpaths; cookie/consent language pointing at regions; app store availability notes; docs/roadmap.
3. **Audience presence** (INFERRED, weakest): analytics regions are not visible; do not guess. Traffic data, if the owner provides it, is DECLARED.
4. **Sector and audience triggers** that change the rulebook regardless of geography: minors, health, finance, education, employment, AI features, biometric or precise-location data. Hand these to `regulated-domain-triggers` and `minors-readiness`.
5. **Rule material available in the project.** Look for reviewed rule sources the project or owner supplies (official source snapshots, a counsel memo, a documented review record). ReadyVibe itself ships no reviewed jurisdiction packs. Note for each candidate market whether an authoritative source is captured *and* reviewed. State: **source available and reviewed / source captured, review pending (provisional) / no source (unavailable)**.

Write a compact record in `.readyvibe/context.md` under "Markets":

```
Operator: not stated  [UNKNOWN]
Target markets: not stated; English only; prices in USD  [UNKNOWN market; USD is INFERRED weak signal]
Rule sources: none supplied for this project  [unavailable]
Effect: consent, age, refund, and accessibility applicability = REVIEW REQUIRED. Technical facts are still verified.
```

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Only DECLARED markets are treated as markets. A `.com` domain, a US-dollar price, or an English site is not a jurisdiction.
- Do **not** supply legal requirements from model memory. If no reviewed source exists, say **provisional / source unavailable** and stop at technical facts.
- Multiple plausible regimes is a normal result: list them as candidates for the owner and counsel, not as obligations.

## May change

Only `.readyvibe/context.md` (Markets section). If the owner states markets, record them as DECLARED with the date. Never edit product code or legal text.

## Must not claim

"You are subject to X", "you are exempt from Y", "GDPR applies/doesn't apply", "you only need Z". Never rank obligations or declare something "not required" without a reviewed source and a stated scope.

## Verify

Check that every specialist that used a rule-dependent decision cites the market record and its limits. Check the record was updated after any market-related change (new locale, currency, region).

## Escalate

Always REVIEW REQUIRED when: markets are unstated and the product collects personal data; multiple regimes may apply; the audience includes minors; a regulated sector is involved. Recommend the owner define target markets and obtain qualified legal input, and note that authoritative source records need to be captured and reviewed before rule-dependent claims are made.

## No change is valid when

Markets are already recorded and current. If the owner declines to state markets, keep them UNKNOWN and leave rule-dependent items as review required. That is a valid stable state.
