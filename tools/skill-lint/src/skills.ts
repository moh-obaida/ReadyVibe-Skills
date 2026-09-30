import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import type { LintIssue } from "./lint.js";

export const KINDS = ["specialist", "foundation", "auditor", "bundle"] as const;

const COMMON_SECTIONS = ["Activate when", "May change", "Must not claim", "Verify", "Escalate", "No change is valid when"];
const NON_BUNDLE_SECTIONS = [...COMMON_SECTIONS, "Inspect", "Evidence that counts"];
const BUNDLE_SECTIONS = [...COMMON_SECTIONS, "Evidence discipline"];

/** Skill-name-shaped tokens we treat as references and validate. Suffix match keeps false positives low. */
const REFERENCE_SUFFIX =
  /-(readiness|all|privacy|policy|consistency|compliance|management|security|headers|mapping|rights|safety|triggers|notices|applicability|integrity|sharing|navigation|support|reconnaissance|verification|diff|trust|resilience|dashboard|authorization|log|pages|identity|audit|of-service|and-storage-audit|data)$/;
const NOT_A_SKILL = new Set(["pip-audit", "google-site-verification", "site-data", "user-data", "form-data", "structured-data-testing", "personal-data", "sensitive-data", "test-data", "first-party-data"]);

export interface SkillInfo {
  name: string;
  rel: string;
  dir: string;
  kind?: string;
  helpers: string[];
  launchChecks: number[];
  domains: number[];
  internal: boolean;
  body: string;
}

export function parseNumberList(text: unknown): number[] {
  const out: number[] = [];
  for (const part of String(text ?? "").split(",")) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    for (let n = from; n <= to; n++) out.push(n);
  }
  return out;
}

export function headings(body: string): string[] {
  return [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1] ?? "");
}

function sectionText(body: string, title: string): string {
  const lines = body.split("\n");
  const start = lines.findIndex((l) => /^##\s+/.test(l) && l.replace(/^##\s+/, "").startsWith(title));
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i] ?? "")) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

function listFiles(dir: string, base = dir, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const abs = join(dir, e);
    if (statSync(abs).isDirectory()) listFiles(abs, base, out);
    else out.push(abs.slice(base.length + 1).replace(/\\/g, "/"));
  }
  return out;
}

function helperClosure(root: string, helpers: string[]): Set<string> {
  const files = new Set<string>();
  const visit = (rel: string) => {
    if (files.has(rel)) return;
    files.add(rel);
    const abs = join(root, "scripts", rel);
    if (!existsSync(abs)) return;
    for (const m of readFileSync(abs, "utf8").matchAll(/from\s+"(\.{1,2}\/[^"]+\.mjs)"/g)) visit(join(dirname(rel), m[1] ?? "").replace(/\\/g, "/"));
  };
  for (const h of helpers) visit(`${h}.mjs`);
  return files;
}

export function lintSkillQuality(root: string, info: SkillInfo, knownSkills: Set<string>, canonicalHelpers: Set<string>): LintIssue[] {
  const issues: LintIssue[] = [];
  const at = (code: string, message: string) => issues.push({ code, file: info.rel, message });
  if (info.internal) return issues;

  if (!info.kind || !(KINDS as readonly string[]).includes(info.kind)) {
    at("SKILL_KIND", `metadata.kind must be one of ${KINDS.join(", ")}`);
    return issues;
  }
  const required = info.kind === "bundle" ? BUNDLE_SECTIONS : NON_BUNDLE_SECTIONS;
  const have = headings(info.body);
  for (const need of required) {
    if (!have.some((h) => h.startsWith(need))) at("SKILL_SECTION_MISSING", `missing "## ${need}" section`);
  }
  if (info.kind === "bundle" && !have.some((h) => h.startsWith("Route") || h.startsWith("Flow"))) at("SKILL_SECTION_MISSING", 'bundle needs a "## Route" or "## Flow" section');

  const evidence = sectionText(info.body, info.kind === "bundle" ? "Evidence discipline" : "Evidence that counts");
  for (const term of ["SOURCE-INDICATED", "UNKNOWN", "OBSERVED"]) {
    if (!evidence.includes(term)) at("SKILL_EVIDENCE_LANGUAGE", `evidence section must use the ${term} label`);
  }
  if (!/never a pass and never a failure/i.test(evidence)) at("SKILL_EVIDENCE_LANGUAGE", "evidence section must state that UNKNOWN is never a pass and never a failure");

  if (/npx\s+@readyvibe|readyvibe\s+(doctor|recon|report)|@readyvibe\/(cli|engine|schemas)/.test(info.body)) {
    at("SKILL_ENGINE_DEPENDENCY", "skills must not require the ReadyVibe CLI or npm packages; use bundled scripts/ helpers or normal inspection");
  }
  if (info.body.split("\n").length > 600) at("SKILL_TOO_LONG", "SKILL.md exceeds 600 lines; move detail into references/");

  // helpers: declared == referenced, and vendored copies exist and match the canonical scripts
  const referenced = new Set([...info.body.matchAll(/scripts\/([a-z][a-z-]*)\.mjs/g)].map((m) => m[1] ?? ""));
  for (const r of referenced) if (!info.helpers.includes(r)) at("SKILL_HELPER_UNDECLARED", `body runs scripts/${r}.mjs but metadata.helpers does not declare "${r}"`);
  for (const h of info.helpers) {
    if (!canonicalHelpers.has(h)) at("SKILL_HELPER_UNKNOWN", `metadata.helpers names "${h}", which is not in scripts/`);
    if (!info.body.includes(h)) at("SKILL_HELPER_UNUSED", `metadata.helpers declares "${h}" but the skill never mentions it`);
  }
  if (existsSync(join(root, "scripts"))) {
    const wanted = helperClosure(root, info.helpers.filter((h) => canonicalHelpers.has(h)));
    const vendored = new Set(listFiles(join(info.dir, "scripts")));
    for (const rel of wanted) {
      const src = join(root, "scripts", rel);
      const dst = join(info.dir, "scripts", rel);
      if (!existsSync(dst)) at("SKILL_HELPER_MISSING", `scripts/${rel} is not vendored (run node scripts/sync-skill-assets.mjs)`);
      else if (!readFileSync(src).equals(readFileSync(dst))) at("SKILL_HELPER_STALE", `scripts/${rel} differs from the canonical helper (run node scripts/sync-skill-assets.mjs)`);
    }
    for (const rel of vendored) if (!wanted.has(rel)) at("SKILL_HELPER_EXTRA", `scripts/${rel} is vendored but not declared in metadata.helpers`);
  }

  for (const ref of info.body.matchAll(/\]\((references\/[^)#\s]+)\)/g)) {
    if (!existsSync(join(info.dir, ref[1] ?? ""))) at("SKILL_REFERENCE_MISSING", `links to ${ref[1]}, which does not exist`);
  }
  for (const tok of new Set([...info.body.matchAll(/`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`/g)].map((m) => m[1] ?? ""))) {
    if (REFERENCE_SUFFIX.test(tok) && !knownSkills.has(tok) && !canonicalHelpers.has(tok) && !NOT_A_SKILL.has(tok) && !/^(next|use|dangerously|set|list|check|cache|x|content)-/.test(tok)) {
      at("SKILL_UNKNOWN_REFERENCE", `refers to \`${tok}\`, which is not a ReadyVibe skill or helper`);
    }
  }
  return issues;
}

interface Row {
  n: number;
  cells: string[];
}
function tableRows(text: string, columns: number): Row[] {
  const rows: Row[] = [];
  for (const line of text.split("\n")) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length >= columns && /^\d+$/.test(cells[0] ?? "")) rows.push({ n: Number(cells[0]), cells });
  }
  return rows;
}

/** The 40-check launch model and the 12 compliance domains must be complete and owned by real skills. */
export function lintCoverage(root: string, skills: SkillInfo[], canonicalHelpers: Set<string>): LintIssue[] {
  const issues: LintIssue[] = [];
  const byName = new Map(skills.map((s) => [s.name, s]));
  const check = (file: string, expected: number, ownerCol: number, alsoCol: number, key: "launchChecks" | "domains", label: string) => {
    const abs = join(root, file);
    if (!existsSync(abs)) return;
    const rows = tableRows(readFileSync(abs, "utf8"), alsoCol + 1);
    const seen = new Set<number>();
    for (const row of rows) {
      if (seen.has(row.n)) issues.push({ code: "MODEL_DUPLICATE", file, message: `${label} ${row.n} appears more than once` });
      seen.add(row.n);
      const owner = (row.cells[ownerCol] ?? "").replace(/`/g, "").trim();
      const ownerSkill = byName.get(owner);
      if (!ownerSkill) issues.push({ code: "MODEL_OWNER", file, message: `${label} ${row.n}: owner "${owner}" is not a skill` });
      else if (!ownerSkill[key].includes(row.n)) issues.push({ code: "MODEL_OWNER_METADATA", file, message: `${label} ${row.n}: owner ${owner} does not list ${row.n} in its metadata` });
      for (const tok of (row.cells[alsoCol] ?? "").match(/[a-z][a-z0-9]*(?:-[a-z0-9]+)+/g) ?? []) {
        if (!byName.has(tok) && !canonicalHelpers.has(tok) && tok !== "check-links") issues.push({ code: "MODEL_ALSO", file, message: `${label} ${row.n}: "${tok}" is not a skill` });
      }
    }
    for (let n = 1; n <= expected; n++) if (!seen.has(n)) issues.push({ code: "MODEL_INCOMPLETE", file, message: `${label} ${n} is missing from the model` });
    if (seen.size > expected) issues.push({ code: "MODEL_EXTRA", file, message: `${label} table has more than ${expected} rows` });
  };
  check("skills/bundles/launch-all/references/launch-model.md", 40, 3, 4, "launchChecks", "check");
  check("skills/bundles/compliance-all/references/compliance-domains.md", 12, 3, 4, "domains", "domain");
  return issues;
}
