// Installability: what a user gets from `npx skills add`, using a copy of skills/ as the "repository".
// (tools/verify-public-install.mjs runs the same checks against the real GitHub remote and release tags.)
// Locally, if the Skills CLI cannot be fetched (offline) these tests are skipped. In CI they must run:
// a skills repository that cannot test its own distribution mechanism should fail.
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { assertHelpersStart, assertSelfContained, installAlone, listSkills } from "../tools/lib/install-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CI = Boolean(process.env.CI);

const ALL = new Map();
for (const cat of readdirSync(join(root, "skills"))) for (const name of readdirSync(join(root, "skills", cat))) if (existsSync(join(root, "skills", cat, name, "SKILL.md"))) ALL.set(name, join(root, "skills", cat, name));
const allNames = new Set(ALL.keys());

describe("every skill is self-contained (static check on its own folder)", () => {
  test("links, helpers, references, and companion fallbacks all resolve inside the skill folder", () => {
    for (const [name, dir] of ALL) assertSelfContained(name, dir, { allNames });
    assert.ok(ALL.size >= 55, `expected at least 55 skills, found ${ALL.size}`);
  });
});

const fakeRepo = mkdtempSync(join(tmpdir(), "rv-repo-"));
cpSync(join(root, "skills"), join(fakeRepo, "skills"), { recursive: true });

let listing = null;
try {
  listing = await listSkills(fakeRepo);
} catch {
  listing = null;
}
const available = listing !== null;
const skip = available || CI ? false : "The Skills CLI could not be run (offline?). Not run.";

describe("npx skills add", () => {
  test("the Skills CLI is available (mandatory in CI)", () => {
    if (CI) assert.ok(available, "In CI the Skills CLI must be runnable: this repository's distribution mechanism has to be tested.");
  });

  test("discovers every skill in the repository, with names that match the folders", { skip }, () => {
    assert.equal(listing.count, ALL.size);
    assert.deepEqual([...listing.names].sort(), [...allNames].sort());
  });

  for (const name of ["launch-all", "privacy-policy", "admin-dashboard", "consent-management"]) {
    test(`${name} works when it is the ONLY skill installed`, { skip }, async () => {
      const { project, skillsDir } = await installAlone(fakeRepo, name);
      assert.deepEqual(readdirSync(skillsDir), [name], "exactly one skill must be installed");
      const dir = join(skillsDir, name);
      const { helpers } = assertSelfContained(name, dir, { allNames, siblingsAbsentIn: skillsDir });
      await assertHelpersStart(name, dir, helpers, project);
    });
  }

  test("an installed helper does real work from the installed location", { skip }, async () => {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const run = promisify(execFile);
    const { project, skillsDir } = await installAlone(fakeRepo, "seo-readiness");
    const site = join(root, "fixtures", "leaky-site");
    const seo = await run(process.execPath, [join(skillsDir, "seo-readiness", "scripts", "inspect-metadata.mjs"), "--dir", site, "--json"], { cwd: project });
    assert.ok(JSON.parse(seo.stdout).findings.some((f) => f.code === "CANONICAL_LOCALHOST"));
    const links = await installAlone(fakeRepo, "link-integrity");
    const out = await run(process.execPath, [join(links.skillsDir, "link-integrity", "scripts", "check-links.mjs"), "--dir", site, "--json"], { cwd: links.project });
    assert.ok(JSON.parse(out.stdout).findings.some((f) => f.code === "LINK_BROKEN"));
  });
});
