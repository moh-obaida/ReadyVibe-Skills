# Skill layout contract

A public skill is a directory `skills/<category>/<name>/` containing `SKILL.md`, and optionally `references/` (linked from the body) and `scripts/` (vendored helpers).

- The directory name and frontmatter `name` are identical.
- `name` is 1–64 characters: lowercase letters, digits, single hyphens.
- `description` is a quoted YAML string of at most 1024 characters that includes `Use when` and `Do not use`. An unquoted `: ` inside it makes the frontmatter invalid.
- `metadata.kind` is `specialist`, `foundation`, `auditor`, or `bundle`. Non-bundles carry the sections *Activate when, Inspect, Evidence that counts, May change, Must not claim, Verify, Escalate, No change is valid when*. Bundles carry *Activate when, Route or Flow, Evidence discipline, May change, Must not claim, Verify, Escalate, No change is valid when*.
- `metadata.launch-checks` and `metadata.compliance-domains` list the numbers a skill owns (`"9,10"` or `"27-32"`). The 40-check and 12-domain models must be fully owned.
- `metadata.helpers` lists the `scripts/*.mjs` helpers a skill runs. Installs copy only the skill's own folder, so `scripts/sync-skill-assets.mjs` vendors each declared helper (and its `lib/` imports) into the skill's `scripts/`. The lint fails on missing, stale, or extra copies.
- Skills must not depend on `npx @readyvibe/...` or any ReadyVibe package.
- `metadata.internal` is the YAML boolean `true`, never the string `"true"`.
- No `SKILL.md` may exist outside `skills/<category>/<name>/`.
- Agent skill directories (`.claude/skills/`, `.agents/skills/`, `.cursor/skills/`) are forbidden in this repository.
- Test fixtures use `SKILL.md.fixture`, never `SKILL.md`.
