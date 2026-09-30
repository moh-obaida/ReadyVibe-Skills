# Skill layout contract

Enforced by `tools/lint-skills.mjs`. A public skill is a directory `skills/<category>/<name>/` containing `SKILL.md`, and optionally `references/` and `scripts/`.

- **Category** is one of `core`, `compliance`, `accessibility`, `discoverability`, `quality`, `security`, `admin`, `internationalization`, `commerce`.
- **Name.** The directory name and frontmatter `name` are identical: 1–64 characters, lowercase letters, digits, single hyphens.
- **Description** is a quoted YAML string of at most 1024 characters that includes `Use when` and `Do not use`. An unquoted `: ` inside it makes the frontmatter invalid YAML, and an installer can silently skip the skill.
- **Kind.** `metadata.kind` is `specialist`, `foundation`, `auditor`, or `bundle`. Non-bundles carry the sections *Activate when, Inspect, Evidence that counts, May change, Must not claim, Verify, Escalate, No change is valid when*. Bundles carry *Activate when, Route or Flow, Evidence discipline, May change, Must not claim, Verify, Escalate, No change is valid when*.
- **Evidence section** uses the labels OBSERVED and SOURCE-INDICATED (and UNKNOWN) and says UNKNOWN is never a pass and never a failure.
- **Ownership.** `metadata.launch-checks` and `metadata.compliance-domains` list the numbers a skill owns (`"9,10"` or `"27-32"`). The 40-check and 12-domain models must be fully owned.
- **Helpers.** `metadata.helpers` lists the `scripts/*.mjs` helpers a skill runs. Canonical copies live in the repository's `scripts/`; `tools/sync-skills.mjs` vendors each declared helper (and the `lib/` files it imports) into the skill's own `scripts/`.
- **References.** `metadata.references` lists shared docs from `docs/references/` (for example `official-sources`), vendored the same way into the skill's `references/`.
- **Self-contained.** A skill must not depend on any ReadyVibe CLI, engine, runtime, account, service, or npm package.
- **Design first.** Skills that create or change visible UI must mention `design-system-reconnaissance`. Legal-sensitive skills must declare `official-sources` and tell the agent to consult current official sources at run time.
- `metadata.internal` is the YAML boolean `true`, never the string `"true"`.
- No `SKILL.md` outside `skills/<category>/<name>/`. No agent skill directories (`.claude/skills/`, `.agents/skills/`, `.cursor/skills/`) in this repository. Test fixtures use `SKILL.md.fixture`.
