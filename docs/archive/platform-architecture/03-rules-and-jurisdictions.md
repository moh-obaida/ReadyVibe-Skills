# Part III — Rules and Jurisdictions

> **SUPERSEDED / HISTORICAL DESIGN.** This describes an earlier CLI/engine platform architecture that was dropped. The current model is [`docs/current-model.md`](../../current-model.md).

## 8. Rule Engine

### 8.1 Four separated concerns (Decision D-05)

The engine keeps four things apart. Mixing them is how compliance tools end up saying "GDPR: FAIL" for a missing favicon.

```text
 DETECTION                 EVALUATION                    INTERPRETATION                  ACTION
 ─────────                 ──────────                    ──────────────                  ──────
 probes + detectors  ──►   CONTROLS                ◄──── OBLIGATIONS (in packs)          REMEDIATION RECIPES
 produce FACTS             "no non-essential              "EU ePrivacy Art 5(3):          capability operations
                           network activity before         storage/access needs           via adapters
                           consent"                        consent unless strictly
                           → PASS/FAIL/… per scope         necessary"                    VERIFICATION PROBES
                                                           applicability, authority,     re-run after change
                                                           severity, review triggers
```

- **Detectors** turn evidence into facts. They are code in the engine, deterministic, and unit-tested against fixtures.
- **Controls** are framework-independent checks over facts. A control answers "is this true of the site?" and knows nothing about law.
- **Obligations** live in packs (legal, regulatory, standards, guidance). An obligation says which controls satisfy it, when it applies, where it comes from, and what uncertainty remains.
- **Remediation recipes** and **verification probes** are attached to controls, because fixing and proving are technical acts. They are expressed as capability operations so they stay framework-independent (§28.3).

**Why controls and obligations are separate.** A pre-consent tracking leak is one technical fact. It may matter under the EU ePrivacy rules, UK PECR, and a California "sharing" analysis at the same time. Evaluating it once and attaching three obligations yields **one finding** with three citations, not three duplicate findings with three slightly different remediation instructions. It also means a new jurisdiction pack usually adds only obligations mapped to existing controls, with no new code.

### 8.2 Rule categories

Every obligation has exactly one category. A control with no obligation mapped to it takes the category declared on the control itself (typically `LAUNCH_QUALITY`, `TRUST_CONSISTENCY`, or `TECHNICAL_SECURITY`).

| Category | Meaning | Can produce `LEGAL_REVIEW_REQUIRED` | Blocks launch by default |
| --- | --- | --- | --- |
| `LEGAL_REQUIREMENT` | Derived from statute or regulation text | Yes | Yes, at severity ≥ high |
| `REGULATORY_GUIDANCE` | Derived from official regulator guidance interpreting law | Yes | Yes, at severity ≥ high |
| `PLATFORM_POLICY` | Rules of platforms the site depends on (bulk-sender email requirements, search-engine spam policies, payment-provider terms) | No | No |
| `TECHNICAL_SECURITY` | OWASP ASVS-aligned or equivalent security verification | No | Yes, at severity ≥ high |
| `ACCESSIBILITY_STANDARD` | WCAG success criteria at the configured target | No (unless a legal pack such as the EAA maps to it, in which case that obligation carries the legal category) | Yes, at severity ≥ high |
| `SEARCH_BEST_PRACTICE` | Search-engine technical guidance | No | Only for specific controls (for example a production-wide `noindex`) |
| `PERFORMANCE_BEST_PRACTICE` | Core Web Vitals and loading guidance | No | No |
| `LAUNCH_QUALITY` | Polish that affects trust and professionalism (favicon, identity, 404 design, share previews) | No | No, except template residue on legal pages |
| `TRUST_CONSISTENCY` | The site's statements must match its behavior | No by itself, but a mapped legal obligation (for example deceptive-practice rules) can add it | Yes when the contradiction concerns data handling, rights, security, or pricing |
| `OWNER_POLICY` | Rules the owner declared for their own project (for example "no third-party fonts") | No | As configured |

The finding's displayed category is the highest-ranked category among its mapped obligations, in the order of the table. All categories are listed on the finding.

### 8.3 Status semantics

These definitions are normative. Implementations and skills MUST NOT use the statuses in any other sense.

| Status | Definition | Minimum evidence |
| --- | --- | --- |
| `PASS` | The control is applicable and its evaluation shows the requirement is met in the evaluated scope, with evidence at or above the control's `requiredConfidence` (default `CONFIRMED` for runtime controls, `HIGH` for static ones). | ≥1 evidence meeting `requiredConfidence` |
| `FAIL` | The control is applicable (applicability `TRUE`, from facts at `HIGH` or better) and evidence at `HIGH` or better shows the requirement is not met. | ≥1 evidence at ≥ `HIGH` |
| `WARNING` | One of: (a) a SHOULD-level or best-practice expectation is unmet; (b) a suspected violation supported only by `MEDIUM` evidence (`finding.suspected = true`); (c) a `PASS` with a material caveat recorded in `caveats`. | ≥1 evidence |
| `NOT_APPLICABLE` | The applicability predicate evaluates to `FALSE`, supported by owner-asserted facts or by an `ABSENT` capability with `SUFFICIENT` coverage. | Coverage record or owner statement |
| `LEGAL_REVIEW_REQUIRED` | Applicability or evaluation depends on a legal judgment the system cannot responsibly make: an interpretive question flagged by the obligation's `legalReviewTriggers`, an unresolved threshold that needs legal analysis, conflicting authorities, a "reasonableness" standard, or a legal document or translation that must be professionally reviewed before publication. It always carries a `legalReview` block with a reason code, the specific question for counsel, and the facts gathered. | Facts gathered so far |
| `UNKNOWN` | Technical insufficiency: a probe could not run, coverage is insufficient, a required owner fact is missing, evidence is flaky, or a skill failed. It always carries `unknownReason` and, where possible, how to resolve it. | None required; the reason is required |

**`LEGAL_REVIEW_REQUIRED` is a successful outcome.** It means the system did its job: it gathered the facts, recognized the limit of automation, and framed the question. The report presents these items as work for counsel, not as system failures.

**`UNKNOWN` is not compliance.** It never counts toward readiness. An `UNKNOWN` on a blocking control prevents `TECHNICALLY_READY` (§30.4).

**Evaluation procedure (per control, per scope):**

```text
0. Resolve obligations for this control as of evaluatedAsOf (§8.12, §9.10):
     temporal state NOT_YET_EFFECTIVE or ENDED     → obligation excluded (listed as upcoming / ended)
     temporal state UNDETERMINED                   → obligation kept, but it cannot contribute a FAIL;
                                                     it yields UNKNOWN(OWNER_INPUT_PENDING) or
                                                     LEGAL_REVIEW_REQUIRED(TEMPORAL_UNDETERMINED)
     temporal state EFFECTIVE_PRE_COMPLIANCE       → obligation kept; its FAIL is reported as
                                                     WARNING(caveat = COMPLIANCE_PERIOD)
     review state PROVISIONAL                      → obligation kept; caveat PROVISIONAL_RULE
     review state REVIEW_REQUIRED                  → obligation kept; legal-category obligations
                                                     cannot contribute to PASS (see step 4)
1. Evaluate applicability (three-valued; §8.4) using control predicate AND the predicates
   of every active obligation mapped to the control.
     FALSE   → NOT_APPLICABLE only if every FALSE rests on OWNER facts or SUFFICIENT coverage;
               otherwise UNKNOWN(reason = INSUFFICIENT_COVERAGE)
     UNKNOWN → if the unknown input is a legal-judgment input  → LEGAL_REVIEW_REQUIRED
               if it is an owner fact with an open question     → UNKNOWN(reason = OWNER_INPUT_PENDING)
               otherwise                                       → UNKNOWN(reason = MISSING_FACTS)
     TRUE    → continue
2. Run the evaluator. It returns MET | NOT_MET | PARTIAL | INDETERMINATE plus evidence.
3. Map:
     MET           and evidence ≥ requiredConfidence → PASS
     MET           but evidence  < requiredConfidence → WARNING(caveat = LOW_CONFIDENCE_PASS)
     NOT_MET       and evidence ≥ HIGH               → FAIL
     NOT_MET       and evidence = MEDIUM             → WARNING(suspected = true)
     NOT_MET       and evidence = LOW                → UNKNOWN(reason = WEAK_SIGNAL)  + investigation note
     PARTIAL                                         → WARNING, or FAIL if the control declares partial = fail
     INDETERMINATE                                   → UNKNOWN(reason = EVALUATOR_INDETERMINATE)
4. Apply obligation-level overrides:
     any mapped active obligation whose legalReviewTriggers match the facts
       → status becomes LEGAL_REVIEW_REQUIRED if it would otherwise be PASS, WARNING, or UNKNOWN;
         a FAIL stays FAIL and gains a legalReview block
         (a confirmed technical failure is not softened by legal ambiguity)
     candidate (unconfirmed) jurisdiction obligations never raise a status to FAIL;
       they add a conditional note, or produce LEGAL_REVIEW_REQUIRED(reason = SCOPE_UNCONFIRMED)
       when the control itself would otherwise be NOT_APPLICABLE or PASS for confirmed packs
     a legal-category obligation in review state REVIEW_REQUIRED turns a would-be PASS into
       LEGAL_REVIEW_REQUIRED(reason = SOURCE_CHANGED); a FAIL stays FAIL with caveat RULE_REVIEW_REQUIRED
5. Attach dispositions from suppressions and reviews (§30.8). These never change the status.
```

**Aggregation for summaries.** A domain summary shows counts per status and a "worst status" using the order `FAIL > UNKNOWN (blocking) > LEGAL_REVIEW_REQUIRED > WARNING > UNKNOWN (non-blocking) > PASS > NOT_APPLICABLE`. The worst status is a navigation aid, not a verdict.

### 8.4 Applicability logic (Decision D-06)

Predicates are evaluated with **Kleene three-valued logic**: `TRUE`, `FALSE`, `UNKNOWN`.

| `a` | `b` | `a AND b` | `a OR b` |
| --- | --- | --- | --- |
| T | U | U | T |
| F | U | F | U |
| U | U | U | U |

`NOT U = U`. A fact query over a predicate with no winning fact, or whose winning fact is below the predicate's `minConfidence`, returns `UNKNOWN`.

**Why:** in two-valued logic a missing fact silently becomes `false`, and a missing "annual revenue" turns "CCPA applies if revenue exceeds the threshold" into "CCPA does not apply". That is exactly the false certainty this system exists to prevent.

**Predicate language.** Packs are authored in YAML by contributors who may not write TypeScript, and they must be safe to load from a community pull request. Options considered:

| Option | Verdict |
| --- | --- |
| Arbitrary JavaScript in packs | Rejected: unsafe to load, hard to review, cannot guarantee three-valued semantics. |
| CEL or JSONLogic | Viable, but neither natively expresses three-valued fact queries with confidence thresholds and provenance filters. Wrapping them hides semantics. |
| **Small declarative AST with named built-in evaluators** | **Chosen.** It is schema-validated, explicit about unknowns, and anything complex is a named, versioned, unit-tested engine function referenced by id. |

Grammar (as YAML):

```yaml
# Node kinds
all: [ <node>, ... ]            # Kleene AND
any: [ <node>, ... ]            # Kleene OR
not: <node>
capability: HAS_ANALYTICS       # TRUE if PRESENT, FALSE if ABSENT (with sufficient coverage), else UNKNOWN
  # optional: { id: HAS_ANALYTICS, allow: [PRESENT, SUSPECTED] }
fact:                           # query the fact store
  predicate: regions.targetMarkets
  op: intersects                # eq | neq | in | intersects | contains | exists | gt | gte | lt | lte | matches
  value: [EU]                   # region groups such as EU and EEA expand via rules/regions.yaml
  minConfidence: HIGH
  planes: [OWNER_ASSERTED, CONFIGURED]   # optional provenance filter
ownerFact:                      # shorthand for fact with planes [OWNER_ASSERTED]; UNKNOWN if not answered
  key: operator.annualGrossRevenueUSD
  op: gt
  value: { ref: thresholds.us-ca-ccpa.revenue }   # values can reference pack data
legalJudgment:                  # an input only counsel can resolve; always UNKNOWN unless a ReviewRecord answers it
  id: us-ca-ccpa.q.is-sale-or-share
builtin:                        # a named engine function returning a three-valued result
  id: consent.hasRegionalExemption@1
  args: { pack: uk-pecr }
```

Every `legalJudgment` id is declared in its pack with the exact question text for counsel. A `ReviewRecord` (§32) can answer it for a specific project. The answer is then treated as an owner-asserted fact with the reviewer recorded.

### 8.5 Evaluators

| Kind | Where it lives | Allowed when | Example |
| --- | --- | --- | --- |
| `DECLARATIVE` | Control YAML (predicate over facts) | The requirement is a pure condition over facts | `head.title` exists and is not in the template-residue list |
| `BUILTIN` | Engine function `domain.name@version` | Needs algorithmic work over evidence | `consent.preConsentNonEssential@1` (timeline analysis of network and storage events relative to consent events) |
| `PROBE_ASSERTION` | Verification probe spec | Needs a fresh runtime interaction | `errors.unknownRouteReturns404@1` |
| `SEMANTIC` | Agent task with a strict output schema, validated by the engine | Requires reading meaning and the control documents why determinism is impossible (`semanticJustification`) | "Does the Privacy Policy describe the purpose of each vendor?" |

Semantic evaluators have hard constraints:

1. Their output schema is fixed by the control, for example `{ verdict: MET|NOT_MET|PARTIAL|INDETERMINATE, perItem: [...], quotes: DOCUMENT_QUOTE[] }`.
2. Every verdict item cites quotes or evidence IDs validated as in §7.7.
3. The confidence of a semantic verdict is capped at `MEDIUM`, or `HIGH` if every item is anchored. A semantic `MET` can therefore produce `PASS` only for controls whose `requiredConfidence` is `HIGH` or lower. Legal-category obligations require `CONFIRMED` for `PASS` unless the obligation explicitly allows semantic satisfaction. In that case the result is `PASS` with the caveat `SEMANTIC_ASSESSMENT`, which the report shows.
4. A semantic evaluator may never be the sole basis for `NOT_APPLICABLE`.

### 8.6 Scope and fan-out

Controls declare a **scope unit**: `SITE`, `ENVIRONMENT`, `ROUTE`, `ROUTE_TEMPLATE`, `FORM`, `DATA_ELEMENT`, `STORAGE_ITEM`, `NETWORK_DESTINATION`, `VENDOR`, `MESSAGE_STREAM`, `LOCALE`, `DOCUMENT`, `COMPONENT`, `ENDPOINT`, `ADMIN_CAPABILITY`. The evaluator fans out across units and produces one finding per unit with a non-`PASS` status. Passing units are aggregated into one `PASS` finding listing them, which keeps reports readable. Route-scoped findings on routes sharing a template are grouped by template, with instances listed.

**Fingerprint** (stable across runs, used for baselines and suppressions): `sha256(controlId + ":" + scopeUnitKind + ":" + canonicalScopeKey)`. Examples of canonical keys: `route:/blog/[slug]`, `cookie:_ga@.example.com`, `vendor:google-analytics`, `form:newsletter@/`. Line numbers are never part of a fingerprint.

### 8.7 Severity, confidence, and prioritization

Three independent axes (P22):

- **Severity** (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`): the impact if the finding is true. It is declared by the control, and obligations may raise it.
- **Confidence:** how sure the system is (§6.4).
- **Category:** what kind of rule it is (§8.2).

**Priority** orders remediation work. It is never displayed as a score and never aggregated.

```text
priority = f(
  userHarm           ∈ {none, low, moderate, severe}        // e.g., data to ad networks = severe
  securityRisk       ∈ {none, low, moderate, severe}
  privacyRisk        ∈ {none, low, moderate, severe}
  scope              ∈ {one element, some routes, sitewide}
  likelihood         ∈ {theoretical, plausible, observed}   // observed = CONFIRMED runtime evidence
  confidence         (from finding)
  launchVisibility   ∈ {hidden, visible, first-impression}  // e.g., broken share preview = first-impression
  effort             ∈ {automatic, small, large}            // used to break ties, never to demote harm
)
```

The ordering is lexicographic: first by the maximum of user harm, security risk, and privacy risk, then likelihood, then scope, then visibility, then effort. Regulator maximum fines are deliberately not an input, because they say little about practical severity and encourage fear-driven reports.

### 8.8 Control schema

```ts
interface Control {
  id: ControlId;                           // "CONSENT.PRE_CONSENT_NONESSENTIAL"
  version: number;                         // incremented on semantic change
  domain: DomainId;                        // "consent"
  ownerSkill: SkillName;                   // single owner (§10.6)
  title: string;
  description: string;                     // what is checked, in plain language
  category: RuleCategory;                  // used when no obligation maps
  scopeUnit: ScopeUnit;
  applicability: PredicateNode;            // three-valued
  inputs: { facts: string[]; capabilities: CapabilityId[]; probes: ProbeId[] };
  evaluator:
    | { kind: "DECLARATIVE"; condition: PredicateNode }
    | { kind: "BUILTIN"; id: string }
    | { kind: "PROBE_ASSERTION"; probe: ProbeId; assertion: string }
    | { kind: "SEMANTIC"; task: SemanticTaskId; semanticJustification: string; outputSchema: string };
  requiredConfidence: Confidence;
  partialIsFail?: boolean;
  severity: Severity;
  userHarm: HarmLevel; securityRisk: HarmLevel; privacyRisk: HarmLevel;
  remediation: {
    type: RemediationType;                 // AUTOMATIC_SAFE_FIX | AUTOMATIC_WITH_VERIFICATION | OWNER_INPUT_REQUIRED | LEGAL_REVIEW_REQUIRED | MANUAL_ENGINEERING_REQUIRED
    recipes: RecipeRef[];                  // §28.3; capability-operation based
    guidance: string;                      // human-readable guidance
    forbidden?: string[];                  // explicit anti-patterns, e.g., "do not hide the reject button in a second layer"
  };
  verification: { probes: ProbeId[]; personas: PersonaSelector; procedure: string };
  tags: string[];                          // "dark-pattern", "trust-surface", "crawler-visible", …
  references: AuthorityRef[];              // technical references (specs, docs); legal ones live on obligations
  lastReviewed: string;                    // date
  tests: { fixtures: string[]; unit: string };
}
```

### 8.9 Example control and obligation

```yaml
# rules/controls/consent/pre-consent-nonessential.yaml
id: CONSENT.PRE_CONSENT_NONESSENTIAL
version: 3
domain: consent
ownerSkill: consent-management
title: No non-essential client-side storage or third-party transmission before a consent choice
category: TRUST_CONSISTENCY            # without obligations it is still a trust issue if a banner exists
scopeUnit: ENVIRONMENT
applicability:
  capability: { id: HAS_NON_ESSENTIAL_CLIENT_TECH, allow: [PRESENT, SUSPECTED] }
inputs:
  probes: [browser.freshContext, browser.networkTimeline, browser.storageTimeline]
evaluator: { kind: BUILTIN, id: consent.preConsentNonEssential@1 }
requiredConfidence: CONFIRMED
severity: HIGH
userHarm: moderate
privacyRisk: severe
securityRisk: none
remediation:
  type: AUTOMATIC_WITH_VERIFICATION
  recipes: [consent.gateVendorInit, consent.deferEmbedsWithFacade]
  guidance: >
    Load each non-essential vendor only through the consent gate for its category.
    Do not rely on the CMP to "clean up" cookies after they were set.
  forbidden:
    - "Classifying UNKNOWN-purpose storage as strictly necessary to make this pass"
verification:
  probes: [browser.freshContext]
  personas: [first-visit, reject-all, accept-analytics-only]
  procedure: "Consent protocol steps 1–3 (§13.8)"
tags: [crawler-invisible, trust-surface]
lastReviewed: 2026-09-15
tests: { fixtures: [site-bad-consent, site-analytics-good, portfolio-minimal], unit: consent/pre-consent.test.ts }
```

```yaml
# rules/packs/eu-eprivacy/obligations/art5-3-storage-access.yaml
id: EU-EPRIVACY.ART5_3.STORAGE_ACCESS_CONSENT
pack: eu-eprivacy
category: LEGAL_REQUIREMENT
title: Storing or accessing information on a user's device requires consent unless strictly necessary
requirement: >
  Storage of information, or access to information already stored, in the terminal equipment of a
  user requires prior consent, except where technically needed for transmission or strictly necessary
  for a service explicitly requested by the user. (Paraphrase; see authorities.)
authorities:                                         # instrument + provision pinpoints in rules/sources/ (§9.5)
  - { source: eu.dir-2002-58, provision: "art-5-3", kind: STATUTE }
  - { source: eu.edpb.guidelines-2023-02, provision: "document", kind: REGULATOR_GUIDANCE }
  - { source: eu.edpb.guidelines-2020-05, provision: "document", kind: REGULATOR_GUIDANCE }
applicability:
  all:
    - { scope: pack-active }                         # resolved by §9.2
    - { capability: { id: HAS_NON_ESSENTIAL_CLIENT_TECH, allow: [PRESENT, SUSPECTED] } }
exclusions:
  - "Storage whose purpose is strictly necessary for a service explicitly requested by the user"
  - "Member-state implementations may differ; overlay packs may refine"
satisfiedBy:
  - { control: CONSENT.PRE_CONSENT_NONESSENTIAL, expect: PASS }
  - { control: CONSENT.REJECT_BLOCKS_NONESSENTIAL, expect: PASS }
  - { control: CONSENT.WITHDRAWAL_EFFECTIVE, expect: PASS }
evidenceNeeded: [NETWORK_LOG, COOKIE_JAR, STORAGE_DUMP]
technicalImplication: "Non-essential scripts, pixels, embeds, and storage must be gated behind a recorded consent choice."
userFacingImplication: "Visitors must be able to accept or refuse non-essential technologies before they run."
severity: HIGH
legalReviewTriggers:
  - id: purpose-disputed
    when: { fact: { predicate: clientStorage.purpose, op: eq, value: UNKNOWN } }
    question: "Is storage item {{name}} set by {{initiator}} strictly necessary for a service the user explicitly requested?"
  - id: consent-mode-pings
    when: { fact: { predicate: analytics.providers.initTiming, op: eq, value: CONSENT_MODE_PINGS_BEFORE_CONSENT } }
    question: "Do cookieless pings sent before consent involve access to or storage of information on the device under the current guidance?"
uncertainty: "Guidance on technical scope has broadened over time (for example, tracking pixels and URL-based tracking). Review this obligation when EDPB guidance changes."
specialistAreas: []                                  # e.g., [CHILDREN] would require a specialist review (§9.10)
version: 2                                           # bump on semantic change → prior reviews no longer cover it
temporal:                                            # §8.12 — per obligation, never per pack
  effectiveFrom: null                                # set from the basis provisions when the pack is authored
  basis: [{ source: eu.dir-2002-58, provision: "art-5-3" }]
  sourceAsOf: null                                   # set when the sources are captured
nextReviewBy: 2027-03-01                             # time-based freshness (§9.6); review state itself is computed
```

The obligation has no `reviewed` or `status` field. Its review state (`PROVISIONAL`, `REVIEWED`, `REVIEW_REQUIRED`) is computed from review records and source snapshots (§9.10).

### 8.10 Deterministic versus AI reasoning

| Question | Method | Why |
| --- | --- | --- |
| Does the HTML contain a title? Is it the same on every route? | Deterministic (head extraction) | Parsing |
| Is a cookie set before consent? Does rejection block vendor requests? | Runtime deterministic (network and storage timelines) | Observation |
| Does an unknown route return 404? | Runtime deterministic | Observation |
| Is `/dashboard` protected? Does it appear in the sitemap? | Runtime deterministic | Observation |
| Is the canonical pointing to localhost or staging? | Deterministic | String comparison with known origins |
| Does a secret appear in client bundles? | Deterministic (pattern plus entropy plus bundle fetch) | Parsing |
| Does the analytics payload contain the user's email? | Runtime deterministic (canaries) | Observation |
| Which data purpose does this form serve? | LLM classification, anchored, `MEDIUM`, owner confirms | Meaning of labels and context |
| Is this route meant for search? | Heuristics first (auth, patterns), LLM for the rest, owner overrides | Intent is a business decision |
| Does the Privacy Policy accurately describe a multi-vendor data flow? | Hybrid: LLM extracts anchored claims; the engine matches claims against facts deterministically | Extraction needs language; matching does not |
| Is this site "directed to children"? | Signals are deterministic (content scan, age fields, settings); the weighing is LLM-assisted; the conclusion is owner-confirmed or `LEGAL_REVIEW_REQUIRED` | Legal multi-factor test |
| Does this business exceed a statutory threshold? | Owner facts plus a deterministic comparison; missing facts give `UNKNOWN` | Business facts |
| Is this cancellation flow a dark pattern? | Deterministic measurements (steps, prominence ratios) plus LLM text classification (confirmshaming) with quotes | Mixed |
| Draft a Privacy Policy section | LLM drafting constrained to bound facts and a clause library; deterministic claim check afterwards | Authorship |
| Plan remediation across files | LLM, constrained by the ownership table and adapters | Cross-file reasoning |

### 8.11 Rule quality requirements

A control or obligation cannot merge without:

1. Schema validation.
2. Unit tests for its evaluator or predicate, covering `TRUE`, `FALSE`, and `UNKNOWN` applicability, and `MET`, `NOT_MET`, and `INDETERMINATE` evaluation.
3. At least one fixture where it fails and one where it passes. Controls that can be `NOT_APPLICABLE` also need a fixture where they are, with coverage.
4. For obligations: at least one authority of kind `STATUTE`, `REGULATION`, `REGULATOR_GUIDANCE`, `STANDARD`, or `OFFICIAL_DOCUMENTATION`, each resolving to a source record in `rules/sources/` with at least one snapshot; a complete `temporal` block (§8.12); and `nextReviewBy`.
5. For semantic evaluators: an eval set in `/evals` with measured precision (§36.6).
6. No authored review state. Review records are separate files (§9.10), and CI rejects obligations containing `reviewed`, `status`, or `reviewState` fields.

### 8.12 Temporal validity (ADR 0004)

Legal effect is a property of **individual obligations and thresholds**, not packs. Staged commencement, compliance deadlines after an effective date, transitional regimes that depend on facts, and court vacatur all happen at provision level.

**Schema.** Every obligation and every entry in `thresholds.yaml` carries `temporal: TemporalValidity` (type in §32.1): `publishedAt`, `effectiveFrom` (null while commencement is pending), `complianceFrom`, `effectiveUntil` with `endReason` (`REPEALED`, `EXPIRED`, `VACATED`, `SUPERSEDED`, `SUNSET`), `transitionalRules[]` (each with a three-valued `appliesWhen` predicate and its own dates), `basis[]` (the provisions and commencement instruments the dates come from), and `sourceAsOf`.

**Evaluation date.** Every run has `evaluatedAsOf` (part of the run identity, §32.1), which defaults to the run date. `--as-of <date>` previews future states. The same commit can therefore produce different findings on different dates, and the report says why.

**Temporal states and their effect:**

| State | Condition | Effect on evaluation |
| --- | --- | --- |
| `NOT_YET_EFFECTIVE` | `evaluatedAsOf < effectiveFrom`, or `effectiveFrom` is null | Excluded from status. Shown under "Upcoming obligations" (date known) or "Pending commencement" (date unknown). |
| `EFFECTIVE_PRE_COMPLIANCE` | Effective, but before `complianceFrom` | Evaluated. A would-be `FAIL` is reported as `WARNING(caveat = COMPLIANCE_PERIOD)`, with the deadline. |
| `COMPLIANCE_REQUIRED` | On or after `complianceFrom` (or `effectiveFrom` when there is no separate compliance date), and before `effectiveUntil` | Normal |
| `ENDED` | On or after `effectiveUntil` | Excluded. Shown in history, and `endReason` is displayed. |
| `UNDETERMINED` | A transitional rule's `appliesWhen` is `UNKNOWN`, and choosing it would change the state | Cannot produce `FAIL`. Produces `UNKNOWN(OWNER_INPUT_PENDING)` with a question when the unknown is an owner fact, or `LEGAL_REVIEW_REQUIRED(TEMPORAL_UNDETERMINED)` when it is a legal judgment. |

**Transitional rules.** A transitional rule applies when its predicate is `TRUE`. Its dates then replace the base dates. When several transitional rules are `TRUE`, the pack must declare their precedence explicitly, and CI rejects ambiguous overlaps. Example: an obligation applies from a base date, but for systems placed on the market before that date a later compliance date applies. `appliesWhen` then reads an owner fact such as `ai.systems[].placedOnMarketAt`.

**CI consistency checks.** `effectiveFrom` must not precede the commencement recorded for its `basis` provisions in the latest source snapshot. A basis provision recorded as vacated, repealed, or not commenced must be reflected in `effectiveUntil` or a null `effectiveFrom`. `sourceAsOf` must be no older than the latest snapshot of its basis sources by more than the pack's review interval.

**Freshness is a different axis.** Temporal validity says when the law applies. Freshness (§9.6) and review state (§9.10) say how current and how verified ReadyVibe's encoding of it is. All three are shown on findings.

---

## 9. Jurisdiction Packs

### 9.1 Pack concept

A **pack** is a versioned, cited, testable bundle of obligations for one legal regime, standard, or guidance source. Packs are data. They reference controls by id and never contain code beyond named built-in evaluator references.

```text
rules/packs/<pack-id>/
├── pack.yaml                 # manifest (below)
├── thresholds.yaml           # numeric thresholds, deadlines, ages — each entry with its own `temporal` block
├── questions.yaml            # owner questions and legalJudgment questions for counsel
├── obligations/*.yaml        # obligations mapped to controls, each with `temporal` and `specialistAreas`
├── disclosures.yaml          # required notice elements, for the legal document system (§15)
├── rights.yaml               # rights and deadlines, for the data-rights system (§17)
├── reviews/*.yaml            # review records (ADR 0003); append-only; review STATE is computed, never stored here
├── CHANGELOG.md              # obligation-level changes per version
└── tests/                    # fact fixtures and expected statuses (including as-of date cases)

rules/sources/<source-id>/    # shared across packs (one instrument may serve several packs)
├── source.yaml               # instrument identity, kind, publisher, official URL, legal status
└── snapshots/<date>.yaml     # per-provision normalized-text hashes + commencement/status metadata; no source text

rules/reviewers.yaml          # reviewer registry: public handle, consented professional reference, specialisms
```

```yaml
# pack.yaml
id: uk-pecr
title: UK Privacy and Electronic Communications Regulations (cookies and electronic marketing)
kind: LEGAL                    # LEGAL | STANDARD | GUIDANCE | SECTOR | OVERLAY
version: 2026.09.0             # CalVer release of this data (§41.4) — not a legal-effect date
lifecycle: ACTIVE              # ACTIVE | DEPRECATED (authored). Review state is COMPUTED per obligation (§9.10).
jurisdiction: { region: GB, level: NATIONAL }
activation:
  confirmedWhen:
    any:
      - { ownerFact: { key: targets.markets, op: intersects, value: [GB] } }
      - { ownerFact: { key: operator.country, op: eq, value: GB } }
  candidateWhen:
    any:
      - { fact: { predicate: regions.signals, op: contains, value: { kind: CURRENCY, value: GBP }, minConfidence: MEDIUM } }
      - { fact: { predicate: languages.locales, op: contains, value: en-GB } }
  excludedWhen:
    - { ownerFact: { key: targets.excludedMarkets, op: contains, value: GB } }
dependsOn: [uk-gdpr]           # packs whose definitions this pack relies on
overlays: []                   # e.g., a member-state overlay would declare base: eu-gdpr
maintainers: ["@readyvibe/legal-uk"]
reviewInterval: P6M            # time-based freshness interval (§9.6)
nextReviewBy: 2027-03-01
notes: >
  Data (Use and Access) Act 2025 amendments commence provision by provision. Each affected obligation
  carries its own temporal block with the commencement instrument in `basis` (§8.12, §9.11).
```

A pack has no `status`, `reviewedAt`, or `effectiveFrom`. Legal effect is per obligation (§8.12). Review state is computed per obligation and rolled up to the pack (§9.10).

### 9.2 Activation (Decision D-07)

A pack's activation state for a project is one of:

| State | How reached | Effect |
| --- | --- | --- |
| `CONFIRMED` | `confirmedWhen` is `TRUE` using owner-asserted facts, or the owner explicitly enabled the pack | Obligations evaluate normally and can produce `FAIL` |
| `CANDIDATE` | `candidateWhen` is `TRUE` and `confirmedWhen` is not `TRUE` | Obligations evaluate in **conditional mode**: they never produce `FAIL`, add "if in scope" notes, and generate an owner question. The report lists them under "Scope to confirm". |
| `EXCLUDED` | `excludedWhen` is `TRUE`, or the owner explicitly disabled the pack | Not evaluated. The report lists it as excluded, with the owner's statement as evidence. |
| `INACTIVE` | None of the above | Not evaluated. It is listed in the report's "packs available but not activated" appendix. |

Hard rules:

- Hosting region, CDN location, or a generic TLD (`.com`, `.io`, `.app`) MUST NOT appear in `confirmedWhen` and SHOULD NOT appear in `candidateWhen`. A country-code TLD MAY appear in `candidateWhen` at `LOW` weight, and on its own cannot reach candidate state.
- Language alone MUST NOT confirm a pack. Arabic content does not imply the UAE, and English does not imply the UK or US.
- Free-zone packs (`uae-difc`, `uae-adgm`) are confirmed **only** by the owner asserting that the operator is established in that free zone. The federal `uae-pdpl` pack's exclusions record that entities subject to free-zone data protection laws, and certain sector-regulated data, fall outside it, and those exclusions are evaluated from owner facts.
- US state packs require owner facts about business thresholds where the law has thresholds. Missing facts leave applicability `UNKNOWN`, which yields an owner question, and after an "I'm not sure" answer, `LEGAL_REVIEW_REQUIRED(reason = THRESHOLD_UNDETERMINED)`.

### 9.3 Composition (Decision D-08)

Several packs are usually active at once. They are composed through **obligation families**, stable identifiers for the *kind* of obligation, such as `transparency.notice`, `consent.device-storage`, `consent.marketing-email`, `rights.access`, `rights.deletion`, `rights.opt-out-sale-share`, `children.parental-consent`, `children.high-privacy-defaults`, `security.appropriate-measures`, `accessibility.web-content`, `commerce.auto-renewal-disclosure`, `ugc.notice-and-action`.

- **Implementation is unified per family.** For example, the data-rights system builds one deletion workflow that satisfies every active pack's `rights.deletion` obligation. Differences in details (deadlines, verification standards, exceptions) are parameters taken from each pack's `rights.yaml`.
- **Default: one behavior that satisfies the union of active packs.** For example, if EU packs are confirmed, the consent experience that satisfies them is shown to everyone.
  - Why: region-differentiated UX multiplies test surface, depends on IP geolocation accuracy, and fails badly when geolocation is wrong (VPNs, travel, CDN header spoofing). For most launch-stage products, one protective behavior is simpler, safer, and cheaper.
- **Region-differentiated behavior is opt-in** (`consent.regionalBehavior: true` in config). When enabled, the consent system requires a trusted geolocation source (a hosting adapter header, not a client guess), tests one persona per configured region, and defaults to the most protective behavior when location is unknown.
- **Conflicts** between packs (rare, for example different disclosure placement requirements) are not resolved automatically. They produce a `Decision` record with `LEGAL_REVIEW_REQUIRED`.
- **Deadlines and thresholds** are never merged into a "strictest wins" number silently. The rights system records each applicable pack's deadline, and the admin view shows the earliest.

### 9.4 Obligation fields

Every obligation has the fields required by the specification brief. Most are shown in §8.9, and the full type is in §32.4.

| Field | Purpose |
| --- | --- |
| `id` | `<PACK>.<SOURCE_REF>.<NAME>`, stable forever. Renames create a new id with `supersedes`. |
| `pack`, `version` | Owning pack and obligation version |
| `authorities[]` | References to source records in `rules/sources/` with a provision pinpoint (article, section, paragraph) and kind |
| `temporal` | Rule-level legal-effect interval: `publishedAt`, `effectiveFrom`, `complianceFrom`, `effectiveUntil` and `endReason`, `transitionalRules[]`, `basis[]`, `sourceAsOf` (§8.12) |
| `nextReviewBy` | Time-based freshness (§9.6) |
| `specialistAreas[]` | Areas that require a specialist reviewer before the obligation can be `REVIEWED` (§9.10) |
| *(computed)* review state | `PROVISIONAL`, `REVIEWED`, or `REVIEW_REQUIRED`, derived from review records and source snapshots. Never authored. (§9.10) |
| `applicability` | Three-valued predicate |
| `exclusions[]` | Human-readable exclusions, each ideally backed by an `excludedWhen` predicate |
| `evidenceNeeded[]` | Evidence types needed to evaluate |
| `requirement` | Paraphrased requirement. Short quotes only, with pinpoint citations. |
| `satisfiedBy[]` | Controls and expected results |
| `technicalImplication` | What the product must do technically |
| `userFacingImplication` | What users must be able to see or do |
| `severity` | Raises, never lowers, the control's severity |
| `remediationGuidance` | Pack-specific guidance appended to control remediation |
| `verification` | Additional verification beyond the controls, if any |
| `uncertainty` | Known interpretive uncertainty, in plain language |
| `legalReviewTriggers[]` | Fact conditions that turn the result into `LEGAL_REVIEW_REQUIRED`, with the question for counsel |
| `family` | Obligation family for composition |

### 9.5 Legal source policy

**Authority hierarchy** (the `kind` on each authority record):

1. `STATUTE` or `REGULATION`: official legislative text (for example EUR-Lex, legislation.gov.uk, the UAE official gazette or legislation portals, the eCFR, US Code, California Legislative Information).
2. `REGULATOR_GUIDANCE`: official guidance from the competent authority (for example EDPB, national DPAs, ICO, UAE Data Office, FTC, the California Privacy Protection Agency and the Attorney General).
3. `OFFICIAL_GOVERNMENT`: other official government sources.
4. `STANDARD`: standards bodies (W3C, ISO, IETF RFCs, OWASP, PCI SSC, ETSI and CEN harmonized standards).
5. `OFFICIAL_DOCUMENTATION`: official technical documentation of platforms and vendors (Google Search Central, provider documentation), used for platform policy and vendor behavior.
6. `SECONDARY`: authoritative secondary sources (bar associations, academic commentary). They are allowed only to explain uncertainty. They can never be the sole authority for an obligation.

Blogs, vendor marketing, AI-generated summaries, and forums are not acceptable authorities. CI rejects obligations whose only authorities are `SECONDARY`. Secondary sources may inform an obligation's `uncertainty` note. They may never supply the content of a requirement, including details a statute leaves to implementing instruments that have not been located.

**Source records** (shared across packs, ADR 0003):

```yaml
# rules/sources/eu.dir-2002-58/source.yaml
id: eu.dir-2002-58
kind: STATUTE
title: Directive 2002/58/EC (Directive on privacy and electronic communications), as amended
publisher: EUR-Lex (Publications Office of the European Union)
officialUrl: https://eur-lex.europa.eu/eli/dir/2002/58/oj
identifiers: { celex: "32002L0058" }
legalStatus: IN_FORCE          # IN_FORCE | PARTIALLY_IN_FORCE | NOT_YET_IN_FORCE | EXPECTED_NOT_LOCATED
                               # | PROPOSED | REPEALED | VACATED | SUPERSEDED
granularity: PROVISION         # PROVISION (stable anchors) | DOCUMENT (conservative)
excerptPolicy: { allowed: true, maxCharsPerExcerpt: 300, attribution: "Source: EUR-Lex" }
```

```yaml
# rules/sources/eu.dir-2002-58/snapshots/2026-08-20.yaml  — hashes and metadata only, never source text
source: eu.dir-2002-58
retrievedAt: 2026-08-20
retrievedFrom: "<official URL of the version fetched>"
versionLabel: "<official consolidation or version label>"
normalizer: { id: rv-legal-text, version: 1 }
documentHash: "sha256:…"
provisions:
  - { id: art-5-3, hash: "sha256:…", status: IN_FORCE, inForceFrom: null }
```

Rules for source records:

- **No authoritative text in the repository** (ADR 0001). Snapshots hold hashes of normalized provision text, official version labels, and commencement or status metadata. Short excerpts are allowed only in Apache-licensed obligation files, within `excerptPolicy`, with attribution, and never in CC0 paths.
- **Legal status is tracked**, including `EXPECTED_NOT_LOCATED` for implementing instruments a statute requires but that cannot be found in official sources, `PROPOSED` for open rulemaking (watched, never enforced), and `VACATED` for rules set aside by courts (kept for history, never evaluated as current).
- Standards with restrictive or share-alike terms are referenced by identifier only (requirement ids and success-criterion numbers).

Citations live as metadata on obligations and are rendered by the report. The agent never generates a legal citation. It can only reference source and provision ids that exist.

### 9.6 Freshness

Three independent axes are shown on every legal finding:

| Axis | Question | Mechanism |
| --- | --- | --- |
| Temporal validity | Does the law apply on `evaluatedAsOf`? | §8.12 |
| Review state | Has a qualified reviewer checked this encoding against the current source? | §9.10 (computed) |
| Freshness | When did anyone last confirm the sources? | `nextReviewBy` and snapshot dates (below) |

| Freshness condition | Effect |
| --- | --- |
| Today > an obligation's `nextReviewBy` | `STALE`: findings citing it show a stale-source notice, and `launch-verification` adds a `WARNING` finding `PACKS.STALE` |
| Today > `nextReviewBy` + 180 days | `STALE_CRITICAL`: legal-category obligations can no longer contribute to `PASS`. They produce `LEGAL_REVIEW_REQUIRED(reason = SOURCE_STALE)`. |
| The latest snapshot of a basis source is older than the pack's `reviewInterval` | `STALE`, same effect as the first row |

Repository CI runs a daily freshness job (§38.1) that opens issues for obligations within 30 days of `nextReviewBy`, and a scheduled source-watch job (§9.8) that adds snapshots when official sources change.

### 9.7 Initial pack catalog

Every obligation in every pack starts `PROVISIONAL` (§9.10). The catalog therefore has no status column: review states are computed by CI and published in the generated README pack table. Items marked † have source-status notes as of 2026-09-28 in §9.11.

| Pack | Kind | Scope notes | Notable legal-review triggers |
| --- | --- | --- | --- |
| `global-baseline` | GUIDANCE | Trust consistency, launch quality, security baseline, and accessibility target wiring. Contains no legal claims. | — |
| `eu-gdpr` | LEGAL | Regulation (EU) 2016/679: transparency, legal-basis candidates, rights, children's consent age (member-state variation as thresholds), processors, transfers, security, breach metadata, DPIA triggers | Legal basis selection, legitimate-interest balancing, transfer mechanism adequacy, DPIA necessity, joint controllership |
| `eu-eprivacy` | LEGAL | Directive 2002/58/EC Art. 5(3) device storage and access; Art. 13 electronic marketing. Member-state overlays can refine. | Strict-necessity disputes, consent-mode pings, soft opt-in scope |
| `eu-dsa` | LEGAL | Regulation (EU) 2022/2065 for intermediary, hosting, and online-platform services: contact points, terms transparency, notice-and-action, statements of reasons, complaint handling, deceptive-design prohibition, advertising transparency, minors' protection. Tiered, with small-enterprise exemptions from owner facts. | Service classification (hosting versus online platform), enterprise-size exemption |
| `eu-eaa` | LEGAL | Directive (EU) 2019/882 (European Accessibility Act) for in-scope services such as e-commerce, mapped to accessibility controls through the harmonized standard | Whether the service is in scope; microenterprise exemption |
| `eu-consumer` | LEGAL | Consumer information and withdrawal rights for distance contracts and digital services; pricing transparency | Withdrawal-right exceptions for digital content |
| `eu-ai-act-transparency` † | LEGAL | Regulation (EU) 2024/1689 Article 50, one obligation per paragraph. Applicability is **not** a single flag: it depends on role (provider or deployer) per AI system, system behavior, output content type, and whether the system was placed on the market before 2026-08-02 (transitional rule). | Role determination; whether an exception applies; whether a feature is an in-scope AI system |
| `uk-gdpr` † | LEGAL | UK GDPR and the Data Protection Act 2018 as amended. Data (Use and Access) Act 2025 changes are encoded **provision by provision**, each with its commencement instrument in `temporal.basis`. | Same families as `eu-gdpr` |
| `uk-pecr` † | LEGAL | Cookies and similar technologies; electronic marketing; provision-level DUAA 2025 commencement | Exemption scope as amended |
| `uk-aadc` | REGULATOR_GUIDANCE-backed code | The ICO Age Appropriate Design Code (15 standards) for services likely to be accessed by children | "Likely to be accessed" assessment; age-assurance proportionality |
| `uk-osa` | LEGAL | Online Safety Act 2023 for user-to-user and search services (conditional on `HAS_USER_CONTENT`) | Service categorization; risk-assessment duties |
| `uae-pdpl` † | LEGAL | Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (the statute is authoritative). Executive Regulations are recorded as `EXPECTED_NOT_LOCATED`. Regulation-dependent details are `UNKNOWN` or `LEGAL_REVIEW_REQUIRED(IMPLEMENTING_INSTRUMENT_PENDING)`, never filled from commentary. Exclusions (free-zone regimes, sector-specific data) are evaluated from owner facts. | Regulation-dependent details; sector exclusions; cross-border transfer conditions |
| `uae-difc` | LEGAL | DIFC Data Protection Law No. 5 of 2020 and regulations. Activation is only by owner assertion. | — |
| `uae-adgm` | LEGAL | ADGM Data Protection Regulations 2021. Activation is only by owner assertion. | — |
| `us-coppa` † | LEGAL | COPPA and the FTC COPPA Rule (16 CFR Part 312). The 2025 amendments are part of the **current** baseline, and exceptions to their compliance date are encoded per obligation. The FTC's 2026 age-verification policy statement is a **separate** `REGULATOR_GUIDANCE` source used for uncertainty notes and age-assurance guidance. It is not Rule text. | "Directed to children" multi-factor test; actual knowledge; mixed-audience status; verifiable parental consent method; `specialistAreas: [CHILDREN]` on all obligations |
| `us-can-spam` | LEGAL | CAN-SPAM Act and 16 CFR Part 316 for commercial email | Primary-purpose test for mixed messages |
| `us-ftc-act` | LEGAL | Deceptive and unfair practices as applied to privacy, security, and dark-pattern claims (maps mostly to trust-consistency controls) | Materiality of a misstatement |
| `us-ca-ccpa` | LEGAL | CCPA as amended by CPRA and the CCPA regulations: notices at collection, rights, opt-out of sale or sharing, sensitive PI limits, opt-out preference signals (GPC), symmetry-in-choice. Thresholds are pack data. | Threshold applicability; whether disclosures are "sale" or "sharing"; service-provider status of vendors |
| `us-ftc-rosca` † | LEGAL | Restore Online Shoppers' Confidence Act (15 U.S.C. §§ 8401–8405) for online negative-option offers: clear disclosure of material terms, express informed consent, simple mechanism to stop recurring charges (conditional on `HAS_SUBSCRIPTIONS`). The vacated 2024 amendments to the FTC Negative Option Rule are recorded as a `VACATED` source and **never** encoded as current obligations. The new Negative Option Rule proceeding is a watched `PROPOSED` source with no obligations. | Whether an offer is a negative-option feature; adequacy of the stop mechanism |
| `us-ca-auto-renewal` | LEGAL | California automatic renewal law (conditional on `HAS_SUBSCRIPTIONS`). Other states' automatic-renewal laws are separate state packs. | Offer-term clarity; cancellation method adequacy |
| `wcag-2.2` | STANDARD | W3C WCAG 2.2 success criteria at the configured level | — (standards are not legal questions; legal packs map to them) |
| `owasp-asvs` | STANDARD | OWASP ASVS (current major version), mapped by chapter and requirement id to security controls | — |
| `pci-dss` | STANDARD | PCI DSS scope indicators, conditional on `HAS_PAYMENTS` | SAQ type determination, always deferred to the acquirer or QSA |
| `google-search` | GUIDANCE | Google Search Central technical guidance: crawling, indexing, canonicalization, structured-data eligibility, spam policies | — |
| `core-web-vitals` | GUIDANCE | Metric definitions and thresholds as data | — |
| `email-bulk-sender` | PLATFORM_POLICY | Mailbox-provider bulk-sender requirements (authentication, one-click unsubscribe) | — |

Future packs (Canada, Brazil, Australia, Singapore, Saudi Arabia, India, other US states, and sector regimes such as health and finance) follow the same format (§44).

### 9.8 Updating legal sources without rewriting the system

```text
source-watch (scheduled) re-fetches official sources ─┐     contributor report / regulator notice
  normalizes with pinned normalizer, hashes provisions │                      │
                                                       ▼                      ▼
                   new snapshot PR: rules/sources/<id>/snapshots/<date>.yaml (hashes + status metadata only)
                                                       │
                   CI recomputes review states: obligations whose basis-provision hash changed
                   → REVIEW_REQUIRED automatically; commencement/status changes flagged for temporal edits
                                                       │
                                                       ▼
               PR editing rules/packs/<pack>/** as needed:
                 · obligations: temporal blocks (effectiveFrom / complianceFrom / effectiveUntil), supersedes
                 · version bump on semantic change (invalidates prior reviews for that obligation)
                 · CHANGELOG.md: obligation diff
                                                       │
               CI: schema · temporal consistency · pack tests (incl. as-of cases) · fixtures · obligation diff
                                                       │
               review records added by qualifying reviewers (specialist where tagged) + maintainer approval
                                                       │
                                                       ▼
release: pack CalVer bump → engine bundles packs → consumer reports show pack updates, review-state
changes, and date-driven finding changes in the next report and compliance diff
```

Because controls are stable and packs are data, a law change usually touches only one pack directory. Code changes are needed only when a genuinely new kind of technical check is required, and then the new control is added once and mapped from any number of packs.

### 9.9 Pack tests

Each pack ships fact fixtures (`tests/*.facts.yaml`) and expected obligation outcomes (`tests/*.expected.yaml`), covering at least: confirmed activation, candidate activation (no `FAIL`s), excluded activation, each legal-review trigger, threshold `UNKNOWN` handling, and **as-of cases** for every temporal boundary (the day before and the day of `effectiveFrom`, `complianceFrom`, and `effectiveUntil`, plus each transitional rule with its predicate `TRUE`, `FALSE`, and `UNKNOWN`). The pack test runner evaluates obligations against fixture facts without running probes, so pack tests are fast and run on every PR. Review-state computation has its own tests: a version bump invalidates a review; a changed provision hash yields `REVIEW_REQUIRED`; a missing specialist yields `PROVISIONAL`; a normalizer change alone changes nothing.

### 9.10 Rule-level legal review lifecycle (ADR 0003)

**States are computed, never authored.** For each obligation `o` and the latest snapshots `S`:

```text
qualifying(r, o) :=  r.covers contains (o.id, o.version)
                 AND for every basis/authority provision p of o: r.snapshotHash(p) == S.hash(p)
                 AND r.outcome in {APPROVED, APPROVED_WITH_NOTES, NO_MATERIAL_CHANGE}
                 AND reviewer(r) is registered (rules/reviewers.yaml) and not self-approving the PR

specialistCovered(o) := for every area a in o.specialistAreas:
                          ∃ qualifying r with a ∈ reviewer(r).specialisms

state(o) := REVIEWED         if ∃ qualifying r AND specialistCovered(o)
            REVIEW_REQUIRED  if not REVIEWED AND ∃ past review of o (any version or snapshot)
            PROVISIONAL      otherwise
```

Pack roll-up: `REVIEWED` (all obligations reviewed), `PARTIALLY_REVIEWED`, or `PROVISIONAL`, with a `REVIEW_REQUIRED` count. Roll-ups are generated, never edited.

**Review record** (`rules/packs/<pack>/reviews/<date>-<reviewer>.yaml`, schema in §32.12): reviewer reference, date, covered obligation ids and versions, snapshot ids and hashes reviewed against, outcome, notes. Multiple reviews per obligation are supported. Cleared editorial changes use outcome `NO_MATERIAL_CHANGE` and require a registered domain reviewer, not a maintainer alone.

**Reviewer registry** (`rules/reviewers.yaml`): public handle or display name, a professional reference the reviewer consents to publish (for example a bar or professional registration reference, or a public profile), specialisms (`CHILDREN`, `REGULATED_SECTOR:<sector>`, `CROSS_BORDER_TRANSFER`, `AUTOMATED_DECISIONS`, `SPECIAL_CATEGORY_DATA`, `UNCERTAIN_CROSS_BORDER_APPLICABILITY`), and jurisdictions. No contact details are published.

**Mandatory specialist areas.** Obligations touching children's data, regulated sectors, international transfers, automated decision-making, special-category data, or uncertain cross-border applicability carry the matching `specialistAreas`. `skill-lint` requires these tags for obligations in the `children.*`, `transfers.*`, `automated-decisions.*`, and `special-category.*` families, and for sector packs.

**Runtime effects** (§8.3 step 0 and step 4): `PROVISIONAL` adds caveat `PROVISIONAL_RULE`, and the report counts obligations evaluated under provisional rules in the launch-state definition box. `REVIEW_REQUIRED` means legal-category obligations cannot contribute to `PASS` (they yield `LEGAL_REVIEW_REQUIRED(SOURCE_CHANGED)`), while a confirmed technical failure stays `FAIL` with caveat `RULE_REVIEW_REQUIRED`.

**Enforcement.** CI rejects authored review states, review records that reference unknown obligations, versions, or snapshots, and reviews added in the same PR by the PR's own author without maintainer approval (CODEOWNERS). CI publishes computed states as a build artifact and in the generated README pack table.

### 9.11 Source-status register (as of 2026-09-28)

These entries record **owner research of 2026-09-28** that directs pack authoring. They are not authority records. Before any dependent obligation is authored, each must be captured as a source record with a snapshot from the official publisher (§9.5).

| Item | Status as researched | Modeling decision | Still open |
| --- | --- | --- | --- |
| **UAE PDPL Executive Regulations** | Federal Decree-Law No. 45 of 2021 is in force, and Article 28 provides for Executive Regulations issued by the Cabinet. No executive regulation specific to Decree-Law 45/2021 was located in the official UAE legislation materials available on 2026-09-28. | Source `uae.fdl-45-2021` (`IN_FORCE`) is authoritative. Source `uae.fdl-45-2021.executive-regulations` is recorded as `EXPECTED_NOT_LOCATED`, with `expectedBy` pointing to Article 28. Obligations whose details depend on the regulations yield `UNKNOWN` or `LEGAL_REVIEW_REQUIRED(IMPLEMENTING_INSTRUMENT_PENDING)`. No details come from commentary. Source-watch searches the official platform for the instrument. | Whether and when the regulations are issued |
| **UK Data (Use and Access) Act 2025** | Royal Assent 2025-06-19. Commencement is staged: Commencement No. 6 brought the majority of Part 5 (data protection and privacy) provisions into force on 2026-02-05, and other provisions have separate dates (for example a Schedule 11 provision on 2026-03-31). | Each commencement regulation is its own source record. Each affected obligation in `uk-gdpr` and `uk-pecr` cites the specific commencement provision in `temporal.basis`, with its own `effectiveFrom`. Provisions not yet commenced have a null `effectiveFrom` ("Pending commencement"). | Exact provision-to-date mapping, captured from the commencement instruments |
| **EU AI Act Article 50** | Transparency obligations apply from 2026-08-02. Commission guidance specifies a limited transition until 2026-12-02 for the Article 50(2) marking and detection obligation for qualifying AI systems placed on the market before 2026-08-02. | One obligation per Article 50 paragraph, each with `effectiveFrom: 2026-08-02`. The Article 50(2) obligation has a transitional rule whose `appliesWhen` reads the owner fact `ai.systems[].placedOnMarketAt`, with `complianceFrom: 2026-12-02`. Applicability inputs: role per system (owner fact, or a `legalJudgment` when unsure), system behaviors (detected, owner-confirmed), and output content types. The Commission guidance is a separate source. | Role classification for each project's systems; the scope of "qualifying" systems, per the guidance text as captured |
| **US automatic renewal and cancellation** | The FTC's 2024 amended Negative Option ("Click-to-Cancel") Rule was vacated by the Eighth Circuit in July 2025. The FTC moved to conform its rules to the court decisions and opened a new Negative Option Rule proceeding in March 2026. ROSCA continues to apply to online negative-option offers and is enforced by the FTC. | The 2024 amendments are a `VACATED` source with `effectiveUntil` at the vacatur date and no current obligations. The new proceeding is a `PROPOSED` source (watched, no obligations). The new pack `us-ftc-rosca` covers material-term disclosure, express informed consent, and a simple stop mechanism. State automatic-renewal laws are separate packs. | Outcome of the new proceeding; the exact vacatur date and citation, captured at source-record time |
| **COPPA Rule amendments** | Published 2025-04-22, effective 2025-06-23, with a compliance deadline of 2026-04-22 for most amended requirements, subject to specified exceptions. The FTC's February 2026 age-verification policy statement describes conditions for the Commission's stated enforcement approach to age-verification technologies. It is not a Rule amendment. | Amended obligations carry `effectiveFrom: 2025-06-23` and `complianceFrom: 2026-04-22`, so they are `COMPLIANCE_REQUIRED` as of today. Excepted provisions carry their own dates. The policy statement is a separate `REGULATOR_GUIDANCE` source, versioned independently, and it informs `minors-readiness` age-assurance guidance and uncertainty notes. | The specific excepted provisions and their dates, captured from the Federal Register text |
