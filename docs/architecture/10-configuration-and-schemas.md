# Part X — Configuration and Schemas

## 31. Configuration

### 31.1 Files

| File | Committed | Purpose |
| --- | --- | --- |
| `.readyvibe/config.yaml` | Yes | Owner facts, environments, execution policy, autonomy, scope, targets, budgets, CI policy |
| `.readyvibe/suppressions.yaml` | Yes | Scoped exceptions (§30.8) |
| `.readyvibe/reviews.yaml` | Yes | Owner and legal review records, answers to `legalJudgment` questions |
| `.readyvibe/baseline.json` | Yes | Accepted baseline (§38.3) |
| Environment variables | Never in repo | Credentials, referenced by name only |

`readyvibe init` creates `config.yaml` with detected values marked `# detected` and every owner field left `null` with a comment explaining why it matters. The file is valid YAML with a JSON Schema (`config.schema.json`) for editor completion and validation.

### 31.2 Provenance of owner facts

A fact may be a scalar, or an object carrying confirmation metadata. Both forms are `OWNER_ASSERTED`. The object form is recommended for legally relevant facts:

```yaml
operator:
  legalName:
    value: "Nova Labs Ltd"
    confirmedBy: "founder@nova.example"
    confirmedAt: 2026-09-20
    note: "Registered in England and Wales"
```

The engine separates `DETECTED`, `OWNER_SUPPLIED`, and `INFERRED` facts in every output (§6.3). An owner fact that conflicts with detected behavior is never used to override behavioral facts (§6.8). The conflict becomes a finding instead.

### 31.3 Full example

```yaml
# .readyvibe/config.yaml
schemaVersion: 1

project:
  productName: { value: "Nova", confirmedBy: "founder@nova.example", confirmedAt: 2026-09-20 }
  appRoot: "."                     # monorepos: path of the app to analyze
  description: "Collaborative note-taking for small teams."

operator:
  legalName: null                  # REQUIRED for privacy notices under most active packs
  country: "GB"                    # ISO 3166-1 alpha-2; never inferred from hosting
  freeZone: null                   # e.g., DIFC, ADGM — only if the operator is established there
  businessAddress: null            # required by some packs (e.g., commercial email) — never invented
  companyType: null                # e.g., "private limited company"
  annualGrossRevenueUSD: null      # used only by packs with thresholds; "unsure" is a valid answer
  consumersProcessedPerYear: null
  dpo: null                        # only if the operator has one; never generated

contacts:
  support: "support@nova.example"
  privacy: null
  security: null
  legal: null
  abuse: null
  accessibility: null

targets:
  markets: ["GB", "EU", "AE"]      # region groups (EU, EEA) expand via rules/regions.yaml
  excludedMarkets: []
  languages: ["en", "ar"]
  audience:
    minimumAge: 16                 # owner policy; must match Terms and signup
    childDirected: false
    educationProduct: false

packs:
  enable: []                       # force-enable (e.g., a sector pack)
  disable: []                      # force-disable, with a reason recorded in reviews.yaml
  regionalBehavior: false          # D-08; true requires a trusted region source

accessibility:
  target: { standard: WCAG, version: "2.2", level: AA }
  statement: false

business:
  model: "SUBSCRIPTION"            # FREE | ADS | SUBSCRIPTION | ONE_TIME | MARKETPLACE | DONATIONS | MIXED
  refundPolicy: null               # owner decision; placeholder until provided
  paymentPolicy: null

retention:                          # owner decisions; the system implements and discloses, never picks numbers
  users: null
  contactMessages: null
  logs: null
  auditLog: null
  analytics: null

ai:                                 # owner facts for AI-specific packs (§47, §9.11); "unsure" is valid
  systems:
    - id: "note-summarizer"          # matches a detected AI integration
      role: null                     # PROVIDER | DEPLOYER | BOTH | null (unsure → legalJudgment)
      placedOnMarketAt: null         # date first made available; drives transitional rules
      outputTypes: ["TEXT"]          # detected, owner-confirmed

vendors:                            # owner-attested account settings that cannot be detected from code
  posthog: { region: "EU", ipCapture: "disabled", retention: "1 year", attestedAt: 2026-09-20 }
  openai: { dataRetention: null, trainingOptOut: null }

environments:
  - id: local
    kind: LOCAL
    baseUrl: "http://localhost:3000"
    allowedProbeClasses: [PASSIVE, INTERACTIVE_NON_MUTATING, SUBMITTING, MUTATING_TEST_DATA, DESTRUCTIVE_TEST_DATA, LOAD_SENSITIVE]
    testUsers:
      seed: { method: "SIGNUP_FLOW" }   # SIGNUP_FLOW | SEED_COMMAND | PROVIDER_TEST_USERS | NONE
      credentialsEnv: { userA: "RV_TEST_USER_A", userB: "RV_TEST_USER_B", admin: "RV_TEST_ADMIN" } # env var NAMES only
    mailCatcher: { kind: "MAILPIT", apiUrl: "http://localhost:8025" }
  - id: preview
    kind: PREVIEW
    baseUrl: null                  # set per PR in CI
    allowedProbeClasses: [PASSIVE, INTERACTIVE_NON_MUTATING, MUTATING_TEST_DATA]
  - id: production
    kind: PRODUCTION
    baseUrl: "https://nova.example"
    allowedProbeClasses: [PASSIVE, INTERACTIVE_NON_MUTATING]

productionOrigins: ["https://nova.example", "https://www.nova.example"]
canonicalHost: "https://nova.example"

execution:
  allowProjectScripts: false       # build/dev/test/lint/format commands require explicit opt-in (§40.2)
  allowedScripts: []               # e.g., ["build", "lint", "test"] when allowProjectScripts is true
  sandbox: "none"                  # none | container
  network:
    dependencyAuditOnline: true    # sends package names/versions to the audit database (§23.10)
    allowExternalApis: []          # e.g., ["search-console", "crux"]
  credentialsEnv:
    searchConsoleOAuth: null       # env var name
    cruxApiKey: null

autonomy:
  level: "propose"                 # audit | propose | safe-fixes | full-with-approval
  approvals:
    AUTOMATIC_SAFE_FIX: "batch"
    AUTOMATIC_WITH_VERIFICATION: "per-change-set"
  git: "none"                      # none | commit | pr
  keepSnapshots: false

seo:
  routes:                          # owner overrides for route intent
    "/changelog/**": PUBLIC_INDEXABLE
    "/share/**": PUBLIC_NOINDEX
  trailingSlash: null              # null = keep framework default

consent:
  categoriesUsed: null             # derived; owner can restrict
  records: "when-required"         # never | when-required | always

budgets:
  maxWaves: 6
  maxRepairAttemptsPerChangeSet: 1
  maxRunMinutes: 90
  performance: { lcpMs: null, jsKbPerRoute: null }   # set to create OWNER_POLICY controls

ci:
  blocking:
    categories: [LEGAL_REQUIREMENT, REGULATORY_GUIDANCE, TECHNICAL_SECURITY, ACCESSIBILITY_STANDARD, TRUST_CONSISTENCY]
    minSeverity: HIGH
    controls: [SEO.PRODUCTION_NOINDEX, SEO.PRIVATE_ROUTE_IN_SITEMAP, CONSENT.PRE_CONSENT_NONESSENTIAL, SEC.SECRET_IN_CLIENT_BUNDLE, RIGHTS.DELETION_IS_SOFT]
    legalReviewBlocks: false       # LEGAL_REVIEW_REQUIRED does not fail CI unless set
    unknownBlocks: false
  failOn: ["NEW", "REGRESSED"]     # baseline classifications that fail CI
```

### 31.4 Autonomy levels

| Level | Behavior |
| --- | --- |
| `audit` | Discover, analyze, report. No change sets proposed. |
| `propose` (default) | Also produces change sets and a plan. Applies nothing without approval. |
| `safe-fixes` | Applies `AUTOMATIC_SAFE_FIX` in batch after one approval; everything else per change set |
| `full-with-approval` | Proposes the full plan, applies approved classes in waves, runs the repair loop, and asks only for questions and per-change-set approvals of `AUTOMATIC_WITH_VERIFICATION` |

There is no fully unattended mode that applies behavior-changing fixes without any approval. CI mode (§38) never mutates code.

### 31.5 Precedence

CLI flags > environment variables (only for credentials and CI-provided URLs) > `config.yaml` > detected defaults. Owner facts cannot be supplied by CLI flags, so that business facts always live in reviewable, committed configuration.

---

## 32. Schemas

### 32.0 Governance (Decision D-18)

- **Canonical format: JSON Schema 2020-12** in `packages/schemas/*.schema.json`. TypeScript types are generated (`packages/schemas/types/*.d.ts`). The pseudotypes below are the design reference and match the generated types.
- Why JSON Schema: packs, configs, contracts, and artifacts are authored in YAML by contributors, validated in editors (YAML language server), in CI, and at runtime, and potentially consumed by non-TypeScript tools. TypeScript-first (for example zod as the source) would make non-TS validation second-class.
- Every artifact carries `schemaVersion`. Minor versions are additive. Major versions come with engine-provided migrations (`readyvibe migrate`).
- Schema index:

| Schema | Defined in |
| --- | --- |
| Reality Model and entities | §6.6 |
| CoverageRecord | §6.5 |
| Evidence | §7.4 |
| Control | §8.8 |
| Pack manifest, obligations | §9.1, §32.4 |
| Consent state and records | §13.2, §13.6 |
| Audience assessment | §14.2 |
| MessageStream, EmailSuppressionEntry | §16.2, §16.4 |
| RightsMatrixEntry, RightsRequest | §17.2, §17.3 |
| IdentityModel | §21.5 |
| Vendor | §26.2 |
| DeclaredClaim, Assertion | §27.2 |
| Persona | §29.4 |
| LaunchManifest | §30.5 |
| DesignSystemModel, ComponentReusePlan | §51.2, §51.5 |
| AdminCapabilityModel, AdminModule, AdminAuditEvent, AttentionSignal | §52 |
| Common primitives (incl. `TemporalValidity`), Finding, dispositions, remediation, change sets, ledger, verification, skill contract, questions, decisions, run state, report, baseline, compliance diff | Below |
| Source records, snapshots, reviewers, rule reviews, computed review status | §32.12 |
| Artifact envelope | §32.13 |

### 32.1 Common primitives

```ts
type Id<T extends string> = string & { readonly __kind: T };
type EvidenceId = Id<"evidence">; type FactId = Id<"fact">; type FindingId = Id<"finding">;
type ControlId = string;          // "CONSENT.PRE_CONSENT_NONESSENTIAL"
type ObligationId = string;       // "EU-EPRIVACY.ART5_3.STORAGE_ACCESS_CONSENT"
type PackId = string;             // "eu-eprivacy"
type SkillName = string;          // "consent-management"
type PersonaId = string; type EnvironmentId = string; type RouteId = string; type VendorId = string;
type QuestionId = string; type CapabilityId = string;

type Status = "PASS" | "FAIL" | "WARNING" | "NOT_APPLICABLE" | "LEGAL_REVIEW_REQUIRED" | "UNKNOWN";
type Confidence = "CONFIRMED" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
type HarmLevel = "none" | "low" | "moderate" | "severe";
type Plane = "OBSERVED" | "IMPLEMENTED" | "CONFIGURED" | "DECLARED" | "OWNER_ASSERTED" | "INFERRED";
type RuleCategory =
  | "LEGAL_REQUIREMENT" | "REGULATORY_GUIDANCE" | "PLATFORM_POLICY" | "TECHNICAL_SECURITY"
  | "ACCESSIBILITY_STANDARD" | "SEARCH_BEST_PRACTICE" | "PERFORMANCE_BEST_PRACTICE"
  | "LAUNCH_QUALITY" | "TRUST_CONSISTENCY" | "OWNER_POLICY";
type RemediationType =
  | "AUTOMATIC_SAFE_FIX" | "AUTOMATIC_WITH_VERIFICATION" | "OWNER_INPUT_REQUIRED"
  | "LEGAL_REVIEW_REQUIRED" | "MANUAL_ENGINEERING_REQUIRED";
type LaunchState = "BLOCKED" | "CONDITIONALLY_READY" | "READY_WITH_REVIEW_ITEMS" | "TECHNICALLY_READY";

interface EvidenceRef { id: EvidenceId; role?: "PRIMARY" | "SUPPORTING" | "COUNTER" }
interface CodeLocation { file: string; lines?: [number, number]; symbol?: string }

interface Fact {
  id: FactId;
  subject: string;                       // entity reference, e.g., "clientStorage:_ga@.nova.example"
  predicate: string;                     // "setBeforeConsent"
  value: unknown;
  plane: Plane;
  provenance: { producer: string; producerVersion: string; method: "STATIC" | "RUNTIME" | "CONFIG" | "OWNER" | "HEURISTIC" | "LLM" };
  confidence: Confidence;
  evidence: EvidenceRef[];               // ≥1 unless plane = OWNER_ASSERTED (then the owner statement evidence)
  assertedAt: string;
  supersedes?: FactId;
}

interface RunIdentity {
  runId: string;
  commit: string;
  treeDigest: string;
  engineVersion: string;
  packVersions: Record<PackId, string>;
  vendorCatalogVersion: string;
  environments: EnvironmentId[];
  personas: PersonaId[];
  startedAt: string;
  evaluatedAsOf: string;                 // date used for temporal validity (§8.12); defaults to the run date
}

/** Rule-level legal-effect interval (ADR 0004). Used by obligations and threshold entries. */
interface TemporalValidity {
  publishedAt?: string;
  effectiveFrom: string | null;          // null = commencement pending / not determined
  complianceFrom?: string;
  effectiveUntil?: string;
  endReason?: "REPEALED" | "EXPIRED" | "VACATED" | "SUPERSEDED" | "SUNSET";
  transitionalRules?: TransitionalRule[];
  basis: ProvisionRef[];                 // provisions / commencement instruments the dates come from
  sourceAsOf: string | null;             // null only while the pack is being authored (lint blocks release)
}

interface TransitionalRule {
  id: string;
  appliesWhen: PredicateNode;            // three-valued (§8.4)
  effectiveFrom?: string;
  complianceFrom?: string;
  effectiveUntil?: string;
  precedence?: number;                   // required when several rules can be TRUE together
  note: string;
}

interface ProvisionRef { source: string; provision: string }   // ids in rules/sources/ (§32.12)

type TemporalState = "NOT_YET_EFFECTIVE" | "EFFECTIVE_PRE_COMPLIANCE" | "COMPLIANCE_REQUIRED" | "ENDED" | "UNDETERMINED";
type RuleReviewState = "PROVISIONAL" | "REVIEWED" | "REVIEW_REQUIRED";   // computed (§9.10), never authored
```

### 32.2 Finding

```ts
interface Finding {
  id: FindingId;                          // unique per run
  fingerprint: string;                    // stable across runs (§8.6)
  controlId: ControlId;
  controlVersion: number;
  ownerSkill: SkillName;
  title: string;
  domain: string;
  status: Status;
  suspected?: boolean;                    // WARNING from MEDIUM evidence
  caveats?: ("LOW_CONFIDENCE_PASS" | "SEMANTIC_ASSESSMENT" | "DEGRADED_COLLECTION" | "FLAKY" | "STATIC_ONLY" | "PROVISIONAL_RULE" | "RULE_REVIEW_REQUIRED" | "COMPLIANCE_PERIOD" | "STALE_SOURCE")[];
  severity: Severity;
  confidence: Confidence;
  category: RuleCategory;                 // displayed (highest-ranked)
  categories: RuleCategory[];             // all mapped
  priority: { rank: number; factors: Record<string, string> };   // ordering only (§8.7)
  summary: string;
  whyItMatters: string;
  applicability: {
    result: "TRUE" | "FALSE" | "UNKNOWN";
    basis: FactId[];
    coverage?: string;                    // CoverageRecord id when FALSE via absence
  };
  scope: { unit: string; key: string; instances?: string[] };
  obligations: {
    id: ObligationId;
    pack: PackId;
    packActivation: "CONFIRMED" | "CANDIDATE";
    family: string;
    obligationVersion: number;
    temporalState: TemporalState;         // as of identity.evaluatedAsOf
    complianceFrom?: string;              // shown when EFFECTIVE_PRE_COMPLIANCE
    reviewState: RuleReviewState;         // computed at engine build time from review records + snapshots
    freshness: "FRESH" | "STALE" | "STALE_CRITICAL";
  }[];
  jurisdictions: string[];                // derived from obligations
  evidence: EvidenceRef[];                // minItems 1 for PASS | FAIL | WARNING | NOT_APPLICABLE
  affectedFiles: CodeLocation[];
  affectedRoutes: RouteId[];
  remediation: {
    type: RemediationType;
    plan: string;                         // human-readable
    changeSetIds: string[];
    questions: QuestionId[];
    options?: { id: string; label: string; consequence: string; recommended?: boolean }[]; // e.g., contradiction directions
    forbidden?: string[];
  };
  verificationProcedure: { probes: string[]; personas: PersonaId[]; assertions: string[] };
  verificationResult?: { status: "VERIFIED" | "FAILED" | "UNVERIFIED" | "FLAKY"; evidence: EvidenceRef[]; at: string };
  sourceAuthorities: { id: string; kind: string; title: string; url: string; pinpoint?: string; retrievedAt: string }[];
  legalReview?: {
    reason: "INTERPRETATION" | "THRESHOLD_UNDETERMINED" | "SCOPE_UNCONFIRMED" | "CONFLICTING_AUTHORITIES" | "DOCUMENT_REVIEW" | "TRANSLATION_REVIEW" | "SOURCE_STALE" | "SOURCE_CHANGED" | "IMPLEMENTING_INSTRUMENT_PENDING" | "TEMPORAL_UNDETERMINED" | "DPIA_ASSESSMENT" | "PCI_SCOPE_DETERMINATION" | "SERVICE_CLASSIFICATION";
    question: string;                     // precise question for counsel
    factsGathered: FactId[];
  };
  unknown?: { reason: "INSUFFICIENT_COVERAGE" | "OWNER_INPUT_PENDING" | "MISSING_FACTS" | "PROBE_FAILED" | "EVALUATOR_INDETERMINATE" | "WEAK_SIGNAL" | "FLAKY" | "SKILL_FAILED" | "PRODUCER_SKILL_MISSING" | "EXTERNAL_DATA_REQUIRED" | "MANUAL_REVIEW_REQUIRED"; resolveBy: string };
  disposition: Disposition;
  tags: string[];
  baseline?: "NEW" | "UNCHANGED" | "RESOLVED" | "REGRESSED" | "EXPIRED_SUPPRESSION";
}

interface Disposition {
  state: "OPEN" | "SUPPRESSED_FALSE_POSITIVE" | "ACCEPTED_RISK" | "DEFERRED" | "LEGAL_REVIEWED" | "OWNER_REVIEWED" | "FIXED_PENDING_VERIFICATION" | "VERIFIED_FIXED";
  ref?: string;                           // suppression or review record id
  expiresAt?: string;
}
```

### 32.3 Project review records (target project `reviews.yaml`)

These record owner and counsel decisions **for one target project**. Reviews of ReadyVibe's own rule packs are a different schema (`RuleReview`, §32.12).

```ts
interface ReviewRecord {
  id: string;
  kind: "LEGAL" | "OWNER" | "ACCESSIBILITY_EXPERT" | "SECURITY_EXPERT";
  reviewer: { name: string; role: string; organization?: string };   // provided by the owner; not verified by the system
  scope:
    | { findingFingerprint: string }
    | { document: string; version: string; locale?: string }
    | { legalJudgment: string; answer: unknown }
    | { pack: PackId; decision: "ENABLE" | "DISABLE"; reason: string };
  outcome: "APPROVED" | "APPROVED_WITH_CHANGES" | "REJECTED" | "ANSWERED";
  notes?: string;
  date: string;
  expiresAt?: string;                     // e.g., re-review annually
}
```

### 32.4 Obligation

```ts
interface Obligation {
  id: ObligationId;
  pack: PackId;
  version: number;
  family: string;
  category: RuleCategory;
  title: string;
  requirement: string;                    // paraphrase; short quotes only
  authorities: (ProvisionRef & { kind: SourceKind; excerpt?: { text: string; attribution: string } })[]; // excerpt within source excerptPolicy; never in CC0 paths
  applicability: PredicateNode;
  exclusions: { text: string; predicate?: PredicateNode }[];
  satisfiedBy: { control: ControlId; expect: "PASS" | "PASS_OR_NA"; params?: Record<string, unknown> }[];
  evidenceNeeded: string[];
  technicalImplication: string;
  userFacingImplication: string;
  severity: Severity;
  remediationGuidance?: string;
  verification?: string;
  uncertainty?: string;
  legalReviewTriggers: { id: string; when: PredicateNode; question: string }[];
  temporal: TemporalValidity;             // §8.12 — legal effect is per obligation
  specialistAreas: SpecialistArea[];      // §9.10
  nextReviewBy: string;                   // freshness (§9.6)
  supersedes?: ObligationId;
  // NOTE: no review/status field. Review state is computed (§9.10); CI rejects authored states.
}

type PredicateNode =
  | { all: PredicateNode[] } | { any: PredicateNode[] } | { not: PredicateNode }
  | { capability: CapabilityId | { id: CapabilityId; allow: ("PRESENT" | "SUSPECTED" | "ABSENT")[] } }
  | { fact: { predicate: string; op: string; value?: unknown; minConfidence?: Confidence; planes?: Plane[] } }
  | { ownerFact: { key: string; op: string; value?: unknown } }
  | { legalJudgment: { id: string } }
  | { builtin: { id: string; args?: Record<string, unknown> } }
  | { scope: "pack-active" };
```

### 32.5 Remediation, change sets, and ledger

```ts
interface ChangeSet {
  id: string;
  runId: string;
  ownerSkill: SkillName;
  findings: FindingId[];
  remediationType: RemediationType;
  wave: number;
  visualChanges: boolean;
  reusePlan?: string;                     // ComponentReusePlan id (required when visualChanges)
  writeSet: { file: string; semanticKeys: string[]; operation: "CREATE" | "MODIFY" | "DELETE" }[];
  operations: (
    | { kind: "CAPABILITY_OP"; op: string; args: Record<string, unknown>; adapter: string }
    | { kind: "AGENT_EDIT"; description: string; patch: string /* unified diff artifact hash */ }
  )[];
  newDependencies: { name: string; version: string; reason: string; license: string }[];
  newDataElements: { name: string; purpose: string }[];
  newVendors: { id: string; reason: string }[];
  verificationProcedure: Finding["verificationProcedure"];
  approval: { state: "PENDING" | "APPROVED" | "REJECTED"; by?: string; at?: string };
  status: "PROPOSED" | "APPLIED" | "VERIFIED" | "FAILED" | "ROLLED_BACK";
  snapshotRef?: string;
  repairAttempts: number;
}

interface LedgerEntry {
  semanticKey: string;                    // "head:meta:og:image@route:/blog/[slug]"
  ownerSkill: SkillName;
  file: string;
  locator: string;                        // adapter-specific structural locator
  contentHash: string;
  changeSetId: string;
  runId: string;
  writtenAt: string;
  state: "MANAGED" | "USER_MODIFIED" | "USER_REMOVED_DECLINED";
}

interface ChangeRequest {                 // non-owner asking an owner to change its artifact
  id: string;
  from: SkillName;
  to: SkillName;
  artifact: string;                       // artifact name or semantic key
  request: string;
  reason: FindingId[];
  status: "OPEN" | "ACCEPTED" | "DECLINED";
}

interface Decision {                      // policy-level conflict or choice needing the owner
  id: string;
  question: string;
  options: { id: string; label: string; consequences: string[]; satisfies: FindingId[]; violates: FindingId[] }[];
  recommended?: string;
  precedenceApplied?: string;             // when resolved by delegated precedence (§11.6)
  resolution?: { option: string; by: string; at: string };
}
```

### 32.6 Verification

```ts
interface VerificationResult {
  id: string;
  runId: string;
  kind: "WAVE" | "FINAL";
  environment: EnvironmentId;
  persona: PersonaId;
  probe: string;
  assertions: { id: string; controlId: ControlId; scopeKey: string; outcome: "MET" | "NOT_MET" | "INDETERMINATE"; evidence: EvidenceRef[] }[];
  attempts: number;
  consistent: boolean;
  startedAt: string;
  durationMs: number;
  errors?: string[];
}
```

### 32.7 Skill contract

```ts
interface SkillContract {
  name: SkillName;                        // == directory name == SKILL.md frontmatter name
  version: string;                        // SemVer (§41.2)
  contract: 1;                            // contract schema major
  kind: "BUNDLE" | "ORCHESTRATOR" | "FOUNDATION" | "SPECIALIST" | "AUDITOR";
  category: string;
  visual: "NON_VISUAL" | "MOSTLY_NON_VISUAL" | "POTENTIALLY_VISUAL" | "VISUAL" | "VISUAL_CONTENT" | "VISUAL_BEHAVIORAL";
  engine: string;                         // SemVer range of @readyvibe/cli
  purpose: string;
  activation: PredicateNode;
  consumes: string[];                     // artifact names
  produces: string[];
  controlsOwned: string[];                // namespace globs
  mutation: {
    mayCreate: string[];                  // adapter-resolved path templates
    mayModify: { semanticKey: string; when?: string; coordinateWith?: SkillName[] }[];
    mustNotModify: string[];
  };
  questions: QuestionId[];
  verification: { personas: PersonaId[]; probes: string[] };
  failure: { onVerificationFail: "repair-once-then-rollback" | "rollback" | "report-only"; onMissingInputs: "report-unknown" | "run-minimal-recon" };
  legalReviewTriggers: string[];
  bundles: SkillName[];                   // bundles that include this skill
  profile?: string;                       // bundles only
  members?: SkillName[];                  // bundles only: for bootstrap (§53.5)
  memberRanges?: Record<SkillName, string>; // bundles only: compatible SemVer range per member
  deprecated?: { since: string; replacedBy?: SkillName; removalNotBefore: string };
}
```

### 32.8 Run state

```ts
interface RunState {
  runId: string;
  identity: RunIdentity;
  profile: string;
  state: "CREATED" | "RECON_STATIC" | "RECON_RUNTIME" | "MODEL_BUILT" | "CLASSIFIED" | "SCOPED" | "SEALED" | "PLANNED" | "ANALYZED" | "CONTRADICTIONS_CHECKED" | "AWAITING_APPROVAL" | "REMEDIATING" | "VERIFYING_FINAL" | "REPORTED" | "BASELINE_PROPOSED" | "PAUSED" | "STOPPED";
  wave?: number;
  pausedReason?: string;
  stoppedReason?: "FIXED_POINT" | "BLOCKED_ON_OWNER" | "BUDGET" | "SAFETY" | "INTEGRITY" | "BREAKAGE" | "USER";
  selectedSkills: { name: SkillName; mode: "audit" | "plan" | "remediate"; reason: string }[];
  skippedSkills: { name: SkillName; reason: "NOT_APPLICABLE" | "OUT_OF_PROFILE" | "NOT_INSTALLED"; evidence?: string }[];
  phaseInputsHash: Record<string, string>;   // idempotent phase re-runs
  modelRevisions: string[];
  degraded: boolean;
}
```

### 32.9 Questions

```ts
interface Question {
  id: QuestionId;                         // "operator.legalName"
  configKey: string;                      // where the answer is stored
  text: string;                           // plain language
  why: string;                            // what it changes
  kind: "TEXT" | "EMAIL" | "COUNTRY_LIST" | "BOOLEAN" | "CHOICE" | "DURATION" | "NUMBER";
  choices?: { value: string; label: string }[];
  allowUnsure: true;                      // always
  unblocks: FindingId[];
  blocking: boolean;
  group: "IDENTITY" | "MARKETS" | "AUDIENCE" | "DATA" | "EMAIL" | "COMMERCE" | "SEARCH" | "DESIGN" | "ADMIN" | "OPERATIONS";
  askedBy: SkillName;
  answer?: { value: unknown; unsure: boolean; by: string; at: string };
}
```

### 32.10 Report

```ts
interface Report {
  schemaVersion: "1.0";
  identity: RunIdentity;
  launchState: LaunchState;
  launchStateConditions: string[];        // why this state; what would change it
  profile: string;
  packs: {
    id: PackId; version: string;
    activation: "CONFIRMED" | "CANDIDATE" | "EXCLUDED" | "INACTIVE"; basis: FactId[];
    reviewRollup: "REVIEWED" | "PARTIALLY_REVIEWED" | "PROVISIONAL";
    obligationsByReviewState: Record<RuleReviewState, number>;
    freshness: "FRESH" | "STALE" | "STALE_CRITICAL";
  }[];
  upcomingObligations: { id: ObligationId; effectiveFrom: string | null; complianceFrom?: string; pendingCommencement: boolean }[];
  endedObligations: { id: ObligationId; effectiveUntil: string; endReason: string }[];
  counts: { overall: Record<Status, number>; byDomain: Record<string, Record<Status, number>>; byCategory: Record<RuleCategory, Record<Status, number>> };
  findings: Finding[];
  questions: Question[];
  decisions: Decision[];
  changeSets: ChangeSet[];
  verification: VerificationResult[];
  coverage: CoverageRecord[];
  notApplicable: { controlId: ControlId; reason: string; coverage?: string }[];
  notChecked: { area: string; reason: string }[];
  degraded: boolean;
  lint: { passed: boolean; violations: string[] };
}
```

### 32.11 Baseline and compliance diff

```ts
interface Baseline {
  schemaVersion: "1.0";
  acceptedAt: string;
  acceptedBy: string;
  commit: string;
  findings: { fingerprint: string; controlId: ControlId; status: Status; disposition: Disposition["state"] }[];
  factDigest: {                           // summarized inventories for semantic diffing
    vendors: { id: string; categories: string[]; consentCategory: string }[];
    storage: { key: string; purpose: string }[];
    dataElements: { name: string; dataClass: string; recipients: string[] }[];
    routes: { pattern: string; intent: string; indexable: boolean | null; auth: string }[];
    capabilities: Record<CapabilityId, string>;
    documents: { id: string; version: string; factsSnapshotHash: string }[];
    headers: Record<string, string>;
  };
}

interface ComplianceDiff {
  base: { commit: string; source: "BASELINE" | "RUN" };
  head: { commit: string; mode: "STATIC" | "RUNTIME" };
  deltas: SemanticDelta[];
  implications: Implication[];
  findingChanges: { fingerprint: string; change: "NEW" | "RESOLVED" | "REGRESSED" | "STATUS_CHANGED"; from?: Status; to?: Status }[];
}

interface SemanticDelta {
  kind: string;                           // catalog in §39.3, e.g., "VENDOR_ADDED", "DATA_ELEMENT_ADDED", "ROUTE_INTENT_CHANGED"
  subject: string;
  before?: unknown;
  after?: unknown;
  evidence: EvidenceRef[];
  confidence: Confidence;                 // static-only deltas are at most HIGH
}

interface Implication {
  delta: number;                          // index into deltas
  affects: ("PRIVACY_POLICY" | "COOKIE_NOTICE" | "CONSENT" | "CSP" | "VENDOR_INVENTORY" | "DATA_INVENTORY" | "RIGHTS_PLANS" | "RETENTION" | "MINORS" | "SITEMAP" | "INDEXABILITY" | "ACCESSIBILITY" | "SECURITY" | "IDENTITY" | "TERMS")[];
  rulesToReevaluate: ControlId[];
  documentsPotentiallyStale: string[];
  questions: QuestionId[];
  severity: Severity;
  summary: string;                        // one sentence for the PR comment
}
```

### 32.12 Source and rule-review provenance (ADR 0001, ADR 0003)

```ts
type SourceKind = "STATUTE" | "REGULATION" | "REGULATOR_GUIDANCE" | "OFFICIAL_GOVERNMENT" | "STANDARD" | "OFFICIAL_DOCUMENTATION" | "SECONDARY";

type SpecialistArea =
  | "CHILDREN" | `REGULATED_SECTOR:${string}` | "CROSS_BORDER_TRANSFER" | "AUTOMATED_DECISIONS"
  | "SPECIAL_CATEGORY_DATA" | "UNCERTAIN_CROSS_BORDER_APPLICABILITY";

interface SourceRecord {                    // rules/sources/<id>/source.yaml
  id: string;                               // "uae.fdl-45-2021"
  kind: SourceKind;
  title: string;
  publisher: string;
  officialUrl: string | null;               // null only for EXPECTED_NOT_LOCATED
  identifiers?: Record<string, string>;     // CELEX, ELI, CFR part, gazette number, …
  legalStatus: "IN_FORCE" | "PARTIALLY_IN_FORCE" | "NOT_YET_IN_FORCE" | "EXPECTED_NOT_LOCATED" | "PROPOSED" | "REPEALED" | "VACATED" | "SUPERSEDED";
  expectedBy?: ProvisionRef;                // for EXPECTED_NOT_LOCATED: the provision requiring the instrument
  searchedIn?: { location: string; searchedAt: string }[];   // for EXPECTED_NOT_LOCATED
  ended?: { at: string; by: string };       // for VACATED / REPEALED / SUPERSEDED: date and deciding instrument/court decision
  granularity: "PROVISION" | "DOCUMENT";
  excerptPolicy: { allowed: boolean; maxCharsPerExcerpt: number; attribution: string };
  related?: { source: string; relation: "AMENDS" | "COMMENCES" | "IMPLEMENTS" | "INTERPRETS" | "SUPERSEDES" | "VACATES" }[];
}

interface SourceSnapshot {                  // rules/sources/<id>/snapshots/<date>.yaml — hashes only, no text
  id: string;                               // "<sourceId>@<retrievedAt>"
  source: string;
  retrievedAt: string;
  retrievedFrom: string;
  versionLabel: string | null;              // official consolidation/version label
  normalizer: { id: string; version: number };
  documentHash: string;
  provisions: {
    id: string;                             // "art-50-2", "s-112", "sch-11-para-3"
    hash: string;                           // sha256 of normalized provision text
    status: "IN_FORCE" | "NOT_YET_IN_FORCE" | "PARTIALLY_IN_FORCE" | "REPEALED" | "VACATED";
    inForceFrom?: string | null;
    commencedBy?: ProvisionRef;             // commencement instrument
  }[];
}

interface Reviewer {                        // rules/reviewers.yaml — only what the reviewer consents to publish
  id: string;
  displayName: string;                      // or public handle
  professionalReference?: string;           // e.g., registration reference or public profile URL
  specialisms: SpecialistArea[];
  jurisdictions: string[];
  consentToPublish: true;
}

interface RuleReview {                      // rules/packs/<pack>/reviews/<date>-<reviewer>.yaml
  id: string;
  reviewer: string;                         // Reviewer.id
  date: string;
  covers: { obligation: ObligationId; version: number }[];
  reviewedAgainst: { snapshot: string; provisionHashes: Record<string, string> }[];
  outcome: "APPROVED" | "APPROVED_WITH_NOTES" | "CHANGES_REQUESTED" | "NO_MATERIAL_CHANGE";
  notes?: string;
}

interface ComputedReviewStatus {            // generated by CI; never committed by hand
  obligation: ObligationId;
  version: number;
  state: RuleReviewState;
  qualifyingReviews: string[];
  missingSpecialistAreas: SpecialistArea[];
  changedProvisions: ProvisionRef[];        // reasons for REVIEW_REQUIRED
}
```

### 32.13 Artifact envelope (`.readyvibe/` interchange contract, §5.5)

```ts
interface ArtifactEnvelope<T> {
  schemaVersion: string;                    // "1.0" — major must be supported by the reader
  kind: ArtifactKind;                       // "reality-model" | "evidence-index" | "findings" | "plan" | "questions" | "ledger" | "report" | "launch-manifest" | "baseline" | "config" | …
  producer: { name: string; version: string; type: "ENGINE" | "SKILL" | "OWNER" };
  runId: string | null;                     // null for committed, run-independent artifacts (config, ledger, baseline)
  createdAt: string;
  contentHash: string;                      // sha256 of canonical JSON of `data`
  data: T;
  extensions?: Record<string, unknown>;     // namespaced ("x-<producer>") — preserved by readers, never interpreted
}
```
