// Shared finding shape and output for the ReadyVibe helper scripts.
//
// evidence:
//   OBSERVED          the script directly saw it (a response, a rendered DOM, a captured request)
//   SOURCE-INDICATED  the script saw it in files/markup; runtime behavior is not proven
//   UNKNOWN           the script could not determine it (network failure, JS-only page, no runtime)
// Findings never carry a legal conclusion. `review: true` marks facts that need human judgment
// about applicability before anyone calls them a problem.

export const SEVERITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, INFO: 3 };

export function finding(code, severity, evidence, message, extra = {}) {
  return { code, severity, evidence, message, ...extra };
}

export function sortFindings(findings) {
  return [...findings].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) || a.code.localeCompare(b.code));
}

export function summarize(findings) {
  const bySeverity = { HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const f of findings) bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
  return bySeverity;
}

/** Collapse the same per-page finding across many pages into one, so a site-wide gap reads as one item. */
export function collapse(findings, threshold = 3) {
  const groups = new Map();
  for (const f of findings) {
    if (!f.page || f.target || f.pages) continue;
    const key = `${f.code}|${f.severity}|${f.evidence}`;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  const drop = new Set();
  const merged = [];
  for (const list of groups.values()) {
    if (list.length < threshold) continue;
    for (const f of list) drop.add(f);
    const pages = list.map((f) => f.page);
    merged.push({ ...list[0], page: undefined, pages: pages.slice(0, 8), count: pages.length, message: `${list[0].message} (${pages.length} pages: ${pages.slice(0, 4).join(", ")}${pages.length > 4 ? ", …" : ""})` });
  }
  return [...findings.filter((f) => !drop.has(f)), ...merged];
}

export function emit(name, result, json) {
  const findings = sortFindings(collapse(result.findings ?? []));
  if (findings.some((f) => f.code === "SITE_NOT_READ")) process.exitCode = 3; // nothing was read: never a silent success
  const output = { tool: name, ...result, findings, summary: summarize(findings) };
  if (json) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return output;
  }
  const lines = [`${name}: ${findings.length} finding(s)  HIGH ${output.summary.HIGH}  MEDIUM ${output.summary.MEDIUM}  LOW ${output.summary.LOW}  INFO ${output.summary.INFO}`];
  for (const note of result.notes ?? []) lines.push(`  note: ${note}`);
  for (const f of findings) {
    const where = [f.page, f.file && `${f.file}${f.line ? `:${f.line}` : ""}`, f.target].filter(Boolean).join("  ");
    lines.push(`  [${f.severity}] ${f.code} (${f.evidence})${where ? `  ${where}` : ""}\n      ${f.message}`);
  }
  process.stdout.write(`${lines.join("\n")}\n`);
  return output;
}

export function usageError(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}
