# Contributing

ReadyVibe is a collection of installable coding-agent skills. Improve the skills first; supporting code exists only to make a skill more trustworthy. Read [ADR 0006](docs/adr/0006-skills-first-distribution.md).

## Working on a skill

- A skill lives at `skills/<category>/<name>/SKILL.md`. `name` matches its directory, `description` says when to use it and when not to, and `metadata.kind` is `specialist`, `foundation`, `auditor`, or `bundle`.
- Write operating method, not a checklist: **Activate when · Inspect · Evidence that counts · May change · Must not claim · Verify · Escalate · No change is valid when**. Bundles route instead of inspecting. `pnpm skill-lint` enforces the sections and the evidence vocabulary (OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED; unknown is never a pass or a failure).
- Quote the `description` value in YAML. An unquoted `: ` inside it makes the frontmatter invalid and the skill can silently disappear from installs.
- Skills must not require `npx @readyvibe/...` or any ReadyVibe package. If a skill needs a deterministic capability, add or extend a helper in `scripts/`, declare it in the skill's `metadata.helpers`, and run `pnpm sync-skills`. Installs copy only the skill's own folder, so the vendored copy is what users get.
- Do not add legal rules from memory. Jurisdiction-specific obligations need an official source record and a review state that is computed, not authored.
- Every launch check and compliance domain must have an owning skill in `skills/bundles/launch-all/references/launch-model.md` or `skills/bundles/compliance-all/references/compliance-domains.md`; the lint checks this.

## Working on a helper

Helpers in `scripts/` are zero-dependency Node scripts with tests in `scripts/test/` that use static fixtures, local servers, and a local headless browser only. **Do not call any model** (no Claude, Codex, OpenAI, Gemini, or Grok) from tests or helpers.

## Before opening a pull request

```bash
pnpm install
pnpm check      # vendored helpers in sync, skill lint, all tests
```

Add `Signed-off-by:` to commits (Developer Certificate of Origin). Do not put statutes or standards text in CC0 paths. Do not set a review state on an obligation.
