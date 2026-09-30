# ADR 0004 — Temporal Validity on Individual Rules

> **SUPERSEDED / HISTORICAL DESIGN.** Belongs to the dropped platform architecture. See [`docs/current-model.md`](../../current-model.md).

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-09-28 |
| Decided by | Repository owner |
| Affects | §8.3, §8.12, §9.1, §9.4, §9.7, §32.1, §32.2, §32.4, thresholds, reports |

## Context

Legal applicability changes provision by provision, not pack by pack:

- The UK Data (Use and Access) Act 2025 is being commenced in stages by separate commencement regulations, with different provisions coming into force on different dates.
- EU AI Act Article 50 transparency obligations apply from 2026-08-02, but a transitional period for one sub-obligation depends on whether the system was placed on the market before that date.
- Amended COPPA Rule provisions have an effective date and a later compliance date.
- A federal rule can be vacated by a court, ending its effect without any change to the pack as a whole.
- Numeric thresholds (for example revenue thresholds adjusted over time) change on their own schedules.

A pack-level `effectiveFrom` cannot express any of these.

## Decision

Every obligation, and every threshold entry, carries a `temporal` block. Pack-level dates are removed.

```ts
interface TemporalValidity {
  publishedAt?: string;          // date the source instrument (or amendment) was published
  effectiveFrom: string | null;  // legal effect begins; null = not yet determined (e.g., awaiting commencement)
  complianceFrom?: string;       // date compliance is required, if later than effectiveFrom
  effectiveUntil?: string;       // repeal, expiry, sunset, or vacatur date
  endReason?: "REPEALED" | "EXPIRED" | "VACATED" | "SUPERSEDED" | "SUNSET";
  transitionalRules?: TransitionalRule[];
  basis: ProvisionRef[];         // provisions and commencement instruments these dates come from
  sourceAsOf: string;            // the date the sources above were last confirmed
}

interface TransitionalRule {
  id: string;
  appliesWhen: PredicateNode;    // three-valued; e.g., system placed on the market before a date
  effectiveFrom?: string;
  complianceFrom?: string;       // e.g., a later compliance date for pre-existing systems
  effectiveUntil?: string;
  note: string;
}
```

Evaluation is **as of a date**: the run's `evaluatedAsOf`, which defaults to the run date. `readyvibe … --as-of <date>` previews future obligations. The temporal state of each obligation is one of:

| Temporal state | Condition | Effect |
| --- | --- | --- |
| `NOT_YET_EFFECTIVE` | `evaluatedAsOf < effectiveFrom`, or `effectiveFrom` is null | Not used for status. Listed under "Upcoming obligations" when `effectiveFrom` is known, or "Pending commencement" when it is null. |
| `EFFECTIVE_PRE_COMPLIANCE` | `effectiveFrom ≤ evaluatedAsOf < complianceFrom` | Evaluated. A would-be `FAIL` from this obligation is reported as `WARNING(caveat = COMPLIANCE_PERIOD)`, with the compliance date. |
| `COMPLIANCE_REQUIRED` | `evaluatedAsOf ≥ complianceFrom` (or `≥ effectiveFrom` when there is no `complianceFrom`), and before `effectiveUntil` | Evaluated normally |
| `ENDED` | `evaluatedAsOf ≥ effectiveUntil` | Not evaluated; kept for history and diffs, with `endReason` shown |
| `UNDETERMINED` | A transitional rule's `appliesWhen` evaluates to `UNKNOWN` and the candidate dates would change the state | Never produces `FAIL` from this obligation. It produces `UNKNOWN(reason = OWNER_INPUT_PENDING)` with a question when the unknown is an owner fact (for example the market-placement date), or `LEGAL_REVIEW_REQUIRED(reason = TEMPORAL_UNDETERMINED)` when it is a legal judgment. |

A confirmed technical failure of a control is still a finding in its own category (for example `TRUST_CONSISTENCY` when a banner lies). Temporal state only governs the legal framing that obligations add.

Consistency rules checked by CI:

- `effectiveFrom` must not precede the commencement date recorded for its `basis` provisions in the latest source snapshot.
- An obligation whose basis provision is marked vacated, repealed, or not commenced in the latest snapshot must have matching `effectiveUntil` or null `effectiveFrom` values.
- `sourceAsOf` must not be older than the latest snapshot date of its basis sources by more than the pack's review interval.

## Consequences

- The rule schema gains `temporal`. The run identity gains `evaluatedAsOf`. Finding obligation entries record their temporal state.
- Reports gain "Upcoming obligations" and "Pending commencement" sections.
- The compliance diff reports findings that change purely because of the date (for example, "a compliance date passed; 2 findings changed from WARNING to FAIL").
- Pack CalVer remains the release version of the data. It is not a legal-effect date.
