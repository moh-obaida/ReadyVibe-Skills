# ADR 0001: Licensing

Status: accepted (2026-09-28), simplified for v1.0.0 (2026-09-30)

## Decision

**Everything in this repository is Apache-2.0** (`LICENSE`): the skills (`SKILL.md`, `references/`), helper scripts, tools, tests, fixtures, and documentation. Apache-2.0 gives users an explicit patent grant and lets them use and adapt the skills freely.

| Material | License |
| --- | --- |
| Skills, helpers, tools, tests, fixtures, docs | Apache-2.0 |
| Content a skill generates inside a user's project | No rights claimed by ReadyVibe |
| Statutes, regulations, regulator guidance, standards | Not copied, not stored, not relicensed. Skills cite official sources and the running agent reads the current text there (`docs/references/official-sources.md`) |

## Consequences

- No separate license applies to any part of the repository. (An earlier plan for CC0 templates was dropped because no such templates exist.)
- Nothing is published to npm, so there is no package license to manage (see ADR 0002).
- Skills must not embed quoted statutory or standards text beyond a short excerpt needed to explain a point.
