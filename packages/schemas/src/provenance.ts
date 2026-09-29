import type { RuleReviewState, TemporalState, TemporalValidity } from "./types.js";

export interface SourceSnapshot {
  id: string;
  source: string;
  retrievedAt: string;
  normalizer: { id: string; version: number };
  provisions: { id: string; hash: string; status?: string; inForceFrom?: string | null }[];
}

export interface RuleReview {
  id: string;
  reviewer: string;
  date: string;
  covers: { obligation: string; version: number }[];
  reviewedAgainst: { snapshot: string; provisionHashes: Record<string, string> }[];
  outcome: "APPROVED" | "APPROVED_WITH_NOTES" | "CHANGES_REQUESTED" | "NO_MATERIAL_CHANGE";
}

export interface Reviewer {
  id: string;
  specialisms: string[];
}

export interface ObligationRef {
  id: string;
  version: number;
  provisions: { source: string; provision: string }[];
  specialistAreas: string[];
}

const QUALIFYING = new Set(["APPROVED", "APPROVED_WITH_NOTES", "NO_MATERIAL_CHANGE"]);

export function reviewState(input: {
  obligation: ObligationRef;
  reviews: RuleReview[];
  snapshots: SourceSnapshot[];
  reviewers: Reviewer[];
}): { state: RuleReviewState; missingSpecialistAreas: string[] } {
  const latest = new Map<string, string>();
  for (const snap of input.snapshots) {
    for (const provision of snap.provisions) {
      latest.set(`${snap.source}:${provision.id}`, provision.hash);
    }
  }
  const qualifying = input.reviews.filter((review) => {
    if (!QUALIFYING.has(review.outcome)) return false;
    if (!input.reviewers.some((r) => r.id === review.reviewer)) return false;
    if (!review.covers.some((c) => c.obligation === input.obligation.id && c.version === input.obligation.version)) {
      return false;
    }
    return input.obligation.provisions.every((p) => {
      const key = `${p.source}:${p.provision}`;
      const current = latest.get(key);
      return review.reviewedAgainst.some((s) => s.provisionHashes[key] === current && current !== undefined);
    });
  });
  const covered = new Set<string>();
  for (const review of qualifying) {
    const reviewer = input.reviewers.find((r) => r.id === review.reviewer);
    reviewer?.specialisms.forEach((s) => covered.add(s));
  }
  const missing = input.obligation.specialistAreas.filter((area) => !covered.has(area));
  const anyPast = input.reviews.some((r) => r.covers.some((c) => c.obligation === input.obligation.id));
  if (qualifying.length > 0 && missing.length === 0) return { state: "REVIEWED", missingSpecialistAreas: [] };
  if (anyPast) return { state: "REVIEW_REQUIRED", missingSpecialistAreas: missing };
  return { state: "PROVISIONAL", missingSpecialistAreas: missing };
}

export function temporalState(temporal: TemporalValidity, evaluatedAsOf: string): TemporalState {
  if (temporal.effectiveUntil && evaluatedAsOf >= temporal.effectiveUntil) return "ENDED";
  const transition = temporal.transitionalRules?.find((rule) => rule.appliesWhen === "UNKNOWN");
  if (transition) return "UNDETERMINED";
  const active = temporal.transitionalRules?.find((rule) => rule.appliesWhen === "TRUE");
  const effectiveFrom = active?.effectiveFrom ?? temporal.effectiveFrom;
  const complianceFrom = active?.complianceFrom ?? temporal.complianceFrom ?? effectiveFrom;
  if (!effectiveFrom || evaluatedAsOf < effectiveFrom) return "NOT_YET_EFFECTIVE";
  if (complianceFrom && evaluatedAsOf < complianceFrom) return "EFFECTIVE_PRE_COMPLIANCE";
  return "COMPLIANCE_REQUIRED";
}
