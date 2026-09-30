// Shared checks for "what does a user actually get from `npx skills add`?".
// Used by tests/install.test.mjs (against a copy of skills/) and tools/verify-public-install.mjs
// (against the real GitHub remote or a pinned tag), so the two can never drift apart.

import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { parse } from "yaml";

const run = promisify(execFile);
export const strip = (s) => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "");
const csv = (v) => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** `skills add <spec> --list`: returns { count, names, raw }. Throws if the CLI or source is unavailable. */
export async function listSkills(spec, { cwd } = {}) {
  const { stdout, stderr } = await run("npx", ["-y", "skills", "add", spec, "--list"], { cwd, timeout: 240000, maxBuffer: 30_000_000 });
  const raw = strip(`${stdout}${stderr}`);
  const found = raw.match(/Found (\d+) skills/);
  assert.ok(found, `the Skills CLI did not list skills for ${spec}:\n${raw.slice(0, 400)}`);
  // Skill names appear on their own line, indented, right before their description.
  const names = [...raw.matchAll(/^│\s{4}([a-z0-9]+(?:-[a-z0-9]+)*)\s*$/gm)].map((m) => m[1]);
  return { count: Number(found[1]), names, raw };
}

export function freshProject(prefix = "rv-project-") {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  return dir;
}

/** Install ONE skill into a fresh project, exactly as a user would with `--skill`. */
export async function installAlone(spec, name, { agent = "claude-code" } = {}) {
  const project = freshProject(`rv-alone-${name}-`);
  await run("npx", ["-y", "skills", "add", spec, "--skill", name, "-y", "--agent", agent], { cwd: project, timeout: 240000, maxBuffer: 30_000_000 });
  return { project, skillsDir: join(project, ".claude", "skills") };
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) (statSync(join(dir, e)).isDirectory() ? walk(join(dir, e), out) : out.push(join(dir, e)));
  return out;
}

/**
 * Everything a skill needs must be inside its own folder. `allNames` is the set of ReadyVibe skill names, so
 * we can tell a declared companion from an ordinary word. Throws AssertionError naming the skill.
 */
export function assertSelfContained(name, dir, { allNames, siblingsAbsentIn } = {}) {
  const raw = readFileSync(join(dir, "SKILL.md"), "utf8");
  const [, front, body] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = parse(front).metadata ?? {};

  for (const h of csv(meta.helpers)) assert.ok(existsSync(join(dir, "scripts", `${h}.mjs`)), `${name}: helper ${h} is not inside the skill`);
  for (const r of csv(meta.references)) assert.ok(existsSync(join(dir, "references", `${r}.md`)), `${name}: reference ${r} is not inside the skill`);
  for (const m of body.matchAll(/\]\((references\/[^)#\s]+)\)/g)) assert.ok(existsSync(join(dir, m[1])), `${name}: links to ${m[1]}, which is not inside the skill`);
  for (const m of body.matchAll(/scripts\/([a-z][a-z-]*)\.mjs/g)) assert.ok(existsSync(join(dir, "scripts", `${m[1]}.mjs`)), `${name}: runs scripts/${m[1]}.mjs, which is not inside the skill`);

  // Companions are declared, not inferred from mentions. The skill carries exactly those fallbacks, pruned.
  const companions = csv(meta.companions);
  for (const c of companions) assert.ok((!allNames || allNames.has(c)) && c !== name, `${name}: declared companion ${c} is not another ReadyVibe skill`);
  const doc = join(dir, "references", "companion-methods.md");
  if (companions.length) {
    assert.ok(existsSync(doc), `${name}: declares companions but carries no companion-methods.md`);
    const entries = [...readFileSync(doc, "utf8").matchAll(/^###\s+(\S+)\s*$/gm)].map((m) => m[1]).sort();
    assert.deepEqual(entries, [...companions].sort(), `${name}: companion-methods.md must contain exactly the declared companions`);
    assert.ok(/## Working alone/.test(body), `${name}: declares companions but has no Working alone section`);
  } else {
    assert.ok(!existsSync(doc), `${name}: declares no companions but carries a companion-methods.md`);
  }

  if (siblingsAbsentIn && allNames) for (const other of allNames) if (other !== name) assert.ok(!existsSync(join(siblingsAbsentIn, other)), `${name}: sibling ${other} is present, so this is not an isolated install`);
  for (const f of walk(dir)) assert.ok(!/@readyvibe\//.test(readFileSync(f, "utf8")), `${f}: refers to a ReadyVibe package`);
  return { helpers: csv(meta.helpers), companions };
}

/** Start every bundled helper from the installed location with no arguments: it must fail with usage, never with a missing import. */
export async function assertHelpersStart(name, dir, helpers, cwd) {
  for (const h of helpers) {
    let stderr = "";
    try {
      await run(process.execPath, [join(dir, "scripts", `${h}.mjs`)], { cwd, timeout: 30000 });
    } catch (error) {
      stderr = String(error.stderr ?? "");
    }
    assert.ok(!/Cannot find module|ERR_MODULE_NOT_FOUND|SyntaxError/.test(stderr), `${name}: helper ${h} fails to start when installed alone: ${stderr.slice(0, 200)}`);
  }
}
