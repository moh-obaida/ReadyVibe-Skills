# ADR 0002 — npm Scope

| Field | Value |
| --- | --- |
| Status | Accepted — **RESERVED** (2026-09-29) |
| Date | 2026-09-28 |
| Decided by | Repository owner |
| Affects | §33, §53.1, all `SKILL.md` engine invocations, package names |

## Context

Skills invoke the deterministic engine with `npx`. Package names appear in every `SKILL.md`, in CI examples, and in reports. Changing them after publication would break installed skills.

A search found no indexed npm package using the `@readyvibe` scope. That does **not** prove the scope can be reserved: npm organization availability could not be confirmed without an authenticated check.

## Decision

- The npm scope is **`@readyvibe`**. Scoped packages use the `@org/package-name` form, for example `@readyvibe/cli`, `@readyvibe/schemas`, `@readyvibe/engine`.
- **Reservation confirmed.** On 2026-09-29 the repository owner reserved the npm organization `@readyvibe` on the account that owns it. Packages may use `@readyvibe/*`.
- `tools/skill-lint` config sets `engine.scopeReserved: true` and `engine.package: "@readyvibe/cli"`. Publishing still requires the release workflow. Do not publish from a local machine.

## If reservation fails

The fallback order is `@readyvibe-dev`, then an unscoped `readyvibe-cli`. The change is made in one place (`tools/skill-lint/config.yaml` `engine.package`), and the contract vendoring step regenerates every skill's engine invocation from it. This ADR is then superseded by a new ADR recording the final name.

## Consequences

- Engine invocations in skills are generated from a single configured package name, never hand-typed.
- Publishing uses CI with provenance attestations only (§40.7). Local publishing is disabled by organization policy.
