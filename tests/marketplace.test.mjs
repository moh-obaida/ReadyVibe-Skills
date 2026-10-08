import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildMarketplace } from "../tools/lib/marketplace.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "rv-marketplace-test-"));
  writeFileSync(join(root, "LICENSE"), "Apache-2.0 test license\n");
  writeFileSync(join(root, "NOTICE"), "ReadyVibe test notice\n");
  for (const [name, hidden] of [["visible-audit", false], ["internal-audit", true]]) {
    const dir = join(root, "skills", "quality", name);
    mkdirSync(join(dir, "references"), { recursive: true });
    mkdirSync(join(dir, "scripts"), { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), [
      "---",
      "name: " + name,
      "description: \"Use when checking pages. Do not use when irrelevant.\"",
      "metadata:",
      "  internal: " + hidden,
      "---",
      "# " + name,
      "",
      "A complete test instruction."
    ].join("\n") + "\n");
    writeFileSync(join(dir, "references", "guide.md"), "local reference\n");
    writeFileSync(join(dir, "scripts", "helper.mjs"), "console.log('local helper')\n");
  }
  return root;
}

test("packages exactly one public skill per ZIP with standalone resources", async () => {
  const root = fixture();
  try {
    const outDir = join(root, "dist", "agensi");
    const manifest = await buildMarketplace({ root, outDir });
    assert.deepEqual(manifest.map(x => x.name), ["visible-audit"]);
    assert.ok(existsSync(join(outDir, "visible-audit.zip")));
    assert.ok(!existsSync(join(outDir, "internal-audit.zip")));
    const members = execFileSync("unzip", ["-Z", "-1", join(outDir, "visible-audit.zip")], { encoding: "utf8" }).trim().split("\n");
    for (const path of ["visible-audit/SKILL.md", "visible-audit/references/guide.md",
      "visible-audit/scripts/helper.mjs", "visible-audit/LICENSE", "visible-audit/NOTICE", "visible-audit/README.md"]) {
      assert.ok(members.includes(path), "archive is missing " + path);
    }
    assert.ok(members.every(x => x.startsWith("visible-audit/")));
    assert.ok(readFileSync(join(outDir, "listings", "visible-audit.md"), "utf8").includes("Real demo output"));
    assert.equal(JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf8")).length, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check mode validates packages without leaving a distribution directory", async () => {
  const root = fixture();
  try {
    assert.equal((await buildMarketplace({ root, check: true, only: "visible-audit" })).length, 1);
    assert.ok(!existsSync(join(root, "dist")));
    await assert.rejects(() => buildMarketplace({ root, check: true, only: "internal-audit" }), /No public skill/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects symlinks inside a marketplace skill", async () => {
  const root = fixture();
  try {
    symlinkSync(join(root, "LICENSE"), join(root, "skills", "quality", "visible-audit", "references", "unsafe.txt"));
    await assert.rejects(() => buildMarketplace({ root, check: true, only: "visible-audit" }), /Symlink not allowed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
