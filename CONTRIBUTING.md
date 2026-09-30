# Contributing

ReadyVibe-Skills is a public repository of installable coding-agent skills. **The skills are the product.** Read [`docs/current-model.md`](docs/current-model.md) first.

## Improving a skill

- A skill lives at `skills/<category>/<name>/SKILL.md`. Write operating method, not a checklist: **Activate when · Inspect · Evidence that counts · May change · Must not claim · Verify · Escalate · No change is valid when.** Bundles route instead of inspecting.
- Use the evidence labels OBSERVED / SOURCE-INDICATED / DECLARED / INFERRED / UNKNOWN / REVIEW REQUIRED. Unknown is never a pass and never a failure. Do not report suspicion as fact.
- **Quote the `description` value in YAML.** An unquoted `: ` inside it makes the frontmatter invalid and an installer may silently skip the skill.
- A skill must work by itself after `npx skills add`. It must never require a ReadyVibe CLI, engine, runtime, account, service, or npm package, **or another ReadyVibe skill**. Mentioning another skill only for escalation, referral, documentation, or optional follow-up is fine and is not a dependency. If your skill may need another skill's method to do its own promised work (including a bundle's routed lanes, which are companions because the bundle promises to run them when they apply), declare it in `metadata.companions`, add a *Working alone* section, and make sure the companion has a minimum-method entry in `docs/references/companion-methods.md`. `pnpm sync` then generates the skill's pruned `references/companion-methods.md`; do not edit it by hand.
- A skill that creates or changes visible UI must first inspect the project's existing design system (`design-system-reconnaissance`). Never impose a ReadyVibe look.
- **No legal rules from memory.** Legal-sensitive skills send the agent to official sources at run time (`docs/references/official-sources.md`), to cite what it read and mark applicability REVIEW REQUIRED.
- Every launch check and compliance domain needs an owning skill in `skills/core/launch-all/references/launch-model.md` or `skills/core/compliance-all/references/compliance-domains.md`; the lint checks this.

## Helpers and shared references

A helper is a small zero-dependency script in `scripts/` that makes a specific skill better. Skills declare what they need in `metadata.helpers` (and shared docs in `metadata.references`). Installs copy only a skill's own folder, so run `pnpm sync` to vendor the canonical files into each skill. **Edit the canonical file, never a vendored copy.**

Do not add an engine, CLI, SDK, plugin framework, backend, database, or package. If a small script and a `SKILL.md` can do it, that is the design.

## Tests

Helper tests use static fixtures, local servers, and a local headless browser only. **Do not call any model** (no Claude, Codex, OpenAI, Gemini, or Grok) from tests or helpers. Behavior of a real agent following a skill is out of scope for these checks.

```bash
pnpm install
pnpm check      # vendored files in sync, skill lint, helper + lint + installability tests
```

Installability and browser tests are skipped on a laptop if npm access or Chromium is unavailable, but **fail in CI** (`CI=true`): the distribution mechanism must always be tested.

Add `Signed-off-by:` to commits (Developer Certificate of Origin).
