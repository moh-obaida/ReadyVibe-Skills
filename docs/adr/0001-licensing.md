# ADR 0001: Licensing

Status: accepted (2026-09-28), restated for the current model (2026-09-30)

## Decision

| Material | License |
| --- | --- |
| Skills (`SKILL.md`, `references/`), helper scripts, tools, tests, fixtures, and documentation | **Apache-2.0** (explicit patent grant) |
| Original reusable templates or clause text, if any are added under `skills/**/assets/templates/**` or `skills/**/assets/clauses/**`, so users can publish generated pages without attribution | **CC0-1.0** (`LICENSES/CC0-1.0.txt`) |
| Outputs a skill generates inside a user's project | No rights claimed by ReadyVibe |
| Statutes, regulations, regulator guidance, and standards | **Not relicensed and not stored.** Skills point to official sources and the running agent reads the current text there (`docs/references/official-sources.md`) |

## Consequences

- CC0 paths must contain no excerpts of authoritative material.
- Nothing is published to npm, so there is no package license to manage (see ADR 0002).
