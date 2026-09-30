// Tests for tools/lint-skills.mjs: the lint must fail on the problems it exists to catch.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { lintRepository } from "../tools/lint-skills.mjs";
import { buildCompanionFile, parseCompanionLibrary } from "../tools/lib/companions.mjs";

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

// --- companion helpers: a library with a fallback entry per name, and a skill that declares companions ---
const LIB_INTRO = "# Companion methods\n\nIntro.";
function withLibrary(root, names) {
  mkdirSync(join(root, "docs", "references"), { recursive: true });
  writeFileSync(join(root, "docs", "references", "companion-methods.md"), `${LIB_INTRO}\n\n## All\n\n${names.map((n) => `### ${n}\nMinimum method for ${n}.`).join("\n\n")}\n`);
}
/** A skill declaring companions, with the Working alone section and the correctly generated pruned file. */
function dressed(root, name, companions, category = "core", extra = "", extraMeta = "") {
  const lib = parseCompanionLibrary(readFileSync(join(root, "docs", "references", "companion-methods.md"), "utf8"));
  const working = `## Working alone\n\nOptional companions.\n\nCompanions: ${companions.map((c) => `\`${c}\``).join(", ")}.`;
  const body = full(extra).replace("## Inspect", `${working}\n\n## Inspect`);
  const dir = skill(root, name, `${specialist(name)}${extraMeta}\n  companions: "${companions.join(",")}"`, body, category);
  mkdirSync(join(dir, "references"), { recursive: true });
  writeFileSync(join(dir, "references", "companion-methods.md"), buildCompanionFile(lib, companions));
  return dir;
}

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

  test("a skill that changes visible UI must inspect the existing design system first, and declare it as a companion", () => {
    const root = repo();
    skill(root, "error-pages", specialist("error-pages"), full(), "quality");
    assert.ok(codes(root).includes("SKILL_DESIGN_FIRST"));
    const mentionOnly = repo();
    skill(mentionOnly, "error-pages", specialist("error-pages"), full("Run design-system-reconnaissance first."), "quality");
    assert.ok(codes(mentionOnly).includes("SKILL_DESIGN_FIRST"), "a mention alone is not a declared companion");
    const fixed = repo();
    withLibrary(fixed, ["design-system-reconnaissance"]);
    skill(fixed, "design-system-reconnaissance", specialist("design-system-reconnaissance"), full());
    dressed(fixed, "error-pages", ["design-system-reconnaissance"], "quality", "Run design-system-reconnaissance first.");
    assert.ok(!codes(fixed).includes("SKILL_DESIGN_FIRST"), codes(fixed).join(","));
  });

  test("legal-sensitive skills must declare and use the official-sources reference, vendored and identical", () => {
    const root = repo();
    skill(root, "privacy-policy", specialist("privacy-policy"), full("Run design-system-reconnaissance first."), "compliance");
    assert.ok(codes(root).includes("SKILL_LEGAL_SOURCES"));

    const good = repo();
    withLibrary(good, ["design-system-reconnaissance"]);
    writeFileSync(join(good, "docs", "references", "official-sources.md"), "# sources\n");
    skill(good, "design-system-reconnaissance", specialist("design-system-reconnaissance"), full());
    const dir = dressed(good, "privacy-policy", ["design-system-reconnaissance"], "compliance", "Run design-system-reconnaissance. Look up the current text at an official source.", '\n  references: "official-sources"');
    assert.ok(codes(good).includes("SKILL_REFERENCE_MISSING"));
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

describe("companions are declared, not detected", () => {
  test("mentioning another skill for routing, escalation, or reference is not a dependency", () => {
    const root = repo();
    withLibrary(root, ["other-skill"]);
    skill(root, "other-skill", specialist("other-skill"), full());
    skill(root, "mentions-only", specialist("mentions-only"), full("Hand off to `other-skill` if the site has accounts. See also `other-skill`."));
    assert.deepEqual(lintRepository(root), []);
  });

  test("a declared companion must exist, have a fallback entry, and not be the skill itself or a duplicate", () => {
    const missingSkill = repo();
    withLibrary(missingSkill, ["ghost-skill"]);
    dressed(missingSkill, "needs-ghost", ["ghost-skill"]);
    assert.ok(codes(missingSkill).includes("SKILL_COMPANIONS"), "a companion that is not a skill");

    const noFallback = repo();
    withLibrary(noFallback, ["something-else"]);
    skill(noFallback, "helper-skill", specialist("helper-skill"), full());
    const dir = skill(noFallback, "needs-helper", `${specialist("needs-helper")}\n  companions: "helper-skill"`, full().replace("## Inspect", "## Working alone\n\nCompanions: `helper-skill`.\n\n## Inspect"));
    mkdirSync(join(dir, "references"), { recursive: true });
    writeFileSync(join(dir, "references", "companion-methods.md"), "x");
    assert.ok(codes(noFallback).includes("SKILL_COMPANION_FALLBACK"));

    const self = repo();
    withLibrary(self, ["me"]);
    dressed(self, "me", ["me"]);
    assert.ok(codes(self).includes("SKILL_COMPANIONS"), "cannot be its own companion");
  });

  test("the vendored companion-methods.md is generated and pruned to exactly the declared companions", () => {
    const root = repo();
    withLibrary(root, ["alpha", "beta", "gamma"]);
    for (const n of ["alpha", "beta", "gamma"]) skill(root, n, specialist(n), full());
    const dir = dressed(root, "uses-alpha", ["alpha"]);
    assert.deepEqual(lintRepository(root), []);
    const generated = readFileSync(join(dir, "references", "companion-methods.md"), "utf8");
    assert.ok(generated.includes("### alpha") && !generated.includes("### beta") && !generated.includes("### gamma"), "only the declared entry");

    writeFileSync(join(dir, "references", "companion-methods.md"), `${LIB_INTRO}\n\n### alpha\nMinimum method for alpha.\n\n### beta\nMinimum method for beta.\n`);
    assert.ok(codes(root).includes("SKILL_COMPANION_FILE"), "an unpruned or hand-edited file is rejected");
    writeFileSync(join(dir, "references", "companion-methods.md"), generated);
    assert.deepEqual(lintRepository(root), []);
  });

  test("a skill with no companions must not carry a companion-methods.md, and must not list it as a reference", () => {
    const extra = repo();
    withLibrary(extra, ["alpha"]);
    skill(extra, "alpha", specialist("alpha"), full());
    const dir = skill(extra, "solo", specialist("solo"), full());
    mkdirSync(join(dir, "references"), { recursive: true });
    writeFileSync(join(dir, "references", "companion-methods.md"), "stale");
    assert.ok(codes(extra).includes("SKILL_COMPANION_FILE"));

    const listed = repo();
    withLibrary(listed, ["alpha"]);
    skill(listed, "alpha", specialist("alpha"), full());
    skill(listed, "lists-it", `${specialist("lists-it")}\n  references: "companion-methods"`, full());
    assert.ok(codes(listed).includes("SKILL_COMPANIONS"));
  });

  test("a skill with companions must have a Working alone section that lists each one", () => {
    const root = repo();
    withLibrary(root, ["alpha", "beta"]);
    for (const n of ["alpha", "beta"]) skill(root, n, specialist(n), full());
    const dir = dressed(root, "uses-two", ["alpha", "beta"]);
    assert.deepEqual(lintRepository(root), []);
    const p = join(dir, "SKILL.md");
    writeFileSync(p, readFileSync(p, "utf8").replace("`beta`", "beta"));
    assert.ok(codes(root).includes("SKILL_COMPANIONS"), "beta is no longer listed in Working alone");
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
