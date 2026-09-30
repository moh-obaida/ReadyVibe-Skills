# ADR 0005 — Package boundaries

| Field | Value |
| --- | --- |
| Status | Accepted; publishing the packages is superseded by [ADR 0006](0006-skills-first-distribution.md) |
| Date | 2026-09-29 |
| Decided by | Implementation (architecture left module packaging open once responsibilities were fixed) |

## Context

§33 lists `static`, `probes`, `report`, and `adapters` as packages beside `@readyvibe/engine`. Those modules share types, the evidence store, and release cadence. Publishing them separately would force lockstep versions without an independent consumer.

## Decision

Publish three packages:

- `@readyvibe/schemas` — JSON Schema, runtime validation, artifact envelope, canonical hashing.
- `@readyvibe/engine` — reconnaissance, probes, rule evaluation, adapters, reporting, and diff, exposed as subpath exports (`@readyvibe/engine/probes`, `/report`, `/adapters`).
- `@readyvibe/cli` — the `readyvibe` binary.

`tools/skill-lint` stays a private workspace tool. It is not published.

Repository directories `rules/`, `vendor-catalog/`, `skills/`, `fixtures/`, and `contract/` stay at the repo root, as §33 requires.
