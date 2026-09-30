#!/usr/bin/env node
// lint-skills.mjs - checks that the skills are installable, self-contained, and actually contain method.
//
//   node tools/lint-skills.mjs [repo-root]      exits 1 and prints JSON issues if anything is wrong
//
// One dependency: `yaml` (a strict parser, so invalid frontmatter is caught the way an installer would).

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseDocument } from "yaml";
import { buildCompanionFile, parseCompanionLibrary } from "./lib/companions.mjs";

const CATEGORIES = new Set(["core", "compliance", "accessibility", "discoverability", "quality", "security", "admin", "internationalization", "commerce"]);
const KINDS = new Set(["specialist", "foundation", "auditor", "bundle"]);
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AGENT_DIRS = [".agents/skills", ".claude/skills", ".cursor/skills", ".codex/skills"];
const COMMON_SECTIONS = ["Activate when", "May change", "Must not claim", "Verify", "Escalate", "No change is valid when"];
const NON_BUNDLE_SECTIONS = [...COMMON_SECTIONS, "Inspect", "Evidence that counts"];
const BUNDLE_SECTIONS = [...COMMON_SECTIONS, "Evidence discipline"];

// Skills that create or change visible UI must inspect the project's existing design first.
const DESIGN_FIRST = new Set(["admin-dashboard", "error-pages", "consent-management", "privacy-policy", "terms-of-service", "forms-readiness", "public-support", "email-compliance", "data-rights", "legal-navigation", "failure-resilience", "mobile-readiness", "content-trust", "launch-identity", "wcag-readiness", "minors-readiness", "faq-readiness"]);
// Skills where legal or standards specifics come up must send the agent to official sources at run time.
const LEGAL_LOOKUP = new Set(["compliance-all", "privacy-policy", "terms-of-service", "consent-management", "cookie-and-storage-audit", "analytics-privacy", "policy-consistency", "minors-readiness", "email-compliance", "data-rights", "jurisdiction-applicability", "consumer-protection-readiness", "subscription-readiness", "regulated-domain-triggers", "legal-identity-notices", "wcag-readiness", "privacy-readiness", "ai-features-readiness"]);

// Tokens shaped like skill names that we validate when written in `backticks`.
const REFERENCE_SUFFIX = /-(readiness|all|privacy|policy|consistency|compliance|management|security|headers|mapping|rights|safety|triggers|notices|applicability|integrity|sharing|navigation|support|reconnaissance|verification|diff|trust|resilience|dashboard|authorization|log|pages|identity|audit|of-service|and-storage-audit|data)$/;
const NOT_A_SKILL = new Set(["pip-audit", "google-site-verification", "site-data", "user-data", "form-data", "personal-data", "sensitive-data", "test-data", "first-party-data"]);

export function parseNumberList(text) {
  const out = [];
  for (const part of String(text ?? "").split(",")) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    for (let n = from; n <= to; n++) out.push(n);
  }
  return out;
}

const csv = (v) => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const headings = (body) => [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);

function sectionText(body, title) {
  const lines = body.split("\n");
  const start = lines.findIndex((l) => /^##\s+/.test(l) && l.replace(/^##\s+/, "").startsWith(title));
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

function listFiles(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const abs = join(dir, e);
    if (statSync(abs).isDirectory()) listFiles(abs, base, out);
    else out.push(abs.slice(base.length + 1).replace(/\\/g, "/"));
  }
  return out;
}

function walk(dir, visit, root = dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (["node_modules", "dist", ".git"].includes(entry)) continue;
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, visit, root);
    else visit(abs, relative(root, abs).split(sep).join("/"));
  }
}

function helperClosure(root, helpers) {
  const files = new Set();
  const visit = (rel) => {
    if (files.has(rel)) return;
    files.add(rel);
    const abs = join(root, "scripts", rel);
    if (!existsSync(abs)) return;
    for (const m of readFileSync(abs, "utf8").matchAll(/from\s+"(\.{1,2}\/[^"]+\.mjs)"/g)) visit(join(dirname(rel), m[1]).replace(/\\/g, "/"));
  };
  for (const h of helpers) visit(`${h}.mjs`);
  return files;
}

export function lintRepository(rootArg) {
  const root = resolve(rootArg);
  const issues = [];
  const add = (code, file, message) => issues.push({ code, file, message });
  const skills = [];
  const names = new Map();

  walk(root, (abs, rel) => {
    if (AGENT_DIRS.some((d) => rel === d || rel.startsWith(`${d}/`))) add("SKILL_AGENT_DIR", rel, "Agent skill directories must not exist in this repository");
    if (rel.endsWith("/SKILL.md") || rel === "SKILL.md") lintSkillFile(root, abs, rel, names, skills, add);
    if (/\bsk_live_[A-Za-z0-9]{8,}\b/.test(safeRead(abs)) || /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(safeRead(abs))) add("SECRET", rel, "Secret-shaped content");
  });

  const canonicalHelpers = new Set(existsSync(join(root, "scripts")) ? readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, "")) : []);
  const known = new Set(skills.map((s) => s.name));
  const companionDoc = join(root, "docs", "references", "companion-methods.md");
  const library = existsSync(companionDoc) ? parseCompanionLibrary(readFileSync(companionDoc, "utf8")) : null;
  for (const info of skills) lintQuality(root, info, known, canonicalHelpers, add, library);
  lintCoverage(root, skills, canonicalHelpers, add);
  lintNoPlatform(root, add);
  return issues;
}

function safeRead(abs) {
  try {
    return statSync(abs).size > 1_000_000 ? "" : readFileSync(abs, "utf8");
  } catch {
    return "";
  }
}

function lintSkillFile(root, abs, rel, names, skills, add) {
  const parts = rel.split("/");
  if (!(parts.length === 4 && parts[0] === "skills" && parts[3] === "SKILL.md")) {
    add("SKILL_LAYOUT", rel, "SKILL.md must live at skills/<category>/<name>/SKILL.md");
    return;
  }
  if (!CATEGORIES.has(parts[1])) add("SKILL_CATEGORY", rel, `category "${parts[1]}" is not one of ${[...CATEGORIES].join(", ")}`);
  const dirName = parts[2];
  const raw = readFileSync(abs, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    add("SKILL_FRONTMATTER", rel, "Missing YAML frontmatter");
    return;
  }
  const doc = parseDocument(match[1]);
  if (doc.errors.length) {
    add("SKILL_FRONTMATTER_YAML", rel, `Frontmatter is not valid YAML: ${doc.errors[0].message.split("\n")[0]} (quote the description)`);
    return;
  }
  const data = doc.toJS() ?? {};
  if (typeof data.name !== "string" || !NAME_RE.test(data.name) || data.name.length > 64 || data.name !== dirName) add("SKILL_FRONTMATTER_NAME", rel, `name must match directory ${dirName}, be kebab-case, and be 1–64 characters`);
  const description = data.description ?? "";
  if (typeof description !== "string" || description.length === 0 || description.length > 1024 || !/Use when/i.test(description) || !/Do not use/i.test(description)) add("SKILL_DESCRIPTION", rel, "description must be 1–1024 characters and include 'Use when' and 'Do not use'");
  const meta = data.metadata ?? {};
  if ("internal" in meta && typeof meta.internal !== "boolean") add("SKILL_INTERNAL_TYPE", rel, 'metadata.internal must be the YAML boolean true, not the string "true"');
  if (data.name) {
    if (names.has(data.name)) add("SKILL_DUPLICATE", rel, `Duplicate skill name also at ${names.get(data.name)}`);
    else names.set(data.name, rel);
    skills.push({
      name: data.name,
      rel,
      dir: dirname(abs),
      kind: typeof meta.kind === "string" ? meta.kind : undefined,
      helpers: csv(meta.helpers),
      references: csv(meta.references),
      companions: csv(meta.companions),
      launchChecks: parseNumberList(meta["launch-checks"]),
      domains: parseNumberList(meta["compliance-domains"]),
      internal: meta.internal === true,
      body: raw.slice(match[0].length),
    });
  }
}

function lintQuality(root, info, knownSkills, canonicalHelpers, add, library) {
  const at = (code, message) => add(code, info.rel, message);
  if (info.internal) return;
  if (!info.kind || !KINDS.has(info.kind)) {
    at("SKILL_KIND", `metadata.kind must be one of ${[...KINDS].join(", ")}`);
    return;
  }
  const have = headings(info.body);
  for (const need of info.kind === "bundle" ? BUNDLE_SECTIONS : NON_BUNDLE_SECTIONS) if (!have.some((h) => h.startsWith(need))) at("SKILL_SECTION_MISSING", `missing "## ${need}" section`);
  if (info.kind === "bundle" && !have.some((h) => h.startsWith("Route") || h.startsWith("Flow"))) at("SKILL_SECTION_MISSING", 'bundle needs a "## Route" or "## Flow" section');

  const evidence = sectionText(info.body, info.kind === "bundle" ? "Evidence discipline" : "Evidence that counts");
  for (const term of ["SOURCE-INDICATED", "UNKNOWN", "OBSERVED"]) if (!evidence.includes(term)) at("SKILL_EVIDENCE_LANGUAGE", `evidence section must use the ${term} label`);
  if (!/never a pass and never a failure/i.test(evidence)) at("SKILL_EVIDENCE_LANGUAGE", "evidence section must state that UNKNOWN is never a pass and never a failure");

  if (/@readyvibe\/|npx\s+readyvibe|readyvibe\s+(doctor|recon|report)|ReadyVibe\s+(CLI|engine|daemon|runtime|account|cloud)/i.test(info.body)) at("SKILL_PLATFORM_DEPENDENCY", "skills must work on their own: no ReadyVibe CLI, engine, runtime, account, or npm package. Use bundled scripts/ helpers or normal inspection");
  if (info.body.split("\n").length > 600) at("SKILL_TOO_LONG", "SKILL.md exceeds 600 lines; move detail into references/");
  if (DESIGN_FIRST.has(info.name) && (!info.body.includes("design-system-reconnaissance") || !info.companions.includes("design-system-reconnaissance"))) at("SKILL_DESIGN_FIRST", "a skill that changes visible UI must first inspect the project's existing design system: mention design-system-reconnaissance and declare it in metadata.companions");
  if (LEGAL_LOOKUP.has(info.name)) {
    if (!info.references.includes("official-sources")) at("SKILL_LEGAL_SOURCES", 'legal-sensitive skills must declare metadata.references: "official-sources"');
    if (!/official-sources|official source/i.test(info.body)) at("SKILL_LEGAL_SOURCES", "legal-sensitive skills must tell the agent to consult current official sources at run time");
  }

  const referenced = new Set([...info.body.matchAll(/scripts\/([a-z][a-z-]*)\.mjs/g)].map((m) => m[1]));
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
      if (!existsSync(dst)) at("SKILL_HELPER_MISSING", `scripts/${rel} is not vendored (run: node tools/sync-skills.mjs)`);
      else if (!readFileSync(src).equals(readFileSync(dst))) at("SKILL_HELPER_STALE", `scripts/${rel} differs from the canonical helper (run: node tools/sync-skills.mjs)`);
    }
    for (const rel of vendored) if (!wanted.has(rel)) at("SKILL_HELPER_EXTRA", `scripts/${rel} is vendored but not declared in metadata.helpers`);
  }
  for (const ref of info.references) {
    const src = join(root, "docs", "references", `${ref}.md`);
    const dst = join(info.dir, "references", `${ref}.md`);
    if (!existsSync(src)) at("SKILL_REFERENCE_UNKNOWN", `metadata.references names "${ref}", which is not in docs/references/`);
    else if (!existsSync(dst)) at("SKILL_REFERENCE_MISSING", `references/${ref}.md is not vendored (run: node tools/sync-skills.mjs)`);
    else if (!readFileSync(src).equals(readFileSync(dst))) at("SKILL_REFERENCE_STALE", `references/${ref}.md differs from docs/references/${ref}.md (run: node tools/sync-skills.mjs)`);
  }
  // Companions are DECLARED (metadata.companions), never inferred from mentions. Routing, escalation, and
  // documentation mentions of other skills are not dependencies. Each declared companion must exist, have a
  // fallback entry, and appear in the generated per-skill companion-methods.md (only those entries).
  if (info.references.includes("companion-methods")) at("SKILL_COMPANIONS", 'metadata.references must not list "companion-methods": it is generated from metadata.companions');
  const dstCompanion = join(info.dir, "references", "companion-methods.md");
  if (new Set(info.companions).size !== info.companions.length) at("SKILL_COMPANIONS", "metadata.companions lists a skill more than once");
  for (const c of info.companions) {
    if (c === info.name) at("SKILL_COMPANIONS", "a skill cannot be its own companion");
    else if (!knownSkills.has(c)) at("SKILL_COMPANIONS", `declared companion "${c}" is not a ReadyVibe skill`);
    else if (library && !library.entries.has(c)) at("SKILL_COMPANION_FALLBACK", `declared companion "${c}" has no "### ${c}" fallback entry in docs/references/companion-methods.md`);
  }
  if (info.companions.length) {
    if (!have.some((h) => h.startsWith("Working alone"))) at("SKILL_COMPANIONS", 'a skill with companions needs a "## Working alone" section');
    else {
      const working = sectionText(info.body, "Working alone");
      for (const c of info.companions) if (!working.includes(`\`${c}\``)) at("SKILL_COMPANIONS", `the Working alone section does not list companion \`${c}\``);
    }
    if (library && info.companions.every((c) => library.entries.has(c) && knownSkills.has(c))) {
      const built = buildCompanionFile(library, info.companions);
      if (!existsSync(dstCompanion)) at("SKILL_COMPANION_FILE", "references/companion-methods.md is not generated (run: node tools/sync-skills.mjs)");
      else if (readFileSync(dstCompanion, "utf8") !== built) at("SKILL_COMPANION_FILE", "references/companion-methods.md is stale or not pruned to the declared companions (run: node tools/sync-skills.mjs)");
    }
  } else if (existsSync(dstCompanion)) at("SKILL_COMPANION_FILE", "references/companion-methods.md exists but the skill declares no companions (run: node tools/sync-skills.mjs)");
  for (const ref of info.body.matchAll(/\]\((references\/[^)#\s]+)\)/g)) if (!existsSync(join(info.dir, ref[1]))) at("SKILL_REFERENCE_MISSING", `links to ${ref[1]}, which does not exist`);
  for (const tok of new Set([...info.body.matchAll(/`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`/g)].map((m) => m[1]))) {
    if (REFERENCE_SUFFIX.test(tok) && !knownSkills.has(tok) && !canonicalHelpers.has(tok) && !NOT_A_SKILL.has(tok) && !/^(next|use|dangerously|set|list|check|cache|x|content)-/.test(tok)) at("SKILL_UNKNOWN_REFERENCE", `refers to \`${tok}\`, which is not a ReadyVibe skill or helper`);
  }
}

function tableRows(text, columns) {
  const rows = [];
  for (const line of text.split("\n")) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length >= columns && /^\d+$/.test(cells[0] ?? "")) rows.push({ n: Number(cells[0]), cells });
  }
  return rows;
}

/** The 40-check launch model and the 12 compliance domains must be complete and owned by real skills. */
function lintCoverage(root, skills, canonicalHelpers, add) {
  const byName = new Map(skills.map((s) => [s.name, s]));
  const check = (file, expected, ownerCol, alsoCol, key, label) => {
    const abs = join(root, file);
    if (!existsSync(abs)) return;
    const rows = tableRows(readFileSync(abs, "utf8"), alsoCol + 1);
    const seen = new Set();
    for (const row of rows) {
      if (seen.has(row.n)) add("MODEL_DUPLICATE", file, `${label} ${row.n} appears more than once`);
      seen.add(row.n);
      const owner = (row.cells[ownerCol] ?? "").replace(/`/g, "").trim();
      const skill = byName.get(owner);
      if (!skill) add("MODEL_OWNER", file, `${label} ${row.n}: owner "${owner}" is not a skill`);
      else if (!skill[key].includes(row.n)) add("MODEL_OWNER_METADATA", file, `${label} ${row.n}: owner ${owner} does not list ${row.n} in its metadata`);
      for (const tok of (row.cells[alsoCol] ?? "").match(/[a-z][a-z0-9]*(?:-[a-z0-9]+)+/g) ?? []) if (!byName.has(tok) && !canonicalHelpers.has(tok)) add("MODEL_ALSO", file, `${label} ${row.n}: "${tok}" is not a skill`);
    }
    for (let n = 1; n <= expected; n++) if (!seen.has(n)) add("MODEL_INCOMPLETE", file, `${label} ${n} is missing from the model`);
    if (seen.size > expected) add("MODEL_EXTRA", file, `${label} table has more than ${expected} rows`);
  };
  check("skills/core/launch-all/references/launch-model.md", 40, 3, 4, "launchChecks", "check");
  check("skills/core/compliance-all/references/compliance-domains.md", 12, 3, 4, "domains", "domain");
}

/** ReadyVibe-Skills is a skills repository. Guard against drifting back into a package or platform. */
function lintNoPlatform(root, add) {
  const rootPkgPath = join(root, "package.json");
  if (existsSync(rootPkgPath)) {
    let pkg = {};
    try {
      pkg = JSON.parse(readFileSync(rootPkgPath, "utf8"));
    } catch {
      add("PLATFORM_PACKAGE", "package.json", "package.json is not valid JSON");
    }
    if (pkg.private !== true) add("PLATFORM_PACKAGE", "package.json", "root package.json must be private: nothing is published to npm");
    for (const key of ["bin", "workspaces", "publishConfig", "main", "exports", "types"]) if (key in pkg) add("PLATFORM_PACKAGE", "package.json", `root package.json must not define "${key}": this repository ships skills, not a package`);
    if (/@readyvibe\//.test(JSON.stringify(pkg))) add("PLATFORM_PACKAGE", "package.json", "no @readyvibe/* packages: the npm scope stays reserved and unused");
  }
  walk(root, (abs, rel) => {
    if (/(^|\/)package\.json$/.test(rel) && rel !== "package.json" && !rel.startsWith("fixtures/")) add("PLATFORM_PACKAGE", rel, "extra package.json: skills are self-contained folders, not packages");
  });
  for (const dir of ["packages", "rules", "engine", "cli", "backend", "daemon"]) if (existsSync(join(root, dir))) add("PLATFORM_DIRECTORY", dir, `${dir}/ implies a platform; ReadyVibe-Skills is a skills repository (see docs/current-model.md)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
  const issues = lintRepository(root);
  if (issues.length === 0) {
    console.log(JSON.stringify({ ok: true, issues: [] }));
    process.exit(0);
  }
  console.error(JSON.stringify({ ok: false, issues }, null, 2));
  process.exit(1);
}
