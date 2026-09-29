export type Status =
  | "PASS"
  | "FAIL"
  | "WARNING"
  | "NOT_APPLICABLE"
  | "LEGAL_REVIEW_REQUIRED"
  | "UNKNOWN";

export type Confidence = "CONFIRMED" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type Plane =
  | "OBSERVED"
  | "IMPLEMENTED"
  | "CONFIGURED"
  | "DECLARED"
  | "OWNER_ASSERTED"
  | "INFERRED";

export type TemporalState =
  | "NOT_YET_EFFECTIVE"
  | "EFFECTIVE_PRE_COMPLIANCE"
  | "COMPLIANCE_REQUIRED"
  | "ENDED"
  | "UNDETERMINED";

export type RuleReviewState = "PROVISIONAL" | "REVIEWED" | "REVIEW_REQUIRED";

export type LaunchState =
  | "BLOCKED"
  | "CONDITIONALLY_READY"
  | "READY_WITH_REVIEW_ITEMS"
  | "TECHNICALLY_READY";

export type RemediationType =
  | "AUTOMATIC_SAFE_FIX"
  | "AUTOMATIC_WITH_VERIFICATION"
  | "OWNER_INPUT_REQUIRED"
  | "LEGAL_REVIEW_REQUIRED"
  | "MANUAL_ENGINEERING_REQUIRED";

export type ArtifactKind =
  | "reality-model"
  | "evidence-index"
  | "findings"
  | "plan"
  | "questions"
  | "ledger"
  | "report"
  | "launch-manifest"
  | "baseline"
  | "config";

export interface ArtifactEnvelope<T = unknown> {
  schemaVersion: string;
  kind: ArtifactKind;
  producer: { name: string; version: string; type: "ENGINE" | "SKILL" | "OWNER" };
  runId: string | null;
  createdAt: string;
  contentHash: string;
  data: T;
  extensions?: Record<string, unknown>;
}

export interface EvidenceRecord {
  id: string;
  type: string;
  collector: { kind: string; name: string; version: string };
  source: { file?: string; lines?: [number, number]; url?: string; commit?: string };
  observedAt: string;
  observedValue: unknown;
  sensitivity: "PUBLIC" | "INTERNAL" | "RESTRICTED";
  confidence: Confidence;
}

export interface Finding {
  id: string;
  fingerprint: string;
  controlId: string;
  controlVersion: number;
  ownerSkill: string;
  title: string;
  domain: string;
  status: Status;
  severity: Severity;
  confidence: Confidence;
  category: string;
  summary: string;
  whyItMatters: string;
  evidence: { id: string }[];
  remediation: { type: RemediationType; plan: string };
  tags: string[];
  obligations?: {
    id: string;
    pack: string;
    temporalState: TemporalState;
    reviewState: RuleReviewState;
  }[];
  legalReview?: { reason: string; question: string };
  unknown?: { reason: string; resolveBy: string };
  caveats?: string[];
}

export interface Question {
  id: string;
  configKey: string;
  text: string;
  why: string;
  kind: "TEXT" | "EMAIL" | "BOOLEAN" | "CHOICE" | "NUMBER";
  allowUnsure: true;
  blocking: boolean;
  group: string;
  askedBy: string;
}

export interface TemporalValidity {
  publishedAt?: string;
  effectiveFrom: string | null;
  complianceFrom?: string;
  effectiveUntil?: string;
  endReason?: "REPEALED" | "EXPIRED" | "VACATED" | "SUPERSEDED" | "SUNSET";
  basis: { source: string; provision: string }[];
  sourceAsOf: string | null;
  transitionalRules?: {
    id: string;
    appliesWhen: "TRUE" | "FALSE" | "UNKNOWN";
    complianceFrom?: string;
    effectiveFrom?: string;
    note: string;
  }[];
}
