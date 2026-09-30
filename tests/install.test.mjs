// Installability: what a user gets from `npx skills add`, using a copy of skills/ as the "repository".
// Needs npm access once to fetch the `skills` CLI; if that is unavailable the tests are skipped, not failed.
import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const strip = (s) => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "");

function skillDirs() {
  const out = [];
  for (const cat of readdirSync(join(root, "skills"))) for (const name of readdirSync(join(root, "skills", cat))) if (existsSync(join(root, "skills", cat, name, "SKILL.md"))) out.push(name);
  return out;
}

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
const skip = available ? false : "The Skills CLI could not be run (offline?). Not run.";

describe("npx skills add", () => {
  test("discovers every skill in the repository", { skip }, () => {
    const expected = skillDirs();
    assert.equal(Number(listing.match(/Found (\d+) skills/)[1]), expected.length);
    for (const name of expected) assert.ok(listing.includes(name), `${name} is not listed`);
  });

  test("an installed skill is self-contained: files, helpers, and references travel with it and run alone", { skip }, async () => {
    const project = mkdtempSync(join(tmpdir(), "rv-project-"));
    execFileSync("git", ["init", "-q"], { cwd: project });
    const wanted = ["seo-readiness", "link-integrity", "privacy-policy", "consent-management"];
    await run("npx", ["-y", "skills", "add", fakeRepo, "--skill", ...wanted, "-y", "--agent", "claude-code"], { cwd: project, timeout: 180000, maxBuffer: 20_000_000 });

    for (const name of wanted) {
      const dir = join(project, ".claude", "skills", name);
      assert.ok(existsSync(join(dir, "SKILL.md")), `${name} was not installed`);
      const front = readFileSync(join(dir, "SKILL.md"), "utf8").match(/^---\n([\s\S]*?)\n---/)[1];
      for (const h of (front.match(/helpers:\s*"([^"]*)"/)?.[1] ?? "").split(",").filter(Boolean)) assert.ok(existsSync(join(dir, "scripts", `${h}.mjs`)), `${name} is missing helper ${h}`);
      if (/references:\s*"official-sources"/.test(front)) assert.ok(existsSync(join(dir, "references", "official-sources.md")), `${name} is missing official-sources`);
      const files = [];
      (function walk(d) {
        for (const e of readdirSync(d)) (statSync(join(d, e)).isDirectory() ? walk(join(d, e)) : files.push(join(d, e)));
      })(dir);
      for (const f of files) assert.ok(!/@readyvibe\//.test(readFileSync(f, "utf8")), `${f} refers to a ReadyVibe package`);
    }

    // Run installed helpers from the installed location: no repository, no ReadyVibe package.
    const site = join(root, "fixtures", "leaky-site");
    const seo = await run(process.execPath, [join(project, ".claude", "skills", "seo-readiness", "scripts", "inspect-metadata.mjs"), "--dir", site, "--json"], { cwd: project });
    assert.ok(JSON.parse(seo.stdout).findings.some((f) => f.code === "CANONICAL_LOCALHOST"));
    const links = await run(process.execPath, [join(project, ".claude", "skills", "link-integrity", "scripts", "check-links.mjs"), "--dir", site, "--json"], { cwd: project });
    assert.ok(JSON.parse(links.stdout).findings.some((f) => f.code === "LINK_BROKEN"));
  });
});
