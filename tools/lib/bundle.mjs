// bundle.mjs - builds the unified ReadyVibe Skills marketplace bundle (one ZIP, one master SKILL.md).
//
// The canonical skills under skills/ are read, never modified. Each public skill's SKILL.md becomes an internal
// METHOD.md under modules/<category>/<name>/, next to its own references/ and scripts/. A generated master SKILL.md
// routes to them. Nothing here repairs canonical content: inconsistent or missing input fails the build.

import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { parseDocument } from "yaml";
import { lintRepository, parseNumberList } from "../lint-skills.mjs";

const run = promisify(execFile);

export const BUNDLE_SLUG = "readyvibe-skills";
export const ZIP_NAME = "ReadyVibe-Skills.zip";
export const REPO = "moh-obaida/ReadyVibe-Skills";
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_FILE = /\.(?:md|mjs|js|json|yml|yaml|txt|css|html|svg)$/i;
const OS_JUNK = new Set([".DS_Store", "Thumbs.db"]);
const MODULE_PARTS = new Set(["SKILL.md", "references", "scripts"]);
// Fixed timestamp so the same inputs always produce the same archive bytes.
const FIXED_TIME = new Date("2026-01-01T00:00:00Z");
const REQUIRED_ROOT = ["SKILL.md", "README.md", "LICENSE", "NOTICE", "manifest.json", "references/skill-catalog.md", "references/routing-guide.md"];

const csv = (v) => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const fail = (message) => {
  throw new Error(message);
};

export function splitFrontmatter(raw, where = "file") {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) fail(`${where}: missing YAML frontmatter`);
  const doc = parseDocument(m[1], { uniqueKeys: true });
  if (doc.errors.length) fail(`${where}: invalid YAML frontmatter: ${doc.errors[0].message}`);
  return { block: m[0], data: doc.toJS() ?? {}, body: raw.slice(m[0].length) };
}

async function listDirs(dir) {
  return (await readdir(dir, { withFileTypes: true })).filter((e) => !OS_JUNK.has(e.name)).sort((a, b) => a.name.localeCompare(b.name));
}

/** Every public skill (metadata.internal !== true), validated, sorted by category then name. */
export async function discoverPublicSkills(root) {
  const base = join(root, "skills");
  if (!existsSync(base)) fail(`skills/ not found under ${root}`);
  const all = [];
  const internal = [];
  let foundSkillMd = 0;
  const countStray = async (dir, depth) => {
    for (const e of await listDirs(dir)) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) await countStray(abs, depth + 1);
      else if (e.name.toLowerCase() === "skill.md") {
        foundSkillMd++;
        if (depth !== 2) fail(`SKILL.md outside skills/<category>/<name>/: ${relative(root, abs)}`);
      }
    }
  };
  await countStray(base, 0);

  for (const category of await listDirs(base)) {
    if (!category.isDirectory()) fail(`unexpected file in skills/: ${category.name}`);
    for (const entry of await listDirs(join(base, category.name))) {
      if (!entry.isDirectory()) fail(`unexpected file in skills/${category.name}/: ${entry.name}`);
      const source = join(base, category.name, entry.name);
      const where = `skills/${category.name}/${entry.name}`;
      if (!existsSync(join(source, "SKILL.md"))) fail(`${where}: directory has no SKILL.md`);
      if (!NAME_RE.test(entry.name) || entry.name.length > 64) fail(`${where}: invalid skill name`);
      const { data } = splitFrontmatter(await readFile(join(source, "SKILL.md"), "utf8"), `${where}/SKILL.md`);
      if (data.name !== entry.name) fail(`${where}: frontmatter name "${data.name}" must equal the folder name`);
      if (typeof data.description !== "string" || !data.description.trim()) fail(`${where}: missing description`);
      const meta = data.metadata ?? {};
      if (meta.internal !== undefined && typeof meta.internal !== "boolean") fail(`${where}: metadata.internal must be a YAML boolean`);
      if (meta.internal === true) {
        internal.push(entry.name);
        continue;
      }
      all.push({
        name: entry.name,
        category: category.name,
        kind: String(meta.kind ?? ""),
        source,
        sourceRel: where,
        description: data.description.trim(),
        launchChecks: parseNumberList(meta["launch-checks"]),
        domains: parseNumberList(meta["compliance-domains"]),
        helpers: csv(meta.helpers),
        references: csv(meta.references),
        companions: csv(meta.companions),
      });
    }
  }
  const names = new Set();
  for (const s of all) {
    if (names.has(s.name)) fail(`duplicate skill name across categories: ${s.name}`);
    names.add(s.name);
  }
  if (all.length + internal.length !== foundSkillMd) fail(`discovery mismatch: found ${foundSkillMd} SKILL.md files but classified ${all.length + internal.length} skills`);
  if (!all.length) fail("no public skills found");
  for (const s of all) for (const c of s.companions) if (!names.has(c)) fail(`${s.sourceRel}: companion ${c} is not a public skill, so the bundle would have a dangling dependency`);
  all.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  return { skills: all, internal };
}

async function readSafeTree(dir, rootForMessages, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (OS_JUNK.has(e.name)) continue;
    const abs = join(dir, e.name);
    const rel = relative(rootForMessages, abs);
    const info = await lstat(abs);
    if (info.isSymbolicLink()) fail(`symlink not allowed in the bundle: ${rel}`);
    if (e.name.startsWith(".")) fail(`hidden file not allowed in the bundle: ${rel}`);
    if (info.isDirectory()) await readSafeTree(abs, rootForMessages, out);
    else if (info.isFile()) {
      if (!SAFE_FILE.test(e.name)) fail(`unsupported file type in the bundle: ${rel}`);
      out.push(abs);
    } else fail(`unsupported filesystem entry: ${rel}`);
  }
  return out;
}

function methodBanner(skill) {
  return [
    `> **ReadyVibe Skills bundle: packaged method \`${skill.name}\`.** This is one specialist's method inside the ReadyVibe Skills bundle. The master router (\`../../../SKILL.md\`) loads it; it is not a separate skill.`,
    ">",
    "> - Paths in this document (`references/…`, `scripts/…`) are relative to this file's folder.",
    "> - Another ReadyVibe skill named here is bundled at `../../<category>/<name>/METHOD.md`; every path is listed in [the skill catalog](../../../references/skill-catalog.md). Wherever this method says to use a skill \"if installed\", read and follow that bundled METHOD.md: it is the full-depth method. Use a reduced-depth entry from `references/companion-methods.md` only if the bundled method cannot be read, and report that the lane ran at reduced depth. Suggestions to install more skills do not apply: the full set is already bundled.",
    `> - Run helpers with Node 22+: \`node <this folder>/scripts/<helper>.mjs\`, with the working directory set to the project being inspected.`,
    "",
  ].join("\n");
}

/** SKILL.md -> METHOD.md: frontmatter kept verbatim, bundle banner added, own-filename mentions renamed. */
export function toMethod(raw, skill) {
  const { block, body } = splitFrontmatter(raw, `${skill.sourceRel}/SKILL.md`);
  const renamed = body.replaceAll("SKILL.md", "METHOD.md");
  const rewrites = (body.match(/SKILL\.md/g) ?? []).length;
  return { text: `${block}\n${methodBanner(skill)}${renamed}`, rewrites };
}

const modulePath = (s) => `modules/${s.category}/${s.name}`;
const methodPath = (s) => `${modulePath(s)}/METHOD.md`;

function loadRoutes(routesJson, skills) {
  const byName = new Map(skills.map((s) => [s.name, s]));
  const routes = JSON.parse(routesJson).routes;
  const ids = new Set();
  const reached = new Set();
  for (const r of routes) {
    if (!r.id || ids.has(r.id)) fail(`routes.json: missing or duplicate route id "${r.id}"`);
    ids.add(r.id);
    if (!r.request || !Array.isArray(r.keywords) || !Array.isArray(r.load) || !r.load.length) fail(`routes.json: route ${r.id} needs request, keywords, and load`);
    for (const name of r.load) {
      if (!byName.has(name)) fail(`routes.json: route ${r.id} loads "${name}", which is not a public skill`);
      reached.add(name);
    }
  }
  const unreachable = skills.filter((s) => !reached.has(s.name)).map((s) => s.name);
  if (unreachable.length) fail(`routes.json has no route for public skill(s): ${unreachable.join(", ")}. Add them to a route so they stay reachable.`);
  return { routes, byName };
}

function renderRouteTable(routes, byName) {
  const rows = routes.map((r) => {
    const [first, ...rest] = r.load.map((n) => byName.get(n));
    const more = rest.length ? `; then only if in scope: ${rest.map((s) => `\`${s.name}\``).join(", ")}` : "";
    return `| ${r.request} | \`${methodPath(first)}\`${more} |`;
  });
  return ["| If the request is… | Load |", "|---|---|", ...rows].join("\n");
}

function renderRouteDetails(routes, byName) {
  return routes
    .map((r) => {
      const load = r.load.map((n, i) => `${i + 1}. [${n}](../${methodPath(byName.get(n))})`).join("\n");
      return [`### ${r.id}`, "", `Request: ${r.request}`, "", `Keywords: ${r.keywords.map((k) => `\`${k}\``).join(", ")}`, "", "Load, in order:", load, ...(r.note ? ["", `Note: ${r.note}`] : [])].join("\n");
    })
    .join("\n\n");
}

function renderCheckIndex(skills) {
  const max = Math.max(0, ...skills.flatMap((s) => s.launchChecks));
  const rows = [];
  for (let n = 1; n <= max; n++) {
    const names = skills.filter((s) => s.launchChecks.includes(n)).map((s) => `\`${s.name}\``);
    rows.push(`| ${n} | ${names.join(", ") || "(none)"} |`);
  }
  return ["| Launch check | Skills listing it |", "|---|---|", ...rows].join("\n");
}

function renderCatalog(skills, stats) {
  const byCat = new Map();
  for (const s of skills) byCat.set(s.category, [...(byCat.get(s.category) ?? []), s]);
  const lines = [
    "# Skill catalog",
    "",
    `All ${skills.length} specialists in this bundle, generated from their own definitions. Paths are relative to this file. Load a specialist's METHOD.md only when it applies.`,
    "",
    "| Category | Specialists |",
    "|---|---|",
    ...[...byCat].map(([cat, list]) => `| ${cat} | ${list.length} |`),
    "",
  ];
  const link = (s) => `[${s.name}](../${methodPath(s)})`;
  for (const [cat, list] of byCat) {
    lines.push(`## ${cat}`, "");
    for (const s of list) {
      lines.push(`### ${s.name}`, "");
      lines.push(`- **Method:** [${methodPath(s)}](../${methodPath(s)})`);
      lines.push(`- **Kind:** ${s.kind || "unspecified"}`);
      lines.push(`- **Use when / scope:** ${s.description.replaceAll("\n", " ")}`);
      const owns = [s.launchChecks.length ? `launch checks ${s.launchChecks.join(", ")}` : "", s.domains.length ? `compliance domains ${s.domains.join(", ")}` : ""].filter(Boolean);
      lines.push(`- **Lists:** ${owns.join("; ") || "no launch check or domain (supporting method)"}`);
      lines.push(`- **Helpers:** ${s.helpers.length ? s.helpers.map((h) => `\`${modulePath(s)}/scripts/${h}.mjs\``).join(", ") : "none"}`);
      const refs = stats.get(s.name)?.references ?? [];
      lines.push(`- **Packaged references:** ${refs.length ? refs.map((r) => `\`${r}\``).join(", ") : "none"}`);
      lines.push(`- **Companions:** ${s.companions.length ? s.companions.map((c) => link(skills.find((x) => x.name === c))).join(", ") + " (fallbacks in this module's `references/companion-methods.md`)" : "none"}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

function fill(template, values, where) {
  let out = template;
  for (const [k, v] of Object.entries(values)) out = out.replaceAll(`{{${k}}}`, v);
  const left = out.match(/\{\{[A-Z_]+\}\}/);
  if (left) fail(`${where}: unresolved placeholder ${left[0]}`);
  return out;
}

async function preflightChecks(root, preflight) {
  const steps = [];
  if (preflight.sync) {
    try {
      await run(process.execPath, [join(root, "tools", "sync-skills.mjs"), "--check"], { cwd: root });
      steps.push("vendored helpers, references, and companion fallbacks are in sync");
    } catch (error) {
      fail(`vendored files are out of sync with their canonical sources. Run "pnpm sync" and review the result; the bundle build never repairs canonical content.\n${String(error.stderr || error.message).trim()}`);
    }
  }
  if (preflight.lint) {
    const issues = lintRepository(root);
    if (issues.length) fail(`canonical skill lint failed (${issues.length} issue(s)); fix them first:\n${issues.slice(0, 10).map((i) => `  ${i.code} ${i.file}: ${i.message}`).join("\n")}`);
    steps.push("canonical skill lint passed");
  }
  return steps;
}

/** Hash of every file under a directory, relative posix paths -> sha256. */
async function hashTree(dir) {
  const files = await readSafeTree(dir, dir);
  const out = {};
  for (const f of files.sort()) out[relative(dir, f).split(sep).join("/")] = sha256(await readFile(f));
  return out;
}

async function stage({ root, stageRoot, skills, internal, routes, version }) {
  const bundle = join(stageRoot, BUNDLE_SLUG);
  const authored = join(root, "marketplace", "bundle");
  for (const f of ["master.md", "readme.md", "routing-guide.md", "routes.json"]) if (!existsSync(join(authored, f))) fail(`missing bundle source marketplace/bundle/${f}`);
  const routesJson = await readFile(join(authored, "routes.json"), "utf8");
  const { routes: routeList, byName } = loadRoutes(routesJson, skills);

  const modules = [];
  const stats = new Map();
  let rewrites = 0;
  for (const s of skills) {
    const dest = join(bundle, modulePath(s));
    await mkdir(dest, { recursive: true });
    for (const e of await readdir(s.source, { withFileTypes: true })) {
      if (OS_JUNK.has(e.name)) continue;
      if (!MODULE_PARTS.has(e.name)) fail(`${s.sourceRel}: unexpected entry "${e.name}" (a skill folder holds SKILL.md, references/, scripts/)`);
    }
    const { text, rewrites: n } = toMethod(await readFile(join(s.source, "SKILL.md"), "utf8"), s);
    rewrites += n;
    await writeFile(join(dest, "METHOD.md"), text);
    for (const part of ["references", "scripts"]) {
      const src = join(s.source, part);
      if (!existsSync(src)) continue;
      for (const abs of await readSafeTree(src, s.source)) {
        const target = join(dest, part, relative(src, abs));
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, await readFile(abs));
      }
    }
    for (const h of s.helpers) if (!existsSync(join(dest, "scripts", `${h}.mjs`))) fail(`${s.sourceRel}: declared helper ${h} is not packaged`);
    for (const r of s.references) if (!existsSync(join(dest, "references", `${r}.md`))) fail(`${s.sourceRel}: declared reference ${r} is not packaged`);
    const refDir = join(dest, "references");
    stats.set(s.name, { references: existsSync(refDir) ? (await readdir(refDir)).sort().map((f) => `references/${f}`) : [] });
    modules.push(s);
  }

  const allChecks = new Set(skills.flatMap((s) => s.launchChecks));
  const allDomains = new Set(skills.flatMap((s) => s.domains));
  const categories = [...new Set(skills.map((s) => s.category))];
  const values = {
    SKILL_COUNT: String(skills.length),
    LAUNCH_CHECKS: String(allChecks.size),
    DOMAINS: String(allDomains.size),
    VERSION: version,
    ROUTE_TABLE: renderRouteTable(routeList, byName),
    ROUTE_DETAILS: renderRouteDetails(routeList, byName),
    CHECK_INDEX: renderCheckIndex(skills),
    CATEGORY_SUMMARY: categories.map((c) => `${c} ${skills.filter((s) => s.category === c).length}`).join(", "),
  };
  await mkdir(join(bundle, "references"), { recursive: true });
  await writeFile(join(bundle, "SKILL.md"), fill(await readFile(join(authored, "master.md"), "utf8"), values, "master.md"));
  await writeFile(join(bundle, "README.md"), fill(await readFile(join(authored, "readme.md"), "utf8"), values, "readme.md"));
  await writeFile(join(bundle, "references", "routing-guide.md"), fill(await readFile(join(authored, "routing-guide.md"), "utf8"), values, "routing-guide.md"));
  await writeFile(join(bundle, "references", "skill-catalog.md"), renderCatalog(skills, stats));
  await writeFile(join(bundle, "LICENSE"), await readFile(join(root, "LICENSE")));
  await writeFile(join(bundle, "NOTICE"), await readFile(join(root, "NOTICE")));

  const manifestModules = [];
  for (const s of modules) {
    const files = await hashTree(join(bundle, modulePath(s)));
    manifestModules.push({
      name: s.name,
      category: s.category,
      kind: s.kind,
      method: methodPath(s),
      canonicalSource: s.sourceRel,
      canonicalSkillMdSha256: sha256(await readFile(join(s.source, "SKILL.md"))),
      launchChecks: s.launchChecks,
      complianceDomains: s.domains,
      helpers: s.helpers,
      companions: s.companions,
      files: Object.fromEntries(Object.entries(files).map(([p, h]) => [`${modulePath(s)}/${p}`, h])),
    });
  }
  const manifest = {
    slug: BUNDLE_SLUG,
    displayName: "ReadyVibe Skills",
    version,
    license: "Apache-2.0",
    source: `https://github.com/${REPO}`,
    entryPoint: "SKILL.md",
    skillCount: skills.length,
    launchChecks: allChecks.size,
    complianceDomains: allDomains.size,
    excludedInternalSkills: internal,
    skills: manifestModules,
    files: {},
  };
  for (const rel of ["SKILL.md", "README.md", "LICENSE", "NOTICE", "references/skill-catalog.md", "references/routing-guide.md"]) manifest.files[rel] = sha256(await readFile(join(bundle, rel)));
  await writeFile(join(bundle, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return { bundle, manifest, rewrites };
}

async function createZip(stageRoot, zipPath) {
  const files = [];
  const dirs = [];
  const walk = async (dir) => {
    dirs.push(dir);
    for (const e of await readdir(dir, { withFileTypes: true })) (e.isDirectory() ? await walk(join(dir, e.name)) : files.push(join(dir, e.name)));
  };
  await walk(join(stageRoot, BUNDLE_SLUG));
  for (const p of [...files, ...dirs]) await utimes(p, FIXED_TIME, FIXED_TIME);
  const list = files.map((f) => relative(stageRoot, f).split(sep).join("/")).sort();
  await rm(zipPath, { force: true });
  await mkdir(dirname(zipPath), { recursive: true });
  await new Promise((resolveP, rejectP) => {
    const child = spawn("zip", ["-q", "-X", "-D", "-9", resolve(zipPath), "-@"], { cwd: stageRoot, env: { ...process.env, TZ: "UTC" } });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (e) => rejectP(e.code === "ENOENT" ? new Error("The system zip command is required (Info-ZIP).") : e));
    child.on("close", (code) => (code === 0 ? resolveP() : rejectP(new Error(`zip failed (${code}): ${stderr}`))));
    child.stdin.end(`${list.join("\n")}\n`);
  });
}

/** Inspect the ZIP's member list without extracting. Throws on anything unsafe or misshapen. */
export async function validateArchive(zipPath) {
  let names;
  let detail;
  try {
    names = (await run("unzip", ["-Z", "-1", zipPath], { maxBuffer: 50_000_000 })).stdout.split(/\r?\n/).filter(Boolean);
    detail = (await run("unzip", ["-Z", zipPath], { maxBuffer: 50_000_000 })).stdout.split(/\r?\n/);
  } catch (error) {
    if (error.code === "ENOENT") fail("The system unzip command is required (Info-ZIP).");
    throw error;
  }
  if (!names.length) fail("the archive is empty");
  const tops = new Set(names.map((n) => n.split("/")[0]));
  if (tops.size !== 1 || !tops.has(BUNDLE_SLUG)) fail(`the archive must have exactly one top-level folder "${BUNDLE_SLUG}/", found: ${[...tops].join(", ")}`);
  for (const n of names) {
    const parts = n.split("/");
    if (n.startsWith("/") || /^[A-Za-z]:/.test(n) || n.includes("\\") || parts.includes("..") || parts.includes(".")) fail(`dangerous path in archive: ${n}`);
    if (parts.some((p) => p.startsWith("."))) fail(`hidden file or folder in archive: ${n}`);
  }
  if (detail.some((l) => /^l/.test(l))) fail("the archive contains a symlink");
  if (new Set(names).size !== names.length) fail("the archive contains duplicate paths");
  const skillFiles = names.filter((n) => n.split("/").pop().toLowerCase() === "skill.md");
  if (skillFiles.length !== 1 || skillFiles[0] !== `${BUNDLE_SLUG}/SKILL.md`) fail(`the archive must contain exactly one SKILL.md at ${BUNDLE_SLUG}/SKILL.md, found: ${skillFiles.join(", ") || "none"}`);
  for (const r of REQUIRED_ROOT) if (!names.includes(`${BUNDLE_SLUG}/${r}`)) fail(`the archive is missing ${r}`);
  return names;
}

export async function extractArchive(zipPath, dest) {
  await mkdir(dest, { recursive: true });
  await run("unzip", ["-q", "-o", zipPath, "-d", dest], { maxBuffer: 50_000_000 });
  return join(dest, BUNDLE_SLUG);
}

async function walkFiles(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name);
    const info = await lstat(abs);
    if (info.isSymbolicLink()) fail(`symlink in bundle: ${abs}`);
    if (info.isDirectory()) await walkFiles(abs, out);
    else out.push(abs);
  }
  return out;
}

const LINK_RE = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g;
const REPO_PATH_RE = /(^|[^\w/.~-])(?:docs\/(?:references|adr|archive|releases|skill-layout|current-model)|tools\/(?:sync-skills|lint-skills|verify-public-install|lib)|skills\/(?:core|compliance|accessibility|discoverability|quality|security|admin|internationalization|commerce)\/)/;

/**
 * Validate an extracted (or staged) bundle folder on its own: nothing from the source repository is consulted.
 * `expected` is the list of public skill names the bundle must contain.
 */
export async function validateBundleDir(bundle, { expected } = {}) {
  const problems = [];
  const bad = (m) => problems.push(m);
  const files = await walkFiles(bundle);
  const rels = files.map((f) => relative(bundle, f).split(sep).join("/"));
  const relSet = new Set(rels);

  const skillMds = rels.filter((r) => r.split("/").pop().toLowerCase() === "skill.md");
  if (skillMds.length !== 1 || skillMds[0] !== "SKILL.md") bad(`expected exactly one SKILL.md at the bundle root, found: ${skillMds.join(", ") || "none"}`);
  for (const r of rels) {
    if (r.split("/").some((p) => p.startsWith("."))) bad(`hidden path: ${r}`);
    if (!SAFE_FILE.test(r) && !["LICENSE", "NOTICE"].includes(r)) bad(`unexpected file type: ${r}`);
  }
  for (const r of REQUIRED_ROOT) if (!relSet.has(r)) bad(`missing ${r}`);
  if (problems.length) return problems;

  const master = splitFrontmatter(await readFile(join(bundle, "SKILL.md"), "utf8"), "SKILL.md");
  if (master.data.name !== BUNDLE_SLUG) bad(`master SKILL.md name must be ${BUNDLE_SLUG}, found ${master.data.name}`);
  const desc = String(master.data.description ?? "");
  if (!desc.includes("Use when") || !desc.includes("Do not use")) bad("master description must contain 'Use when' and 'Do not use'");
  if (desc.length > 1024) bad(`master description is ${desc.length} characters (max 1024)`);
  if (master.data.metadata?.["display-name"] !== "ReadyVibe Skills") bad("master display-name must be ReadyVibe Skills");

  const manifest = JSON.parse(await readFile(join(bundle, "manifest.json"), "utf8"));
  if (manifest.slug !== BUNDLE_SLUG || manifest.entryPoint !== "SKILL.md") bad("manifest slug/entryPoint is wrong");
  const names = manifest.skills.map((s) => s.name);
  if (new Set(names).size !== names.length) bad("a skill appears more than once in the manifest");
  if (manifest.skillCount !== names.length) bad("manifest skillCount does not match its skills");
  if (expected) {
    for (const n of expected) if (!names.includes(n)) bad(`public skill missing from the bundle: ${n}`);
    for (const n of names) if (!expected.includes(n)) bad(`unexpected skill in the bundle: ${n}`);
  }
  const methodFiles = rels.filter((r) => r.endsWith("/METHOD.md"));
  if (methodFiles.length !== names.length) bad(`found ${methodFiles.length} METHOD.md files for ${names.length} skills`);

  // Every packaged file matches its manifest hash, and nothing is packaged that the manifest does not list.
  const listed = new Set(["manifest.json"]);
  for (const [p, h] of Object.entries(manifest.files)) {
    listed.add(p);
    if (!relSet.has(p)) bad(`manifest lists missing file ${p}`);
    else if (sha256(await readFile(join(bundle, p))) !== h) bad(`checksum mismatch: ${p}`);
  }
  for (const s of manifest.skills) {
    if (!relSet.has(s.method)) bad(`method path does not resolve: ${s.method}`);
    for (const [p, h] of Object.entries(s.files)) {
      listed.add(p);
      if (!relSet.has(p)) bad(`manifest lists missing file ${p}`);
      else if (sha256(await readFile(join(bundle, p))) !== h) bad(`checksum mismatch: ${p}`);
    }
    for (const h of s.helpers) if (!relSet.has(`${posix.dirname(s.method)}/scripts/${h}.mjs`)) bad(`${s.name}: helper ${h} is not packaged`);
    for (const c of s.companions) {
      const target = manifest.skills.find((x) => x.name === c);
      if (!target) bad(`${s.name}: companion ${c} is not in the bundle`);
      const doc = `${posix.dirname(s.method)}/references/companion-methods.md`;
      if (relSet.has(doc) && !(await readFile(join(bundle, doc), "utf8")).includes(`### ${c}`)) bad(`${s.name}: companion ${c} has no fallback entry`);
    }
    if (s.companions.length && !relSet.has(`${posix.dirname(s.method)}/references/companion-methods.md`)) bad(`${s.name}: companions declared but no companion-methods.md packaged`);
  }
  for (const r of rels) if (!listed.has(r)) bad(`file is not listed in manifest.json: ${r}`);

  // The catalog and master must reach every method.
  const catalog = await readFile(join(bundle, "references/skill-catalog.md"), "utf8");
  for (const s of manifest.skills) {
    const headings = catalog.match(new RegExp(`^### ${s.name}$`, "gm")) ?? [];
    if (headings.length !== 1) bad(`catalog lists ${s.name} ${headings.length} times (expected once)`);
    if (!catalog.includes(`](../${s.method})`)) bad(`catalog has no resolving link to ${s.method}`);
  }

  for (const f of files) {
    const rel = relative(bundle, f).split(sep).join("/");
    const text = await readFile(f, "utf8");
    const dir = dirname(f);
    if (/\{\{[A-Z_]+\}\}/.test(text)) bad(`${rel}: unresolved placeholder`);
    if (/@readyvibe\//.test(text)) bad(`${rel}: refers to a ReadyVibe package`);
    if (rel.endsWith(".md")) {
      for (const m of text.matchAll(LINK_RE)) {
        const target = m[1];
        if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
        const path = decodeURIComponent(target.split("#")[0].split("?")[0]);
        if (!path) continue;
        const abs = resolve(dir, path);
        if (relative(bundle, abs).startsWith("..")) bad(`${rel}: link escapes the bundle: ${target}`);
        else if (!existsSync(abs)) bad(`${rel}: broken relative link ${target}`);
      }
      if (rel.startsWith("modules/")) {
        const modDir = rel.split("/").slice(0, 3).join("/");
        for (const m of text.matchAll(/scripts\/([a-z][a-z0-9-]*)\.mjs/g)) if (!relSet.has(`${modDir}/scripts/${m[1]}.mjs`)) bad(`${rel}: mentions scripts/${m[1]}.mjs, which this module does not carry`);
        if (REPO_PATH_RE.test(text.replace(/https?:\/\/\S+/g, ""))) bad(`${rel}: refers to a path that exists only in the source repository (docs/, tools/, or skills/<category>/)`);
      } else {
        for (const m of text.matchAll(/`((?:modules\/[^`\s<>*]+|references\/(?:skill-catalog|routing-guide))\.(?:md|mjs|json))`/g)) if (!relSet.has(m[1])) bad(`${rel}: names ${m[1]}, which is not in the bundle`);
      }
    }
    if (rel.endsWith(".mjs")) {
      const modDir = rel.startsWith("modules/") ? rel.split("/").slice(0, 3).join("/") : null;
      for (const m of text.matchAll(IMPORT_RE)) {
        const abs = resolve(dir, m[1]);
        const target = relative(bundle, abs).split(sep).join("/");
        if (!relSet.has(target)) bad(`${rel}: import ${m[1]} does not resolve`);
        else if (modDir && !target.startsWith(`${modDir}/`)) bad(`${rel}: import ${m[1]} leaves its module`);
      }
    }
  }
  return problems;
}

export async function buildBundle({ root, outDir, check = false, preflight = { sync: true, lint: true } } = {}) {
  root = resolve(root);
  const steps = await preflightChecks(root, preflight);
  const { skills, internal } = await discoverPublicSkills(root);
  steps.push(`discovered ${skills.length} public skill(s)${internal.length ? `, excluded ${internal.length} internal` : ""}`);
  const version = JSON.parse(await readFile(join(root, "package.json"), "utf8")).version;
  if (!/^\d+\.\d+\.\d+/.test(version)) fail(`package.json version "${version}" is not SemVer`);

  const work = await mkdtemp(join(tmpdir(), "rv-bundle-"));
  try {
    const stageRoot = join(work, "stage");
    await mkdir(stageRoot);
    const staged = await stage({ root, stageRoot, skills, internal, version });
    const stagedProblems = await validateBundleDir(staged.bundle, { expected: skills.map((s) => s.name) });
    if (stagedProblems.length) fail(`staged bundle failed validation:\n${stagedProblems.map((p) => `  - ${p}`).join("\n")}`);
    steps.push("staged bundle validated");

    const zipPath = join(work, ZIP_NAME);
    await createZip(stageRoot, zipPath);
    const members = await validateArchive(zipPath);
    const extracted = await extractArchive(zipPath, join(work, "extracted"));
    const problems = await validateBundleDir(extracted, { expected: skills.map((s) => s.name) });
    if (problems.length) fail(`archive failed validation after extraction:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    steps.push(`archive validated (${members.length} files, extracted and re-checked in isolation)`);

    const zipBytes = await readFile(zipPath);
    const report = {
      zip: ZIP_NAME,
      topLevelFolder: BUNDLE_SLUG,
      version,
      skills: skills.length,
      launchChecks: staged.manifest.launchChecks,
      complianceDomains: staged.manifest.complianceDomains,
      excludedInternalSkills: internal,
      files: members.length,
      sizeBytes: zipBytes.length,
      sha256: sha256(zipBytes),
      skillMdRewrites: staged.rewrites,
      steps,
    };
    if (check) return { report, outPath: null };

    const dest = resolve(outDir ?? join(root, "dist", "agensi"));
    await mkdir(dest, { recursive: true });
    const outZip = join(dest, ZIP_NAME);
    await writeFile(outZip, zipBytes);
    await writeFile(join(dest, "bundle-report.json"), `${JSON.stringify(report, null, 2)}\n`);
    const listing = join(root, "docs", "marketplace", "agensi-listing.md");
    if (existsSync(listing)) await writeFile(join(dest, "ReadyVibe-Skills.listing.md"), await readFile(listing));
    return { report, outPath: outZip };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

/**
 * Deterministic keyword hints for a request: routes ranked by the total length of the keywords they match
 * (longer = more specific), ties broken by order in routes.json. The master router tells the agent to use
 * judgment; this exists so routing hints are testable and cannot silently drift from the skill list.
 */
export function matchRoutes(request, routes) {
  const text = String(request).toLowerCase();
  const scored = [];
  routes.forEach((route, index) => {
    let score = 0;
    for (const kw of route.keywords) {
      const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?<![a-z0-9])${escaped}(?:s|es|ed|ing)?(?![a-z0-9])`).test(text)) score += kw.length;
    }
    if (score) scored.push({ id: route.id, load: route.load, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index);
}

export async function readRoutes(root) {
  return JSON.parse(await readFile(join(root, "marketplace", "bundle", "routes.json"), "utf8")).routes;
}
