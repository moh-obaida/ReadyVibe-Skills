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
  writeFileSync(join(dir, "contract.yaml"), `name: ${name}\nkind: SPECIALIST\n`);
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
});
