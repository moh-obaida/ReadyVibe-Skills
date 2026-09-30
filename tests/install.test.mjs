// Installability: what a user gets from `npx skills add`, using a copy of skills/ as the "repository".
// Locally, if the Skills CLI cannot be fetched (offline) these tests are skipped. In CI they must run:
// a skills repository that cannot test its own distribution mechanism should fail.
import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { parse } from "yaml";

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CI = Boolean(process.env.CI);
const strip = (s) => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "");

function skillDirs() {
  const out = new Map();
  for (const cat of readdirSync(join(root, "skills"))) for (const name of readdirSync(join(root, "skills", cat))) if (existsSync(join(root, "skills", cat, name, "SKILL.md"))) out.set(name, join(root, "skills", cat, name));
  return out;
}
const ALL = skillDirs();

/** Everything a skill needs must be inside its own folder. Throws AssertionError with the skill name. */
function assertSelfContained(name, dir, { siblingsAbsentIn } = {}) {
  const raw = readFileSync(join(dir, "SKILL.md"), "utf8");
  const [, front, body] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = parse(front).metadata ?? {};
  const csv = (v) => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  for (const h of csv(meta.helpers)) assert.ok(existsSync(join(dir, "scripts", `${h}.mjs`)), `${name}: helper ${h} is not inside the skill`);
  for (const r of csv(meta.references)) assert.ok(existsSync(join(dir, "references", `${r}.md`)), `${name}: reference ${r} is not inside the skill`);
  for (const m of body.matchAll(/\]\((references\/[^)#\s]+)\)/g)) assert.ok(existsSync(join(dir, m[1])), `${name}: links to ${m[1]}, which is not inside the skill`);
  for (const m of body.matchAll(/scripts\/([a-z][a-z-]*)\.mjs/g)) assert.ok(existsSync(join(dir, "scripts", `${m[1]}.mjs`)), `${name}: runs scripts/${m[1]}.mjs, which is not inside the skill`);

  // Companions are declared, not inferred from mentions. The skill carries exactly those fallbacks, pruned.
  const companions = csv(meta.companions);
  for (const c of companions) assert.ok(ALL.has(c) && c !== name, `${name}: declared companion ${c} is not another ReadyVibe skill`);
  const doc = join(dir, "references", "companion-methods.md");
  if (companions.length) {
    assert.ok(existsSync(doc), `${name}: declares companions but carries no companion-methods.md`);
    const entries = [...readFileSync(doc, "utf8").matchAll(/^###\s+(\S+)\s*$/gm)].map((m) => m[1]).sort();
    assert.deepEqual(entries, [...companions].sort(), `${name}: companion-methods.md must contain exactly the declared companions`);
    assert.ok(/## Working alone/.test(body), `${name}: declares companions but has no Working alone section`);
  } else {
    assert.ok(!existsSync(doc), `${name}: declares no companions but carries a companion-methods.md`);
  }
  if (siblingsAbsentIn) for (const other of ALL.keys()) if (other !== name) assert.ok(!existsSync(join(siblingsAbsentIn, other)), `${name}: sibling ${other} is present, so this is not an isolated install`);
  return { helpers: csv(meta.helpers), companions };
}

describe("every skill is self-contained (static check on its own folder)", () => {
  test("links, helpers, references, and companion fallbacks all resolve inside the skill folder", () => {
    for (const [name, dir] of ALL) assertSelfContained(name, dir);
    assert.ok(ALL.size >= 55, `expected at least 55 skills, found ${ALL.size}`);
  });
});

const fakeRepo = mkdtempSync(join(tmpdir(), "rv-repo-"));
cpSync(join(root, "skills"), join(fakeRepo, "skills"), { recursive: true });

let listing = "";
let available = true;
try {
  const { stdout, stderr } = await run("npx", ["-y", "skills", "add", fakeRepo, "--list"], { timeout: 180000, maxBuffer: 20_000_000 });
  listing = strip(`${stdout}${stderr}`);
  available = /Found \d+ skills/.test(listing);
} catch {
  available = false;
}
const skip = available || CI ? false : "The Skills CLI could not be run (offline?). Not run.";

describe("npx skills add", () => {
  test("the Skills CLI is available (mandatory in CI)", () => {
    if (CI) assert.ok(available, "In CI the Skills CLI must be runnable: this repository's distribution mechanism has to be tested.");
  });

  test("discovers every skill in the repository", { skip }, () => {
    assert.equal(Number(listing.match(/Found (\d+) skills/)[1]), ALL.size);
    for (const name of ALL.keys()) assert.ok(listing.includes(name), `${name} is not listed`);
  });

  for (const name of ["launch-all", "privacy-policy", "admin-dashboard", "consent-management"]) {
    test(`${name} works when it is the ONLY skill installed`, { skip }, async () => {
      const project = mkdtempSync(join(tmpdir(), `rv-alone-${name}-`));
      execFileSync("git", ["init", "-q"], { cwd: project });
      await run("npx", ["-y", "skills", "add", fakeRepo, "--skill", name, "-y", "--agent", "claude-code"], { cwd: project, timeout: 180000, maxBuffer: 20_000_000 });

      const skillsDir = join(project, ".claude", "skills");
      assert.deepEqual(readdirSync(skillsDir), [name], "exactly one skill must be installed");
      const dir = join(skillsDir, name);
      const { helpers } = assertSelfContained(name, dir, { siblingsAbsentIn: skillsDir });

      const files = [];
      (function walk(d) {
        for (const e of readdirSync(d)) (statSync(join(d, e)).isDirectory() ? walk(join(d, e)) : files.push(join(d, e)));
      })(dir);
      for (const f of files) assert.ok(!/@readyvibe\//.test(readFileSync(f, "utf8")), `${f} refers to a ReadyVibe package`);

      // Every bundled helper starts from the installed location: no repository, no ReadyVibe package.
      for (const h of helpers) {
        let stderr = "";
        try {
          await run(process.execPath, [join(dir, "scripts", `${h}.mjs`)], { cwd: project, timeout: 30000 });
        } catch (error) {
          stderr = String(error.stderr ?? "");
        }
        assert.ok(!/Cannot find module|ERR_MODULE_NOT_FOUND|SyntaxError/.test(stderr), `${name}: helper ${h} fails to start when installed alone: ${stderr.slice(0, 200)}`);
      }
    });
  }

  test("an installed helper does real work from the installed location", { skip }, async () => {
    const project = mkdtempSync(join(tmpdir(), "rv-project-"));
    execFileSync("git", ["init", "-q"], { cwd: project });
    await run("npx", ["-y", "skills", "add", fakeRepo, "--skill", "seo-readiness", "link-integrity", "-y", "--agent", "claude-code"], { cwd: project, timeout: 180000, maxBuffer: 20_000_000 });
    const site = join(root, "fixtures", "leaky-site");
    const seo = await run(process.execPath, [join(project, ".claude", "skills", "seo-readiness", "scripts", "inspect-metadata.mjs"), "--dir", site, "--json"], { cwd: project });
    assert.ok(JSON.parse(seo.stdout).findings.some((f) => f.code === "CANONICAL_LOCALHOST"));
    const links = await run(process.execPath, [join(project, ".claude", "skills", "link-integrity", "scripts", "check-links.mjs"), "--dir", site, "--json"], { cwd: project });
    assert.ok(JSON.parse(links.stdout).findings.some((f) => f.code === "LINK_BROKEN"));
  });
});
