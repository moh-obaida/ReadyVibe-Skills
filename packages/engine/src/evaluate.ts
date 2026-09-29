import { createHash } from "node:crypto";
import type { Finding, LaunchState, RemediationType, Status } from "@readyvibe/schemas";
import type { EvidenceItem, RealityModel } from "./model.js";

export interface ControlResult {
  controlId: string;
  version: number;
  ownerSkill: string;
  domain: string;
  title: string;
  status: Status;
  severity: Finding["severity"];
  confidence: Finding["confidence"];
  category: string;
  summary: string;
  whyItMatters: string;
  remediationType: RemediationType;
  plan: string;
  evidenceIds: string[];
  tags?: string[];
  legalReview?: { reason: string; question: string };
}

export function evaluate(model: RealityModel, evidence: EvidenceItem[]): Finding[] {
  const results = [
    ...consentFindings(model),
    ...identityFindings(model),
    ...seoFindings(model),
    ...errorFindings(model),
    ...securityFindings(model),
    ...privacyFindings(model),
    ...deletionFindings(model),
    ...emailFindings(model),
    ...a11yFindings(model),
    ...adminFindings(model),
  ];
  return results.map((result) => toFinding(result, evidence));
}

function toFinding(result: ControlResult, evidence: EvidenceItem[]): Finding {
  const evidenceIds = result.evidenceIds.length ? result.evidenceIds : evidence.slice(0, 1).map((e) => e.id);
  return {
    id: `f-${result.controlId}`,
    fingerprint: createHash("sha256").update(`${result.controlId}:site`).digest("hex").slice(0, 16),
    controlId: result.controlId,
    controlVersion: result.version,
    ownerSkill: result.ownerSkill,
    title: result.title,
    domain: result.domain,
    status: result.status,
    severity: result.severity,
    confidence: result.confidence,
    category: result.category,
    summary: result.summary,
    whyItMatters: result.whyItMatters,
    evidence: evidenceIds.filter(Boolean).map((id) => ({ id })),
    remediation: { type: result.remediationType, plan: result.plan },
    tags: result.tags ?? [],
    ...(result.legalReview ? { legalReview: result.legalReview } : {}),
  };
}

function consentFindings(model: RealityModel): ControlResult[] {
  const analytics = model.capabilities.HAS_ANALYTICS === "PRESENT" || model.capabilities.HAS_ADVERTISING === "PRESENT";
  if (!analytics && model.capabilities.HAS_NON_ESSENTIAL_CLIENT_TECH === "ABSENT") {
    return [
      base({
        controlId: "CONSENT.NOT_REQUIRED",
        ownerSkill: "consent-management",
        domain: "consent",
        title: "No non-essential client technology detected",
        status: "NOT_APPLICABLE",
        severity: "INFO",
        category: "TRUST_CONSISTENCY",
        summary: "Static coverage found no analytics, advertising, or replay vendors. A consent banner is not required.",
        whyItMatters: "Adding a banner without tracking is compliance theater.",
        remediationType: "MANUAL_ENGINEERING_REQUIRED",
        plan: "Do not add a cookie banner.",
        evidenceIds: ["ev-coverage"],
      }),
    ];
  }
  const pre = model.networkDestinations.some((d) => d.phase === "PRE_INTERACTION" && d.vendorId && d.vendorId !== "stripe");
  return [
    base({
      controlId: "CONSENT.PRE_CONSENT_NONESSENTIAL",
      ownerSkill: "consent-management",
      domain: "consent",
      title: "Non-essential technology loads before a consent choice",
      status: pre ? "FAIL" : "UNKNOWN",
      severity: "HIGH",
      category: "TRUST_CONSISTENCY",
      summary: pre
        ? "Analytics or advertising code is present on initial load. Runtime consent tests are still required to prove gating."
        : "Vendor present but load timing was not observed.",
      whyItMatters: "Where ePrivacy-style rules apply, non-essential storage and access need a prior choice.",
      remediationType: "AUTOMATIC_WITH_VERIFICATION",
      plan: "Load the vendor only after the matching consent category is granted.",
      evidenceIds: model.vendors.map((v) => `ev-vendor-${v.id}`),
      tags: ["dark-pattern"],
    }),
  ];
}

function identityFindings(model: RealityModel): ControlResult[] {
  if (model.identity.residue.length === 0) return [];
  return [
    base({
      controlId: "IDENTITY.RESIDUE",
      ownerSkill: "launch-identity",
      domain: "identity",
      title: "Starter or placeholder identity is still public",
      status: "FAIL",
      severity: "MEDIUM",
      category: "LAUNCH_QUALITY",
      summary: model.identity.residue.join("; "),
      whyItMatters: "Template titles, localhost canonicals, and placeholder company names undermine trust.",
      remediationType: "AUTOMATIC_WITH_VERIFICATION",
      plan: "Replace residue with the product name and production origin. Do not invent a legal name.",
      evidenceIds: ["ev-coverage"],
    }),
  ];
}

function seoFindings(model: RealityModel): ControlResult[] {
  const out: ControlResult[] = [];
  const privateInSitemap = model.routes.filter((r) => r.auth === "REQUIRED" && r.inSitemap);
  if (privateInSitemap.length) {
    out.push(
      base({
        controlId: "SEO.PRIVATE_ROUTE_IN_SITEMAP",
        ownerSkill: "seo-readiness",
        domain: "seo",
        title: "A private route is listed in the sitemap",
        status: "FAIL",
        severity: "HIGH",
        category: "SEARCH_BEST_PRACTICE",
        summary: privateInSitemap.map((r) => r.path).join(", "),
        whyItMatters: "Sitemaps are for public canonical URLs. Hiding a URL in robots.txt is not authorization.",
        remediationType: "AUTOMATIC_SAFE_FIX",
        plan: "Remove auth-only routes from the sitemap.",
        evidenceIds: ["ev-coverage"],
      }),
    );
  }
  const localhost = model.routes.filter((r) => r.canonical?.includes("localhost"));
  if (localhost.length) {
    out.push(
      base({
        controlId: "SEO.CANONICAL_LOCALHOST",
        ownerSkill: "seo-readiness",
        domain: "seo",
        title: "Canonical URL points at localhost",
        status: "FAIL",
        severity: "HIGH",
        category: "SEARCH_BEST_PRACTICE",
        summary: localhost.map((r) => `${r.path} → ${r.canonical}`).join(", "),
        whyItMatters: "Search and share crawlers will treat a development URL as the official page.",
        remediationType: "OWNER_INPUT_REQUIRED",
        plan: "Set canonicalHost in .readyvibe/config.yaml, then emit absolute production canonicals.",
        evidenceIds: ["ev-coverage"],
      }),
    );
  }
  return out;
}

function errorFindings(model: RealityModel): ControlResult[] {
  const unknown = model.routes.find((r) => r.path === "/readyvibe-missing-route");
  if (!unknown?.status) return [];
  const soft = unknown.status === 200;
  return [
    base({
      controlId: "ERRORS.SOFT_404",
      ownerSkill: "error-pages",
      domain: "errors",
      title: "Unknown routes return a successful status",
      status: soft ? "FAIL" : "PASS",
      severity: "HIGH",
      category: "LAUNCH_QUALITY",
      summary: `Probe received HTTP ${unknown.status}.`,
      whyItMatters: "A designed 404 page served as 200 is a soft 404 and can be indexed.",
      remediationType: "AUTOMATIC_WITH_VERIFICATION",
      plan: "Return HTTP 404 for unknown paths, using the project's design system.",
      evidenceIds: ["ev-unknown-route"],
    }),
  ];
}

function securityFindings(model: RealityModel): ControlResult[] {
  return model.secrets.map((secret) =>
    base({
      controlId: "SEC.SECRET_IN_CLIENT_BUNDLE",
      ownerSkill: "web-security",
      domain: "security",
      title: "A secret-shaped value is in project source",
      status: "FAIL",
      severity: "CRITICAL",
      category: "TECHNICAL_SECURITY",
      summary: `${secret.kind} in ${secret.file}:${secret.line}. The value is not stored in the finding.`,
      whyItMatters: "Client-exposed or committed secrets are usable by anyone who can load the site or the repository.",
      remediationType: "OWNER_INPUT_REQUIRED",
      plan: "Remove the value, move the name to server-only configuration, and rotate the credential.",
      evidenceIds: [`ev-secret-1`],
    }),
  );
}

function privacyFindings(model: RealityModel): ControlResult[] {
  const out: ControlResult[] = [];
  const saysNoAnalytics = model.declarations.some((d) => d.kind === "NO_ANALYTICS");
  if (saysNoAnalytics && model.capabilities.HAS_ANALYTICS === "PRESENT") {
    out.push(
      base({
        controlId: "CLAIMS.ANALYTICS_CONTRADICTION",
        ownerSkill: "policy-consistency",
        domain: "privacy",
        title: "The site says it does not use analytics, but an analytics vendor is present",
        status: "FAIL",
        severity: "HIGH",
        category: "TRUST_CONSISTENCY",
        summary: "A declaration and an implementation disagree. Both pieces of evidence are kept.",
        whyItMatters: "A policy that denies observed behavior is a false statement, not a fix.",
        remediationType: "OWNER_INPUT_REQUIRED",
        plan: "Either remove the vendor or change the sentence so it names the vendor and the purpose.",
        evidenceIds: ["ev-coverage"],
        tags: ["contradiction"],
      }),
    );
  }
  if (model.declarations.some((d) => d.kind === "COMPLIANCE_BADGE")) {
    out.push(
      base({
        controlId: "CLAIMS.COMPLIANCE_BADGE",
        ownerSkill: "policy-consistency",
        domain: "privacy",
        title: "A compliance badge is not evidence",
        status: "WARNING",
        severity: "MEDIUM",
        category: "TRUST_CONSISTENCY",
        summary: "The site displays a compliance badge. ReadyVibe does not validate badges.",
        whyItMatters: "Badges imply a certification the system cannot and does not issue.",
        remediationType: "AUTOMATIC_SAFE_FIX",
        plan: "Remove the badge. Describe specific practices that the product actually implements.",
        evidenceIds: ["ev-coverage"],
      }),
    );
  }
  if (model.dataElements.some((d) => d.dataClass === "DATE_OF_BIRTH")) {
    out.push(
      base({
        controlId: "MINORS.AGE_DATA_UNNECESSARY",
        ownerSkill: "minors-readiness",
        domain: "minors",
        title: "Date of birth is collected without a recorded purpose",
        status: "LEGAL_REVIEW_REQUIRED",
        severity: "HIGH",
        category: "LEGAL_REQUIREMENT",
        summary: "A date-of-birth field exists. The system will not add an age gate to justify it.",
        whyItMatters: "Age data creates children's-privacy obligations that depend on audience and jurisdiction.",
        remediationType: "LEGAL_REVIEW_REQUIRED",
        plan: "Ask why the field exists. Prefer not collecting it unless a confirmed rule requires it.",
        evidenceIds: ["ev-coverage"],
        legalReview: {
          reason: "INTERPRETATION",
          question: "Is date of birth necessary for this service, and do children's rules apply?",
        },
      }),
    );
  }
  return out;
}

function deletionFindings(model: RealityModel): ControlResult[] {
  if (!model.deletion) return [];
  if (model.deletion.setsActiveFalse && !model.deletion.hardDelete) {
    return [
      base({
        controlId: "RIGHTS.DELETION_IS_SOFT",
        ownerSkill: "data-rights",
        domain: "rights",
        title: "Account deletion only deactivates the user",
        status: "FAIL",
        severity: "HIGH",
        category: "TRUST_CONSISTENCY",
        summary: `UI copy "${model.deletion.uiCopy}" is backed by an active=false or deleted_at flag, not a hard delete.`,
        whyItMatters: "Calling deactivation permanent deletion is a false promise.",
        remediationType: "MANUAL_ENGINEERING_REQUIRED",
        plan: "Build a deletion plan per store. Word the confirmation from that plan.",
        evidenceIds: ["ev-coverage"],
        tags: ["contradiction"],
      }),
    ];
  }
  return [];
}

function emailFindings(model: RealityModel): ControlResult[] {
  if (!model.email?.marketing) return [];
  if (model.email.unsubscribeLink && !model.email.suppressionEnforced) {
    return [
      base({
        controlId: "EMAIL.SUPPRESSION_BYPASS",
        ownerSkill: "email-compliance",
        domain: "email",
        title: "Marketing send path does not consult suppression",
        status: "FAIL",
        severity: "HIGH",
        category: "LEGAL_REQUIREMENT",
        summary: "An unsubscribe link exists, but the marketing send function does not check a suppression record.",
        whyItMatters: "An unsubscribe link that does not stop future mail is not an unsubscribe.",
        remediationType: "AUTOMATIC_WITH_VERIFICATION",
        plan: "Check the suppression store inside the single marketing send function.",
        evidenceIds: ["ev-coverage"],
      }),
    ];
  }
  return [];
}

function a11yFindings(model: RealityModel): ControlResult[] {
  const missingLang = model.routes.some((r) => r.file?.endsWith(".html") && !r.htmlLang);
  if (!missingLang) return [];
  return [
    base({
      controlId: "A11Y.HTML_LANG",
      ownerSkill: "wcag-readiness",
      domain: "accessibility",
      title: "HTML language is missing",
      status: "WARNING",
      severity: "MEDIUM",
      category: "ACCESSIBILITY_STANDARD",
      summary: "At least one HTML document should be checked for a valid html lang attribute. Automated checks do not prove WCAG conformance.",
      whyItMatters: "WCAG 3.1.1 requires a human language on the page.",
      remediationType: "AUTOMATIC_SAFE_FIX",
      plan: "Set html lang from the page locale. Do not claim full WCAG conformance from this check.",
      evidenceIds: ["ev-coverage"],
    }),
  ];
}

function adminFindings(model: RealityModel): ControlResult[] {
  if (model.capabilities.HAS_ADMIN_SURFACE !== "PRESENT") return [];
  return [
    base({
      controlId: "ADMINAUTHZ.UI_ONLY_GUARD",
      ownerSkill: "admin-authorization",
      domain: "admin",
      title: "Admin routes exist and must be enforced on the server",
      status: "UNKNOWN",
      severity: "HIGH",
      category: "TECHNICAL_SECURITY",
      summary: "An admin path was found. Static review cannot prove server-side authorization. Direct API calls must be tested with a non-admin user.",
      whyItMatters: "Hiding a link is not authorization.",
      remediationType: "MANUAL_ENGINEERING_REQUIRED",
      plan: "Require a capability check on every admin read and mutation, then verify with a non-admin request.",
      evidenceIds: ["ev-coverage"],
    }),
  ];
}

function base(partial: Omit<ControlResult, "version" | "confidence"> & { confidence?: ControlResult["confidence"] }): ControlResult {
  return { version: 1, confidence: partial.confidence ?? "HIGH", ...partial };
}

const BLOCKING = new Set(["LEGAL_REQUIREMENT", "REGULATORY_GUIDANCE", "TECHNICAL_SECURITY", "TRUST_CONSISTENCY", "ACCESSIBILITY_STANDARD"]);

export function launchState(findings: Finding[]): { state: LaunchState; conditions: string[] } {
  const blockingFail = findings.filter(
    (f) => f.status === "FAIL" && (BLOCKING.has(f.category) || f.severity === "CRITICAL" || f.severity === "HIGH"),
  );
  if (blockingFail.length) {
    return { state: "BLOCKED", conditions: blockingFail.map((f) => f.controlId) };
  }
  const unknown = findings.filter((f) => f.status === "UNKNOWN");
  if (unknown.length) return { state: "CONDITIONALLY_READY", conditions: unknown.map((f) => f.controlId) };
  const review = findings.filter((f) => f.status === "LEGAL_REVIEW_REQUIRED" || f.status === "WARNING");
  if (review.length) return { state: "READY_WITH_REVIEW_ITEMS", conditions: review.map((f) => f.controlId) };
  return { state: "TECHNICALLY_READY", conditions: [] };
}
