#!/usr/bin/env node
// verify-public-install.mjs - prove the real distribution path works, against the PUBLIC GitHub repository.
//
//   node tools/verify-public-install.mjs [spec] [--all]
//
//   spec   what to give `npx skills add`; default moh-obaida/ReadyVibe-Skills
//          examples: moh-obaida/ReadyVibe-Skills#v1.0.0     a pinned release
//                    moh-obaida/ReadyVibe-Skills#<sha>      an exact commit
//   --all  also run `skills add <spec> --all` and verify every installed skill
//
// Exits non-zero on the first failure. Needs network access and the Skills CLI (fetched with npx).

import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertHelpersStart, assertSelfContained, freshProject, installAlone, listSkills } from "./lib/install-check.mjs";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const run = promisify(execFile);
const args = process.argv.slice(2);
const spec = args.find((a) => !a.startsWith("--")) ?? "moh-obaida/ReadyVibe-Skills";
const doAll = args.includes("--all");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPRESENTATIVE = ["launch-all", "privacy-policy", "admin-dashboard", "consent-management", "seo-readiness"];

const step = (msg) => console.log(`\n== ${msg}`);
step(`Skills CLI listing for ${spec}`);
const listing = await listSkills(spec);
const allNames = new Set(listing.names);
console.log(`   found ${listing.count} skills; parsed ${allNames.size} names`);
assert.equal(allNames.size, listing.count, "the number of parsed skill names must equal the CLI's own count");
for (const must of REPRESENTATIVE) assert.ok(allNames.has(must), `${must} is missing from the listing`);

if (existsSync(join(root, "skills"))) {
  // When run from a checkout, the listing must match the checkout exactly (skip when verifying a different ref on purpose).
  const local = [];
  for (const c of readdirSync(join(root, "skills"))) for (const n of readdirSync(join(root, "skills", c))) if (existsSync(join(root, "skills", c, n, "SKILL.md"))) local.push(n);
  if (!args.includes("--no-compare-local")) {
    const missing = local.filter((n) => !allNames.has(n));
    const extra = [...allNames].filter((n) => !local.includes(n));
    if (missing.length || extra.length) console.log(`   note: differs from this checkout (missing remotely: ${missing.join(", ") || "none"}; only remote: ${extra.join(", ") || "none"}). Fine when verifying an older ref; pass --no-compare-local to silence.`);
  }
}

for (const name of REPRESENTATIVE) {
  step(`install ONLY ${name} from ${spec}`);
  const { project, skillsDir } = await installAlone(spec, name);
  assert.deepEqual(readdirSync(skillsDir), [name], "exactly the requested skill must be installed");
  const dir = join(skillsDir, name);
  const { helpers, companions } = assertSelfContained(name, dir, { allNames, siblingsAbsentIn: skillsDir });
  await assertHelpersStart(name, dir, helpers, project);
  console.log(`   ok: SKILL.md, ${helpers.length} helper(s) [${helpers.join(", ")}], ${companions.length} declared companion(s), no sibling installed`);
}

if (doAll) {
  step(`install ALL from ${spec} (--all)`);
  const project = freshProject("rv-all-");
  await run("npx", ["-y", "skills", "add", spec, "--all"], { cwd: project, timeout: 600000, maxBuffer: 50_000_000 });
  const skillsDir = join(project, ".claude", "skills");
  const installed = readdirSync(skillsDir).sort();
  assert.deepEqual(installed, [...allNames].sort(), "--all must install every listed skill");
  for (const name of installed) {
    const { helpers } = assertSelfContained(name, join(skillsDir, name), { allNames });
    await assertHelpersStart(name, join(skillsDir, name), helpers, project);
  }
  console.log(`   ok: ${installed.length} skills installed and verified`);
}
console.log(`\nPASS: ${spec} installs correctly through the real Skills CLI.`);
