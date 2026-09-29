import type { Finding, LaunchState } from "@readyvibe/schemas";

const BANNED = [
  /fully compliant/i,
  /gdpr compliant/i,
  /guaranteed/i,
  /100%\s*secure/i,
  /legally certified/i,
  /will be indexed/i,
];

export function lintReport(markdown: string): string[] {
  return BANNED.filter((re) => re.test(markdown)).map((re) => `Banned phrase matched ${re}`);
}

export function renderReport(input: {
  launchState: LaunchState;
  conditions: string[];
  findings: Finding[];
  evaluatedAsOf: string;
  commit: string;
}): string {
  const counts = count(input.findings);
  const lines = [
    `# ReadyVibe report`,
    ``,
    `Launch state: **${input.launchState}**`,
    ``,
    `> What this status means. It summarizes the automated checks selected for this run, evaluated for commit \`${input.commit}\`, as of \`${input.evaluatedAsOf}\`. It is not a legal opinion, a certification, or a guarantee of compliance, accessibility conformance, security, or search indexing.`,
    ``,
    `Counts: PASS ${counts.PASS}, FAIL ${counts.FAIL}, WARNING ${counts.WARNING}, NOT_APPLICABLE ${counts.NOT_APPLICABLE}, LEGAL_REVIEW_REQUIRED ${counts.LEGAL_REVIEW_REQUIRED}, UNKNOWN ${counts.UNKNOWN}.`,
    ``,
    `## Findings`,
    ``,
  ];
  for (const finding of input.findings) {
    lines.push(`### ${finding.status} ${finding.controlId}`);
    lines.push(finding.summary);
    lines.push(`Evidence: ${finding.evidence.map((e) => e.id).join(", ") || "none"}.`);
    lines.push("");
  }
  if (input.findings.some((f) => f.status === "NOT_APPLICABLE")) {
    lines.push("Not applicable is a successful outcome when coverage supports it.");
  }
  const markdown = lines.join("\n");
  const violations = lintReport(markdown);
  if (violations.length) {
    return `Report linter violations:\n${violations.join("\n")}\n\n${markdown}`;
  }
  return markdown;
}

function count(findings: Finding[]): Record<string, number> {
  const counts: Record<string, number> = {
    PASS: 0,
    FAIL: 0,
    WARNING: 0,
    NOT_APPLICABLE: 0,
    LEGAL_REVIEW_REQUIRED: 0,
    UNKNOWN: 0,
  };
  for (const finding of findings) counts[finding.status] = (counts[finding.status] ?? 0) + 1;
  return counts;
}
