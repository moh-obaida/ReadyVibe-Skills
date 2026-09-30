// Tests for tools/lint-skills.mjs: the lint must fail on the problems it exists to catch.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { lintRepository } from "../tools/lint-skills.mjs";

const repo = () => mkdtempSync(join(tmpdir(), "skill-lint-"));
const codes = (root) => lintRepository(root).map((i) => i.code);
const desc = 'description: "Use when testing. Do not use otherwise."';

function skill(root, name, frontmatter, body = "# Skill\n\nDo the thing.\n", category = "core") {
  const dir = join(root, "skills", category, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), `---\n${frontmatter}\n---\n${body}`);
  return dir;
}
const full = (extra = "") =>
  [
    "# Skill",
    "## Activate when\nx",
    "## Inspect\nx",
    "## Evidence that counts\nLabel OBSERVED, SOURCE-INDICATED, or UNKNOWN. UNKNOWN is never a pass and never a failure.",
    "## May change\nx",
    "## Must not claim\nx",
    "## Verify\nx",
    "## Escalate\nx",
    "## No change is valid when\nx",
    extra,
  ].join("\n\n");
const specialist = (name) => `name: ${name}\n${desc}\nmetadata:\n  kind: specialist`;

describe("structure", () => {
  test("accepts a boolean internal flag and rejects a string one", () => {
    const ok = repo();
    skill(ok, "canary", 'name: canary\ndescription: "Internal. Use when testing install. Do not use in production."\nmetadata:\n  internal: true');
    assert.deepEqual(lintRepository(ok), []);
    const bad = repo();
    skill(bad, "canary", 'name: canary\ndescription: "Internal. Use when testing install. Do not use in production."\nmetadata:\n  internal: "true"');
    assert.ok(codes(bad).includes("SKILL_INTERNAL_TYPE"));
  });

  test("rejects a SKILL.md outside skills/<category>/<name>/", () => {
    const root = repo();
    mkdirSync(join(root, "skills", "core"), { recursive: true });
    writeFileSync(join(root, "skills", "core", "SKILL.md"), '---\nname: core\ndescription: "Use when x. Do not use y."\n---\n');
    assert.ok(codes(root).includes("SKILL_LAYOUT"));
  });

  test("rejects an unknown category", () => {
    const root = repo();
    skill(root, "misfiled", specialist("misfiled"), full(), "bundles");
    assert.ok(codes(root).includes("SKILL_CATEGORY"));
  });

  test("rejects an agent skill directory and ignores SKILL.md.fixture", () => {
    const root = repo();
    mkdirSync(join(root, ".claude", "skills"), { recursive: true });
    writeFileSync(join(root, ".claude", "skills", "note.txt"), "nope");
    mkdirSync(join(root, "tests"), { recursive: true });
    writeFileSync(join(root, "tests", "SKILL.md.fixture"), "---\nname: bad\n---\n");
    assert.deepEqual(codes(root), ["SKILL_AGENT_DIR"]);
  });

  test("rejects descriptions that are invalid YAML (an unquoted colon)", () => {
    const root = repo();
    skill(root, "colon", "name: colon\ndescription: Use when a thing: happens. Do not use otherwise.\nmetadata:\n  kind: specialist", full());
    assert.ok(codes(root).includes("SKILL_FRONTMATTER_YAML"));
  });
});

describe("skill quality", () => {
  test("accepts a complete specialist", () => {
    const root = repo();
    skill(root, "good-one", specialist("good-one"), full());
    assert.deepEqual(lintRepository(root), []);
  });

  test("requires a kind on public skills", () => {
    const root = repo();
    skill(root, "no-kind", `name: no-kind\n${desc}`, full());
    assert.ok(codes(root).includes("SKILL_KIND"));
  });

  test("rejects a skill that is only a description and a template", () => {
    const root = repo();
    skill(root, "thin", specialist("thin"), "# thin\n\nDo the thing.\n");
    assert.ok(codes(root).includes("SKILL_SECTION_MISSING"));
  });

  test("requires the evidence vocabulary and the unknown-is-not-pass rule", () => {
    const root = repo();
    skill(root, "loose", specialist("loose"), full().replace("SOURCE-INDICATED", "MAYBE").replace("never a pass and never a failure", "fine"));
    assert.ok(codes(root).includes("SKILL_EVIDENCE_LANGUAGE"));
  });

  test("forbids depending on any ReadyVibe CLI, engine, runtime, account, or npm package", () => {
    for (const text of ["Run `npx @readyvibe/cli doctor` first.", "Install the ReadyVibe CLI.", "Connect to the ReadyVibe engine."]) {
      const root = repo();
      skill(root, "dep", specialist("dep"), full(text));
      assert.ok(codes(root).includes("SKILL_PLATFORM_DEPENDENCY"), text);
    }
  });

  test("flags references to skills that do not exist", () => {
    const root = repo();
    skill(root, "refs", specialist("refs"), full("Hand off to `launch-readiness`."));
    assert.ok(codes(root).includes("SKILL_UNKNOWN_REFERENCE"));
  });

  test("a skill that changes visible UI must inspect the existing design system first", () => {
    const root = repo();
    skill(root, "error-pages", specialist("error-pages"), full(), "quality");
    assert.ok(codes(root).includes("SKILL_DESIGN_FIRST"));
    const fixed = repo();
    skill(fixed, "error-pages", specialist("error-pages"), full("Run design-system-reconnaissance first."), "quality");
    assert.ok(!codes(fixed).includes("SKILL_DESIGN_FIRST"));
  });

  test("legal-sensitive skills must declare and use the official-sources reference, vendored and identical", () => {
    const root = repo();
    skill(root, "privacy-policy", specialist("privacy-policy"), full("Run design-system-reconnaissance first."), "compliance");
    assert.ok(codes(root).includes("SKILL_LEGAL_SOURCES"));

    const good = repo();
    mkdirSync(join(good, "docs", "references"), { recursive: true });
    writeFileSync(join(good, "docs", "references", "official-sources.md"), "# sources\n");
    const dir = skill(good, "privacy-policy", `${specialist("privacy-policy")}\n  references: "official-sources"`, full("Run design-system-reconnaissance. Look up the current text at an official source."), "compliance");
    assert.ok(codes(good).includes("SKILL_REFERENCE_MISSING"));
    mkdirSync(join(dir, "references"), { recursive: true });
    writeFileSync(join(dir, "references", "official-sources.md"), "# stale\n");
    assert.ok(codes(good).includes("SKILL_REFERENCE_STALE"));
    writeFileSync(join(dir, "references", "official-sources.md"), "# sources\n");
    assert.deepEqual(lintRepository(good), []);
  });

  test("helpers a skill runs must be declared, present, and identical to the canonical script", () => {
    const root = repo();
    mkdirSync(join(root, "scripts"), { recursive: true });
    writeFileSync(join(root, "scripts", "check-links.mjs"), "export const v = 1;\n");
    skill(root, "helper", specialist("helper"), full("Run `node scripts/check-links.mjs`."));
    assert.ok(codes(root).includes("SKILL_HELPER_UNDECLARED"));

    const declared = repo();
    mkdirSync(join(declared, "scripts"), { recursive: true });
    writeFileSync(join(declared, "scripts", "check-links.mjs"), "export const v = 1;\n");
    const dir = skill(declared, "helper", `${specialist("helper")}\n  helpers: "check-links"`, full("Run `node scripts/check-links.mjs`."));
    assert.ok(codes(declared).includes("SKILL_HELPER_MISSING"));
    mkdirSync(join(dir, "scripts"), { recursive: true });
    writeFileSync(join(dir, "scripts", "check-links.mjs"), "export const v = 2;\n");
    assert.ok(codes(declared).includes("SKILL_HELPER_STALE"));
    writeFileSync(join(dir, "scripts", "check-links.mjs"), "export const v = 1;\n");
    assert.deepEqual(lintRepository(declared), []);
  });
});

describe("coverage and platform guards", () => {
  test("the launch model must be complete and every owner must be a skill that claims the check", () => {
    const root = repo();
    skill(root, "owner-a", `name: owner-a\n${desc}\nmetadata:\n  kind: specialist\n  launch-checks: "1"`, full());
    const refs = join(root, "skills", "core", "launch-all", "references");
    mkdirSync(refs, { recursive: true });
    writeFileSync(join(refs, "launch-model.md"), "| 1 | A | q | owner-a | | n/a |\n| 2 | B | q | ghost-skill | | n/a |\n");
    const found = codes(root);
    assert.ok(found.includes("MODEL_OWNER"));
    assert.ok(found.includes("MODEL_INCOMPLETE"));
  });

  test("the repository may not become a package or platform", () => {
    const publishable = repo();
    writeFileSync(join(publishable, "package.json"), JSON.stringify({ name: "readyvibe", bin: { rv: "x.js" }, workspaces: ["packages/*"] }));
    const found = codes(publishable);
    assert.ok(found.filter((c) => c === "PLATFORM_PACKAGE").length >= 3, found.join(","));

    const pkgs = repo();
    mkdirSync(join(pkgs, "packages", "cli"), { recursive: true });
    writeFileSync(join(pkgs, "packages", "cli", "package.json"), JSON.stringify({ name: "@readyvibe/cli" }));
    const foundDirs = codes(pkgs);
    assert.ok(foundDirs.includes("PLATFORM_DIRECTORY"));
    assert.ok(foundDirs.includes("PLATFORM_PACKAGE"));

    const fine = repo();
    writeFileSync(join(fine, "package.json"), JSON.stringify({ name: "readyvibe-skills", private: true, scripts: {} }));
    assert.deepEqual(lintRepository(fine), []);
  });
});
