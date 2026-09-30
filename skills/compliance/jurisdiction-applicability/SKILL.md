---
name: jurisdiction-applicability
description: "Use when privacy, consent, consumer, or accessibility questions depend on where users and the business are, and you need to record markets and audience from evidence and see which official sources to consult for them. It separates declared from inferred markets and marks unresolved applicability as review required. Do not use it to state which laws apply from memory, to pick a jurisdiction for the user, or to invent obligations."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "1"
  launch-checks: "4,6"
  references: "official-sources,companion-methods"
---

# jurisdiction-applicability

Most compliance questions are really "where, and for whom?" ReadyVibe does not know your legal exposure and must not pretend to. This skill records what is *known* about markets, and what rule material is *actually available*, so every other skill states its limits honestly.

## Activate when

- `compliance-all` begins, or any specialist needs to decide whether a jurisdiction-dependent behavior (consent gating, retention, age, refunds, accessibility duty) matters.
- Markets change: new language, currency, country selector, shipping region, or audience.
- Not to draft legal analysis or select a "primary jurisdiction" for the owner.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `compliance-all`, `minors-readiness`, `regulated-domain-triggers`.

## Inspect

1. **Operator location and entity** (DECLARED): footer, terms, invoices, company registration text, contact page. Missing is common: UNKNOWN.
2. **Target markets** (DECLARED > INFERRED): stated countries served; shipping or pricing tables by country; currencies offered; languages and locales; `hreflang`; regional domains or subpaths; cookie/consent language pointing at regions; app store availability notes; docs/roadmap.
3. **Audience presence** (INFERRED, weakest): analytics regions are not visible; do not guess. Traffic data, if the owner provides it, is DECLARED.
4. **Sector and audience triggers** that change the rulebook regardless of geography: minors, health, finance, education, employment, AI features, biometric or precise-location data. Hand these to `regulated-domain-triggers` and `minors-readiness`.
5. **Rule material, looked up live.** ReadyVibe carries no legal database. For each declared market, find its regulator and legislation portal from `references/official-sources.md` and read the current text or guidance while you run. Record source name, URL, and access date, or write "not consulted". Do not summarize obligations beyond what you read. Also use anything the owner supplies (a counsel memo). State: **source available and reviewed / source captured, review pending (provisional) / no source (unavailable)**.

Write a compact record in `.readyvibe/context.md` under "Markets":

```
Operator: not stated  [UNKNOWN]
Target markets: not stated; English only; prices in USD  [UNKNOWN market; USD is INFERRED weak signal]
Rule sources: not consulted this run  [UNKNOWN]
Effect: consent, age, refund, and accessibility applicability = REVIEW REQUIRED. Technical facts are still verified.
```

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Only DECLARED markets are treated as markets. A `.com` domain, a US-dollar price, or an English site is not a jurisdiction.
- Do **not** supply legal requirements from model memory. If you cannot consult an official source, say **source not consulted / UNKNOWN** and stop at technical facts.
- Multiple plausible regimes is a normal result: list them as candidates for the owner and counsel, not as obligations.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Only `.readyvibe/context.md` (Markets section). If the owner states markets, record them as DECLARED with the date. Never edit product code or legal text.

## Must not claim

"You are subject to X", "you are exempt from Y", "GDPR applies/doesn't apply", "you only need Z". Never rank obligations or declare something "not required" without an official source you read this run and a stated scope.

## Verify

Check that every specialist that used a jurisdiction-dependent decision cites the market record and its limits. Check the record was updated after any market-related change (new locale, currency, region).

## Escalate

Always REVIEW REQUIRED when: markets are unstated and the product collects personal data; multiple regimes may apply; the audience includes minors; a regulated sector is involved. Recommend the owner define target markets and obtain qualified legal input, and note that any jurisdiction-dependent claim needs the current official text, read and cited.

## No change is valid when

Markets are already recorded and current. If the owner declines to state markets, keep them UNKNOWN and leave jurisdiction-dependent items as review required. That is a valid stable state.
