import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { complianceDiff } from "./diff.js";
import { evaluate, launchState } from "./evaluate.js";
import { findPlanted, plantIdentity } from "./canary.js";
import { lintReport } from "./report/index.js";
import { reconStatic } from "./recon.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixture = (name: string) => resolve(root, "fixtures/sites", name);

describe("fixtures", () => {
  it("does not invent a consent banner for a quiet portfolio", () => {
    const { model, evidence } = reconStatic(fixture("portfolio-minimal"));
    const findings = evaluate(model, evidence);
    expect(findings.find((f) => f.controlId === "CONSENT.NOT_REQUIRED")?.status).toBe("NOT_APPLICABLE");
    expect(findings.some((f) => f.controlId === "CONSENT.PRE_CONSENT_NONESSENTIAL")).toBe(false);
    expect(launchState(findings).state).not.toBe("BLOCKED");
  });

  it("fails pre-consent analytics and policy contradictions", () => {
    const { model, evidence } = reconStatic(fixture("site-bad-consent"));
    const findings = evaluate(model, evidence);
    expect(findings.find((f) => f.controlId === "CONSENT.PRE_CONSENT_NONESSENTIAL")?.status).toBe("FAIL");
    expect(findings.find((f) => f.controlId === "CLAIMS.ANALYTICS_CONTRADICTION")?.status).toBe("FAIL");
    expect(findings.find((f) => f.controlId === "IDENTITY.RESIDUE")?.status).toBe("FAIL");
    expect(findings.find((f) => f.controlId === "SEO.CANONICAL_LOCALHOST")?.status).toBe("FAIL");
    expect(launchState(findings).state).toBe("BLOCKED");
  });

  it("flags a private route in the sitemap", () => {
    const { model, evidence } = reconStatic(fixture("private-sitemap"));
    const findings = evaluate(model, evidence);
    expect(findings.find((f) => f.controlId === "SEO.PRIVATE_ROUTE_IN_SITEMAP")?.status).toBe("FAIL");
  });

  it("does not call active=false permanent deletion", () => {
    const { model, evidence } = reconStatic(fixture("fake-deletion"));
    const findings = evaluate(model, evidence);
    expect(findings.find((f) => f.controlId === "RIGHTS.DELETION_IS_SOFT")?.status).toBe("FAIL");
  });

  it("requires suppression, not just an unsubscribe link", () => {
    const { model, evidence } = reconStatic(fixture("newsletter-broken"));
    const findings = evaluate(model, evidence);
    expect(findings.find((f) => f.controlId === "EMAIL.SUPPRESSION_BYPASS")?.status).toBe("FAIL");
  });

  it("detects a client-exposed secret name without copying a live key", () => {
    const { model, evidence } = reconStatic(fixture("secret-in-client"));
    const findings = evaluate(model, evidence);
    expect(findings.find((f) => f.controlId === "SEC.SECRET_IN_CLIENT_BUNDLE")?.status).toBe("FAIL");
    expect(JSON.stringify(findings)).not.toContain("sk_live_");
  });
});

describe("planted values and reports", () => {
  it("finds raw, encoded, and hashed planted emails", () => {
    const id = plantIdentity("run-1");
    const hashed = findPlanted(`{"em":"${requireHash(id.email)}"}`, id);
    expect(hashed.some((h) => h.encoding === "sha256")).toBe(true);
    expect(findPlanted(encodeURIComponent(id.email), id).some((h) => h.encoding === "url")).toBe(true);
  });

  it("rejects a compliance guarantee in report prose", () => {
    expect(lintReport("This site is GDPR compliant.").length).toBeGreaterThan(0);
    expect(lintReport("No unresolved automated findings were detected.").length).toBe(0);
  });

  it("diffs a new analytics vendor", () => {
    const base = reconStatic(fixture("portfolio-minimal")).model;
    const head = reconStatic(fixture("site-bad-consent")).model;
    const deltas = complianceDiff(base, head);
    expect(deltas.some((d) => d.kind === "VENDOR_ADDED" && d.subject === "google-analytics")).toBe(true);
  });
});

function requireHash(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}
