import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readArtifact, seal, validateArtifact, writeArtifact } from "./artifact.js";
import { ArtifactError } from "./errors.js";
import { reviewState, temporalState } from "./provenance.js";
import type { ArtifactEnvelope } from "./types.js";

const questions = {
  questions: [
    {
      id: "operator.legalName",
      configKey: "operator.legalName",
      text: "What is the operator's legal name?",
      why: "Privacy notices need it.",
      kind: "TEXT",
      allowUnsure: true as const,
      blocking: true,
      group: "IDENTITY",
      askedBy: "readyvibe-install-canary",
    },
  ],
};

function envelope(data: unknown, overrides: Record<string, unknown> = {}): ArtifactEnvelope {
  return seal({
    schemaVersion: "1.0",
    kind: "questions",
    producer: { name: "canary", version: "0.0.0", type: "SKILL" },
    runId: "run-test",
    createdAt: "2026-09-29T00:00:00Z",
    data,
    ...overrides,
  });
}

describe("artifact envelope", () => {
  it("accepts a sealed questions artifact", () => {
    const sealed = envelope(questions);
    expect(validateArtifact(sealed).kind).toBe("questions");
  });

  it("rejects a missing envelope field", () => {
    const sealed = envelope(questions) as unknown as Record<string, unknown>;
    delete sealed.createdAt;
    expect(() => validateArtifact(sealed)).toThrowError(expect.objectContaining({ code: "ARTIFACT_INVALID" }));
  });

  it("rejects an unsupported major", () => {
    const sealed = envelope(questions);
    sealed.schemaVersion = "2.0";
    expect(() => validateArtifact(sealed, { checkHash: false })).toThrowError(
      expect.objectContaining({ code: "ARTIFACT_MAJOR_UNSUPPORTED" }),
    );
  });

  it("rejects a tampered payload", () => {
    const sealed = envelope(questions);
    sealed.data = { ...questions, questions: [] };
    expect(() => validateArtifact(sealed)).toThrowError(
      expect.objectContaining({ code: "ARTIFACT_HASH_MISMATCH" }),
    );
  });

  it("rejects skill-produced findings", () => {
    expect(() =>
      validateArtifact({
        schemaVersion: "1.0",
        kind: "findings",
        producer: { name: "skill", version: "0.0.0", type: "SKILL" },
        runId: "r",
        createdAt: "2026-09-29T00:00:00Z",
        contentHash: "sha256:" + "a".repeat(64),
        data: { findings: [] },
      }),
    ).toThrowError(expect.objectContaining({ code: "ARTIFACT_STATUS_AUTHORITY" }));
  });

  it("rejects secrets", () => {
    const data = {
      questions: [{ ...questions.questions[0], text: "key sk_live_abcdefghijklmnop" }],
    };
    expect(() => envelope(data)).toThrowError(expect.objectContaining({ code: "ARTIFACT_CONTAINS_SECRET" }));
  });

  it("rejects unknown data properties on the supported minor", () => {
    expect(() => envelope({ ...questions, surprise: true })).toThrowError(
      expect.objectContaining({ code: "ARTIFACT_INVALID" }),
    );
  });

  it("rejects a symlink that leaves .readyvibe", () => {
    const root = mkdtempSync(join(tmpdir(), "rv-"));
    mkdirSync(join(root, ".readyvibe", "runs"), { recursive: true });
    const outside = join(root, "outside.json");
    writeFileSync(outside, "{}\n");
    const link = join(root, ".readyvibe", "runs", "escape.json");
    symlinkSync(outside, link);
    expect(() => readArtifact(link, root)).toThrowError(
      expect.objectContaining({ code: "ARTIFACT_PATH_ESCAPE" }),
    );
  });

  it("round-trips an atomic write", () => {
    const root = mkdtempSync(join(tmpdir(), "rv-ok-"));
    const file = join(root, ".readyvibe", "runs", "r", "questions.json");
    writeArtifact(file, envelope(questions), root);
    expect(readArtifact(file, root).kind).toBe("questions");
  });
});

describe("provenance", () => {
  const snapshots = [
    {
      id: "s@1",
      source: "example.statute",
      retrievedAt: "2026-01-01",
      normalizer: { id: "rv-legal-text", version: 1 },
      provisions: [{ id: "art-1", hash: "sha256:aaa" }],
    },
  ];
  const reviewers = [{ id: "rev-1", specialisms: ["CHILDREN"] }];
  const obligation = {
    id: "EX.ART1",
    version: 1,
    provisions: [{ source: "example.statute", provision: "art-1" }],
    specialistAreas: ["CHILDREN"],
  };
  const review = {
    id: "r1",
    reviewer: "rev-1",
    date: "2026-02-01",
    covers: [{ obligation: "EX.ART1", version: 1 }],
    reviewedAgainst: [{ snapshot: "s@1", provisionHashes: { "example.statute:art-1": "sha256:aaa" } }],
    outcome: "APPROVED" as const,
  };

  it("starts provisional", () => {
    expect(reviewState({ obligation, reviews: [], snapshots, reviewers }).state).toBe("PROVISIONAL");
  });

  it("is reviewed when version, hash, and specialism match", () => {
    expect(reviewState({ obligation, reviews: [review], snapshots, reviewers }).state).toBe("REVIEWED");
  });

  it("requires review again after a version bump", () => {
    expect(
      reviewState({ obligation: { ...obligation, version: 2 }, reviews: [review], snapshots, reviewers }).state,
    ).toBe("REVIEW_REQUIRED");
  });

  it("requires review again when the provision hash changes", () => {
    const changed = [{ ...snapshots[0]!, provisions: [{ id: "art-1", hash: "sha256:bbb" }] }];
    expect(reviewState({ obligation, reviews: [review], snapshots: changed, reviewers }).state).toBe(
      "REVIEW_REQUIRED",
    );
  });

  it("stays provisional when the specialist is missing and there was no prior review", () => {
    expect(
      reviewState({
        obligation,
        reviews: [{ ...review, reviewer: "rev-1" }],
        snapshots,
        reviewers: [{ id: "rev-1", specialisms: [] }],
      }).state,
    ).toBe("REVIEW_REQUIRED");
  });

  it("computes temporal boundaries", () => {
    const temporal = {
      effectiveFrom: "2026-06-23",
      complianceFrom: "2026-04-22",
      basis: [{ source: "example.statute", provision: "art-1" }],
      sourceAsOf: "2026-09-01",
    };
    // complianceFrom before effectiveFrom is unusual; engine uses effectiveFrom first.
    expect(temporalState({ ...temporal, complianceFrom: "2026-08-01" }, "2026-06-01")).toBe("NOT_YET_EFFECTIVE");
    expect(temporalState({ ...temporal, complianceFrom: "2026-08-01" }, "2026-07-01")).toBe(
      "EFFECTIVE_PRE_COMPLIANCE",
    );
    expect(temporalState({ ...temporal, complianceFrom: "2026-08-01" }, "2026-09-01")).toBe("COMPLIANCE_REQUIRED");
    expect(
      temporalState(
        { ...temporal, complianceFrom: "2026-08-01", effectiveUntil: "2026-07-15", endReason: "VACATED" },
        "2026-08-01",
      ),
    ).toBe("ENDED");
    expect(
      temporalState(
        {
          ...temporal,
          transitionalRules: [{ id: "t", appliesWhen: "UNKNOWN", note: "market date unknown" }],
        },
        "2026-09-01",
      ),
    ).toBe("UNDETERMINED");
  });
});
