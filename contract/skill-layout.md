# Skill layout contract

A public skill is a directory `skills/<category>/<name>/` containing `SKILL.md` and `contract.yaml`.

- The directory name, frontmatter `name`, and `contract.yaml` `name` are identical.
- `name` is 1–64 characters: lowercase letters, digits, single hyphens.
- `description` is at most 1024 characters and includes `Use when` and `Do not use`.
- `metadata.internal` is the YAML boolean `true`, never the string `"true"`.
- No `SKILL.md` may exist outside `skills/<category>/<name>/`.
- Agent skill directories (`.claude/skills/`, `.agents/skills/`, `.cursor/skills/`) are forbidden in this repository.
- Test fixtures use `SKILL.md.fixture`, never `SKILL.md`.
