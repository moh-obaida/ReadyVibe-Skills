import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import { parseDocument } from "yaml";

const run = promisify(execFile);
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_FILE = /\.(?:md|mjs|js|json|yml|yaml|txt|css|html|svg)$/i;
const ALLOWED = new Set(["SKILL.md", "references", "scripts", "assets"]);
const CLEAN = new Set([".DS_Store", "Thumbs.db"]);

function assertSafeName(name) {
  if (!NAME.test(name) || name.length > 64) throw new Error("Invalid skill name: " + name);
}

async function publishedSkills(root) {
  const skills = [];
  const base = join(root, "skills");
  for (const category of (await readdir(base, { withFileTypes: true })).filter(x => x.isDirectory())) {
    const categoryDir = join(base, category.name);
    for (const item of (await readdir(categoryDir, { withFileTypes: true })).filter(x => x.isDirectory())) {
      const name = item.name;
      assertSafeName(name);
      const source = join(categoryDir, name);
      const content = await readFile(join(source, "SKILL.md"), "utf8");
      const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
      if (!match) throw new Error("Missing YAML frontmatter in " + source);
      const parsed = parseDocument(match[1], { uniqueKeys: true });
      if (parsed.errors.length) throw new Error("Invalid YAML in " + source + ": " + parsed.errors[0].message);
      const frontmatter = parsed.toJS();
      if (frontmatter.name !== name) throw new Error("Skill name must match folder: " + source);
      if (typeof frontmatter.description !== "string" || !frontmatter.description.trim()) {
        throw new Error("Missing description: " + source);
      }
      // This is the repository's existing public-canary rule; never publish private skills.
      if (frontmatter.metadata?.internal === true) continue;
      skills.push({ name, category: category.name, source, description: frontmatter.description.trim() });
    }
  }
  const seen = new Set();
  for (const skill of skills) {
    if (seen.has(skill.name)) throw new Error("Duplicate skill slug: " + skill.name);
    seen.add(skill.name);
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

async function copyPublishedFiles(source, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    if (!ALLOWED.has(entry.name)) continue;
    if (entry.name !== "SKILL.md" && !entry.isDirectory()) {
      throw new Error("Expected a directory for " + entry.name + " in " + source);
    }
    const from = join(source, entry.name);
    const target = join(dest, entry.name);
    await cp(from, target, {
      recursive: true,
      filter: async (path) => {
        const info = await lstat(path);
        if (info.isSymbolicLink()) throw new Error("Symlink not allowed in marketplace ZIP: " + path);
        const rel = relative(source, path);
        const parts = rel.split(sep);
        if (parts.some(p => p.startsWith(".") || CLEAN.has(p))) return false;
        if (info.isDirectory()) return true;
        if (!info.isFile() || !SAFE_FILE.test(path)) throw new Error("Unsupported marketplace file: " + path);
        return true;
      }
    });
  }
}

function worksheet(skill, repo) {
  const lines = [
    "# Marketplace listing worksheet: " + skill.name,
    "",
    "This is a DRAFT assembled from the source skill. Review it before entering any fields on Agensi.",
    "",
    "Skill name: " + skill.name,
    "Category: " + skill.category,
    "Repository source: https://github.com/" + repo + "/tree/main/skills/" + skill.category + "/" + skill.name,
    "License: Apache-2.0 (the same source remains freely accessible on GitHub).",
    "",
    "## Summary",
    "",
    "Write a concise buyer-facing sentence. Source activation description:",
    "",
    "> " + skill.description.replaceAll("\n", " "),
    "",
    "## Full description",
    "",
    "Explain the actual inspect/fix/verify workflow in SKILL.md. Keep scope, limitations, and human review requirements explicit. Do not claim certification, legal compliance, or automated coverage the skill cannot prove.",
    "",
    "## See it in action (demo)",
    "",
    "Request: TODO — a specific, realistic prompt for this skill. Use a non-sensitive sample project.",
    "",
    "Result: TODO — paste a real agent run (at least 700 characters if Agensi requires that); include observed findings, what changed, verification, remaining unknowns, and any human review needed. Do not invent a successful audit.",
    "",
    "## Compatibility",
    "",
    "Confirm each agent on which you have actually installed/tested this ZIP. Review script runtime/browser dependencies for this particular skill; do not claim universal support without testing.",
    "",
    "## Permissions and external URLs",
    "",
    "Inspect SKILL.md and every packaged helper before declaring needed file access, network hosts, shell commands, or environment variables. Do not copy the auto-detected host list without verifying each host is accessed by this skill.",
    "",
    "## Pricing, media, and FAQs",
    "",
    "Pricing: choose explicitly in the dashboard. The packaged materials are Apache-2.0 and already available free on GitHub; do not imply exclusivity.",
    "Logo/screenshots: TODO — include genuine screenshots or authored artwork only.",
    "FAQs: answer what it does, limitations, dependencies, compatibility, and how it differs from the free source accurately.",
    "",
    "## Submission check",
    "",
    "- [ ] ZIP contains one top-level folder named " + skill.name + " with SKILL.md directly inside.",
    "- [ ] Real demo output and accurate permissions checked.",
    "- [ ] Source license, non-exclusivity, and any pricing clearly disclosed.",
    "- [ ] Platform security scan and human review completed.",
    ""
  ];
  return lines.join("\n");
}

export async function buildMarketplace({ root, outDir, only, check = false, repo = "moh-obaida/ReadyVibe-Skills" }) {
  const all = await publishedSkills(root);
  if (only && !all.some(s => s.name === only)) throw new Error("No public skill named " + only);
  const selected = only ? all.filter(s => s.name === only) : all;
  const tempOut = check ? await mkdtemp(join(tmpdir(), "rv-marketplace-check-")) : null;
  const destination = tempOut || resolve(outDir || join(root, "dist", "agensi"));
  const listingDir = join(destination, "listings");
  await mkdir(listingDir, { recursive: true });
  const manifest = [];
  try {
    for (const skill of selected) {
      const temp = await mkdtemp(join(tmpdir(), "rv-marketplace-"));
      try {
        const packed = join(temp, skill.name);
        await copyPublishedFiles(skill.source, packed);
        const license = await readFile(join(root, "LICENSE"), "utf8");
        await writeFile(join(packed, "LICENSE"), license);
        const notice = await readFile(join(root, "NOTICE"), "utf8");
        await writeFile(join(packed, "NOTICE"), notice);
        const readme = [
          "# " + skill.name,
          "",
          "A standalone ReadyVibe skill. Read SKILL.md for activation rules, method, limits, and evidence requirements.",
          "",
          "Source: https://github.com/" + repo + "/tree/main/skills/" + skill.category + "/" + skill.name,
          "License: Apache-2.0; see LICENSE and NOTICE.",
          "",
          "Install by extracting this folder to the skills directory supported by your agent. Helper scripts and references are included locally.",
          "Any optional companion skill has a reduced-depth fallback within this folder. Check SKILL.md for the applicable caveats.",
          ""
        ].join("\n");
        await writeFile(join(packed, "README.md"), readme);
        const zip = join(destination, skill.name + ".zip");
        try {
          await run("zip", ["-q", "-X", "-r", zip, skill.name], { cwd: temp });
        } catch (error) {
          if (error.code === "ENOENT") throw new Error("The system zip command is required (Info-ZIP).");
          throw error;
        }
        const { stdout } = await run("unzip", ["-Z", "-1", zip]);
        const members = stdout.split(/\r?\n/).filter(Boolean);
        if (!members.includes(skill.name + "/SKILL.md")) throw new Error("Missing SKILL.md in " + zip);
        if (members.some(p => !p.startsWith(skill.name + "/") || p.includes("../") || p.startsWith("/"))) {
          throw new Error("Unexpected path in marketplace ZIP " + zip);
        }
        await writeFile(join(listingDir, skill.name + ".md"), worksheet(skill, repo));
        manifest.push({
          name: skill.name,
          category: skill.category,
          filename: skill.name + ".zip",
          source: "skills/" + skill.category + "/" + skill.name,
          description: skill.description,
          license: "Apache-2.0"
        });
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    }
    await writeFile(join(destination, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    return manifest;
  } finally {
    if (tempOut) await rm(tempOut, { recursive: true, force: true });
  }
}
