import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lintRepository } from "./lint.js";

function repo(): string {
  return mkdtempSync(join(tmpdir(), "skill-lint-"));
}

function skill(root: string, name: string, frontmatter: string, body = "# Skill\n\nDo the thing.\n") {
  const dir = join(root, "skills", "core", name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), `---\n${frontmatter}\n---\n${body}`);
}

describe("skill-lint", () => {
  it("accepts a boolean internal flag", () => {
    const root = repo();
    skill(
      root,
      "readyvibe-install-canary",
      "name: readyvibe-install-canary\ndescription: Internal fixture. Use when testing install. Do not use for production.\nmetadata:\n  internal: true\n",
    );
    expect(lintRepository(root)).toEqual([]);
  });

  it("rejects a string internal flag", () => {
    const root = repo();
    skill(
      root,
      "readyvibe-install-canary",
      'name: readyvibe-install-canary\ndescription: Internal fixture. Use when testing install. Do not use for production.\nmetadata:\n  internal: "true"\n',
    );
    expect(lintRepository(root).map((i) => i.code)).toContain("SKILL_INTERNAL_TYPE");
  });

  it("rejects a shallow SKILL.md", () => {
    const root = repo();
    mkdirSync(join(root, "skills", "core"), { recursive: true });
    writeFileSync(join(root, "skills", "core", "SKILL.md"), "---\nname: core\ndescription: Use when x. Do not use y.\n---\n");
    expect(lintRepository(root).map((i) => i.code)).toContain("SKILL_LAYOUT");
  });

  it("rejects an agent skill directory", () => {
    const root = repo();
    mkdirSync(join(root, ".claude", "skills"), { recursive: true });
    writeFileSync(join(root, ".claude", "skills", "note.txt"), "nope");
    expect(lintRepository(root).map((i) => i.code)).toContain("SKILL_AGENT_DIR");
  });

  it("rejects an authored review state", () => {
    const root = repo();
    const file = join(root, "rules", "packs", "example", "obligations", "one.yaml");
    mkdirSync(join(root, "rules", "packs", "example", "obligations"), { recursive: true });
    writeFileSync(file, "id: EX.ONE\nstatus: REVIEWED\ntemporal:\n  effectiveFrom: null\n");
    expect(lintRepository(root).map((i) => i.code)).toContain("OBLIGATION_AUTHORED_STATE");
  });

  it("ignores SKILL.md.fixture", () => {
    const root = repo();
    mkdirSync(join(root, "tools", "installability"), { recursive: true });
    writeFileSync(join(root, "tools", "installability", "SKILL.md.fixture"), "---\nname: bad\n---\n");
    expect(lintRepository(root)).toEqual([]);
  });

  describe("skill quality", () => {
    const desc = "description: Use when testing. Do not use otherwise.";
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
    const codes = (root: string) => lintRepository(root).map((i) => i.code);

    it("accepts a complete specialist", () => {
      const root = repo();
      skill(root, "good-one", `name: good-one\n${desc}\nmetadata:\n  kind: specialist`, full());
      expect(lintRepository(root)).toEqual([]);
    });

    it("requires a kind on public skills", () => {
      const root = repo();
      skill(root, "no-kind", `name: no-kind\n${desc}`, full());
      expect(codes(root)).toContain("SKILL_KIND");
    });

    it("rejects a skill that is only a description and a template", () => {
      const root = repo();
      skill(root, "thin", `name: thin\n${desc}\nmetadata:\n  kind: specialist`, "# thin\n\nDo the thing.\n");
      expect(codes(root)).toContain("SKILL_SECTION_MISSING");
    });

    it("requires the evidence vocabulary and the unknown-is-not-pass rule", () => {
      const root = repo();
      skill(root, "loose", `name: loose\n${desc}\nmetadata:\n  kind: specialist`, full().replace("SOURCE-INDICATED", "MAYBE").replace("never a pass and never a failure", "fine"));
      expect(codes(root)).toContain("SKILL_EVIDENCE_LANGUAGE");
    });

    it("forbids depending on the ReadyVibe CLI or npm packages", () => {
      const root = repo();
      skill(root, "cli-dep", `name: cli-dep\n${desc}\nmetadata:\n  kind: specialist`, full("Run `npx @readyvibe/cli doctor` first."));
      expect(codes(root)).toContain("SKILL_ENGINE_DEPENDENCY");
    });

    it("rejects descriptions that are invalid YAML (an unquoted colon)", () => {
      const root = repo();
      skill(root, "colon", "name: colon\ndescription: Use when a thing: happens. Do not use otherwise.\nmetadata:\n  kind: specialist", full());
      expect(codes(root).length).toBeGreaterThan(0);
    });

    it("requires helpers a skill runs to be declared, present, and identical to the canonical script", () => {
      const root = repo();
      mkdirSync(join(root, "scripts"), { recursive: true });
      writeFileSync(join(root, "scripts", "check-links.mjs"), "export const v = 1;\n");
      skill(root, "helper", `name: helper\n${desc}\nmetadata:\n  kind: specialist`, full("Run `node scripts/check-links.mjs`."));
      expect(codes(root)).toContain("SKILL_HELPER_UNDECLARED");

      const declared = repo();
      mkdirSync(join(declared, "scripts"), { recursive: true });
      writeFileSync(join(declared, "scripts", "check-links.mjs"), "export const v = 1;\n");
      skill(declared, "helper", `name: helper\n${desc}\nmetadata:\n  kind: specialist\n  helpers: "check-links"`, full("Run `node scripts/check-links.mjs`."));
      expect(codes(declared)).toContain("SKILL_HELPER_MISSING");

      mkdirSync(join(declared, "skills", "core", "helper", "scripts"), { recursive: true });
      writeFileSync(join(declared, "skills", "core", "helper", "scripts", "check-links.mjs"), "export const v = 2;\n");
      expect(codes(declared)).toContain("SKILL_HELPER_STALE");

      writeFileSync(join(declared, "skills", "core", "helper", "scripts", "check-links.mjs"), "export const v = 1;\n");
      expect(lintRepository(declared)).toEqual([]);
    });

    it("flags references to skills that do not exist", () => {
      const root = repo();
      skill(root, "refs", `name: refs\n${desc}\nmetadata:\n  kind: specialist`, full("Hand off to `launch-readiness`."));
      expect(codes(root)).toContain("SKILL_UNKNOWN_REFERENCE");
    });

    it("requires the launch model to be complete and every owner to be a skill that claims the check", () => {
      const root = repo();
      skill(root, "owner-a", `name: owner-a\n${desc}\nmetadata:\n  kind: specialist\n  launch-checks: "1"`, full());
      const refs = join(root, "skills", "bundles", "launch-all", "references");
      mkdirSync(refs, { recursive: true });
      writeFileSync(join(refs, "launch-model.md"), "| 1 | A | q | owner-a | | n/a |\n| 2 | B | q | ghost-skill | | n/a |\n");
      const found = codes(root);
      expect(found).toContain("MODEL_OWNER");
      expect(found).toContain("MODEL_INCOMPLETE");
    });
  });
});
