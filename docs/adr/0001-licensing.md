# ADR 0001 — Licensing

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-09-28 |
| Decided by | Repository owner |
| Affects | §54.1, §54.3, §9.5, §33, `LICENSE`, `LICENSES/`, `NOTICE`, `skill-lint` |

## Context

The repository is public and mixes four kinds of material:

1. Project-authored engineering material: the engine, skill instructions, schemas, adapters, tests, rule files, and documentation.
2. Project-authored content intended to flow into users' projects: policy clause libraries, page and copy templates, and catalog-style data (the vendor catalog and residue catalog).
3. Authoritative third-party material: statutes, regulations, regulator guidance, and standards (for example WCAG, OWASP ASVS, PCI DSS). Their licenses vary, and some are restrictive or share-alike.
4. Outputs generated inside users' projects.

Users must be able to publish generated policies and pages without attribution obligations. The engine needs an explicit patent grant. ReadyVibe must never appear to relicense authoritative material.

## Decision

| Material | License |
| --- | --- |
| `@readyvibe/cli` and all `packages/`, skill instructions (`SKILL.md`, `contract.yaml`, `references/`), schemas, framework, hosting, and data adapters, tests, fixtures, `tools/`, `rules/` (project-authored controls, obligation paraphrases, metadata), and documentation | **Apache-2.0** |
| Original reusable templates and catalog-style data intended to flow into users' projects: `skills/**/assets/clauses/**`, `skills/**/assets/templates/**`, `vendor-catalog/**` | **CC0-1.0** |
| Outputs generated in users' projects | No rights claimed by ReadyVibe |
| Authoritative third-party material | **Not relicensed. Not stored in bulk.** Referenced externally (below). |

**Authoritative material stays external.** Statutes, regulations, regulator guidance, and standards are represented by:

- citations and stable identifiers (instrument id, article, section, or paragraph pinpoint; standard requirement id);
- official URLs;
- **source snapshots** that record hashes of normalized provision text plus version metadata, never the text itself (ADR 0003);
- short excerpts only where necessary to explain an obligation. These appear only in Apache-licensed rule files, carry attribution, are marked as third-party excerpts, and are excluded from the project's license grant by `NOTICE`.

Specific consequences:

- CC0 directories contain **no** excerpts of authoritative material. `skill-lint` rejects excerpt markers, quotation blocks attributed to authorities, and authority ids inside CC0 paths.
- Standards with restrictive or share-alike terms are referenced by identifier only (for example an ASVS requirement id, a WCAG success-criterion number and short title, a PCI DSS requirement number). Their text is not copied.
- The clause library is original prose. It describes what the product does. It does not reproduce statutory wording.
- Contributors certify origin through DCO sign-off. No CLA is required. Apache-2.0 Section 5 governs inbound contributions.

## Consequences

- `LICENSE` (Apache-2.0), `LICENSES/CC0-1.0.txt`, and a `NOTICE` that lists CC0 paths and states that third-party excerpts are not licensed by the project.
- `skill-lint` gains license-path rules (Phase 0).
- The rule and source provenance contract (ADR 0003) must work without storing source text.

## Alternatives considered

- **MIT for everything:** simpler, but it has no explicit patent grant, and it would impose attribution on generated policy text.
- **CC-BY-4.0 for templates:** would force attribution notices into users' published privacy policies. Rejected.
- **Storing full source texts for convenience:** creates licensing ambiguity and repository bloat, and implies ReadyVibe is a legal database. Rejected in favor of hashes and citations.
