import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parse, parseDocument } from "yaml";

export interface LintIssue {
  code: string;
  file: string;
  message: string;
}

const AGENT_DIRS = [
  ".agents/skills",
  ".claude/skills",
  ".cursor/skills",
  ".codex/skills",
];

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function lintRepository(root: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const names = new Map<string, string>();

  walk(root, (abs, rel) => {
    const normalized = rel.split(sep).join("/");
    if (AGENT_DIRS.some((dir) => normalized === dir || normalized.startsWith(`${dir}/`))) {
      issues.push({
        code: "SKILL_AGENT_DIR",
        file: normalized,
        message: "Agent skill directories must not exist in this repository",
      });
    }
    if (normalized.endsWith("/SKILL.md") || normalized === "SKILL.md") {
      issues.push(...lintSkillFile(root, abs, normalized, names));
    }
    if (normalized.endsWith(".yaml") && normalized.startsWith("rules/packs/")) {
      issues.push(...lintObligation(abs, normalized));
    }
    if (normalized.includes("/assets/") && isCc0Path(normalized)) {
      const text = readFileSync(abs, "utf8");
      if (/eu\.|uk\.|us\.|uae\.|art-\d|16 CFR|GDPR Article/i.test(text)) {
        issues.push({
          code: "CC0_AUTHORITY",
          file: normalized,
          message: "CC0 assets must not contain authority identifiers or statutory excerpts",
        });
      }
    }
    if (/\bsk_live_[A-Za-z0-9]{8,}\b/.test(safeRead(abs)) || /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(safeRead(abs))) {
      issues.push({ code: "SECRET", file: normalized, message: "Secret-shaped content" });
    }
  });

  return issues;
}

function isCc0Path(rel: string): boolean {
  return rel.includes("/assets/clauses/") || rel.includes("/assets/templates/") || rel.startsWith("vendor-catalog/");
}

function lintSkillFile(root: string, abs: string, rel: string, names: Map<string, string>): LintIssue[] {
  const issues: LintIssue[] = [];
  const parts = rel.split("/");
  const depthOk = parts.length === 4 && parts[0] === "skills" && parts[3] === "SKILL.md";
  if (!depthOk) {
    issues.push({
      code: "SKILL_LAYOUT",
      file: rel,
      message: "SKILL.md must live at skills/<category>/<name>/SKILL.md",
    });
    return issues;
  }
  const dirName = parts[2]!;
  const raw = readFileSync(abs, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    issues.push({ code: "SKILL_FRONTMATTER", file: rel, message: "Missing YAML frontmatter" });
    return issues;
  }
  const doc = parseDocument(match[1] ?? "");
  const data = doc.toJS() as { name?: string; description?: string; metadata?: { internal?: unknown } };
  if (typeof data.name !== "string" || !NAME_RE.test(data.name) || data.name.length > 64 || data.name !== dirName) {
    issues.push({
      code: "SKILL_FRONTMATTER_NAME",
      file: rel,
      message: `name must match directory ${dirName}, be kebab-case, and be 1–64 characters`,
    });
  }
  const description = data.description ?? "";
  if (description.length === 0 || description.length > 1024 || !/Use when/i.test(description) || !/Do not use/i.test(description)) {
    issues.push({
      code: "SKILL_DESCRIPTION",
      file: rel,
      message: "description must be 1–1024 characters and include 'Use when' and 'Do not use'",
    });
  }
  const internalNode = doc.getIn(["metadata", "internal"], true);
  if (data.metadata && "internal" in data.metadata) {
    const node = internalNode as { value?: unknown } | undefined;
    const value = node && typeof node === "object" && "value" in node ? node.value : data.metadata.internal;
    if (typeof value !== "boolean") {
      issues.push({
        code: "SKILL_INTERNAL_TYPE",
        file: rel,
        message: 'metadata.internal must be the YAML boolean true, not the string "true"',
      });
    }
  }
  if (data.name) {
    const prior = names.get(data.name);
    if (prior) {
      issues.push({ code: "SKILL_DUPLICATE", file: rel, message: `Duplicate skill name also at ${prior}` });
    } else names.set(data.name, rel);
  }
  const contractPath = join(root, "skills", parts[1]!, dirName, "contract.yaml");
  if (!existsSync(contractPath)) {
    issues.push({ code: "SKILL_CONTRACT", file: rel, message: "Missing contract.yaml" });
  } else {
    const contract = parse(readFileSync(contractPath, "utf8")) as { name?: string; kind?: string };
    if (contract.name !== data.name) {
      issues.push({ code: "SKILL_CONTRACT", file: rel, message: "contract.yaml name must match SKILL.md" });
    }
    if (contract.kind === "BUNDLE") {
      const body = raw.split("---").slice(2).join("---");
      if (/CONSENT\.|procedure:|## Discover/i.test(body) && body.length > 4000) {
        issues.push({
          code: "SKILL_BUNDLE_DUPLICATE",
          file: rel,
          message: "Bundle skills must stay thin and must not copy specialist procedures",
        });
      }
    }
  }
  return issues;
}

function lintObligation(abs: string, rel: string): LintIssue[] {
  if (!rel.includes("/obligations/")) return [];
  const text = readFileSync(abs, "utf8");
  const issues: LintIssue[] = [];
  if (/^reviewState:/m.test(text) || /^reviewed:/m.test(text) || /^status:\s*(REVIEWED|PROVISIONAL|STABLE)/m.test(text)) {
    issues.push({
      code: "OBLIGATION_AUTHORED_STATE",
      file: rel,
      message: "Review state is computed. Do not author reviewState, reviewed, or status.",
    });
  }
  if (!/^temporal:/m.test(text)) {
    issues.push({ code: "OBLIGATION_TEMPORAL", file: rel, message: "Obligation is missing a temporal block" });
  }
  return issues;
}

function safeRead(abs: string): string {
  try {
    if (statSync(abs).size > 1_000_000) return "";
    return readFileSync(abs, "utf8");
  } catch {
    return "";
  }
}

function walk(dir: string, visit: (abs: string, rel: string) => void, root = dir): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".git" || entry.endsWith(".test.ts")) continue;
    const abs = join(dir, entry);
    const st = statSync(abs);
    const rel = relative(root, abs);
    if (st.isDirectory()) walk(abs, visit, root);
    else visit(abs, rel);
  }
}
