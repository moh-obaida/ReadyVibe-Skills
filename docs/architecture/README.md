# ReadyVibe Launch-Readiness System — Architecture Specification

| Field | Value |
| --- | --- |
| Status | Draft 0.2 — normative for all implementation work |
| Date | 2026-09-28 |
| Decision records | [`docs/adr/`](../adr/) — 0001 licensing · 0002 npm scope · 0003 rule-level legal review lifecycle · 0004 rule-level temporal validity |
| Repository | `moh-obaida/ReadyVibe-Skills` |
| Scope | Public skills repository, deterministic engine, knowledge packs, target-project artifacts |

This specification is the source of truth for the project. A contributor should be able to implement any single specialist skill, framework adapter, hosting adapter, rule pack, or fixture using only this document set, without redesigning the core.

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are used as described in RFC 2119 / RFC 8174.

## How to read this

| If you are... | Read first |
| --- | --- |
| New to the project | §1 Executive architecture, §2 Principles, §3 Boundaries |
| Writing a specialist skill | §10 Skills, §11 Orchestrator, §28 Remediation, §29 Verification, §53 Distribution |
| Writing a rule or jurisdiction pack | §8 Rule engine, §9 Jurisdiction packs, §41 Versioning |
| Writing a framework or hosting adapter | §34, §35, §28 |
| Building a visual skill | §51 Design-system integration, §18 Accessibility |
| Maintaining the repository | §33, §36–§41, §53, §54 |

## Document map

| File | Sections |
| --- | --- |
| [01-foundations.md](01-foundations.md) | 1 Executive architecture · 2 Principles · 3 Boundaries and risk model · 4 Component diagram · 5 End-to-end pipeline |
| [02-reality-model-and-evidence.md](02-reality-model-and-evidence.md) | 6 Website Reality Model · 7 Evidence model |
| [03-rules-and-jurisdictions.md](03-rules-and-jurisdictions.md) | 8 Rule engine · 9 Jurisdiction packs, legal source policy, freshness |
| [04-skills-and-orchestration.md](04-skills-and-orchestration.md) | 10 Specialist skills · 11 Orchestrator |
| [05-privacy-and-compliance.md](05-privacy-and-compliance.md) | 12 Privacy · 13 Consent · 14 Minors and age · 15 Legal documents · 16 Email · 17 Data rights |
| [06-experience-and-discoverability.md](06-experience-and-discoverability.md) | 18 Accessibility · 19 Internationalization · 20 SEO and indexability · 21 Social, metadata, identity · 22 Error and failure surfaces |
| [07-platform-domains.md](07-platform-domains.md) | 23 Security · 24 Performance · 25 Payments and commerce · 26 Third parties · 47 AI features · 48 User-generated content · 49 Choice architecture · 50 Observability and breach readiness |
| [08-design-system-and-admin.md](08-design-system-and-admin.md) | 51 Design-system integration · 52 Admin system |
| [09-core-engines.md](09-core-engines.md) | 27 Contradiction detection · 28 Remediation engine · 29 Verification engine · 30 Reporting |
| [10-configuration-and-schemas.md](10-configuration-and-schemas.md) | 31 Configuration · 32 Schemas |
| [11-repository-adapters-distribution.md](11-repository-adapters-distribution.md) | 33 Repository structure · 34 Framework adapters · 35 Hosting adapters · 53 Public distribution and Skills CLI · 54 Licensing and community |
| [12-quality-and-operations.md](12-quality-and-operations.md) | 36 Testing · 37 Fixtures · 38 CI/CD · 39 Compliance diff · 40 Security of the tool · 41 Versioning |
| [13-delivery-plan.md](13-delivery-plan.md) | 42 Phased plan · 43 MVP · 44 Future extensions · 45 Failure modes · 46 Acceptance criteria |

Sections 47–54 are additions required by the public-repository, admin, and design-system requirements. They are placed next to the topics they relate to rather than at the end.

## Architecture decisions at a glance

Each decision is explained where it is made. This table is an index.

| ID | Decision | Where |
| --- | --- | --- |
| D-01 | Three layers: agent skills (judgment, drafting, remediation), a deterministic engine (instruments, rule evaluation, evidence), and versioned knowledge packs (rules, jurisdictions, vendor catalog). | §1, §4 |
| D-02 | Skills communicate through typed artifacts in the target project's `.readyvibe/` directory, never by calling each other directly. | §5, §11 |
| D-03 | The Reality Model is a store of typed entities plus provenance-carrying facts, organized into "planes" (observed, implemented, configured, declared, owner-asserted, inferred). | §6 |
| D-04 | Absence is a claim: `NOT_APPLICABLE` requires coverage evidence, not just a lack of findings. | §6.5, §8.3 |
| D-05 | Controls (what can be checked) are separate from obligations (why it matters, where). One control finding carries every obligation it maps to. | §8.1 |
| D-06 | Applicability uses three-valued logic. Missing facts produce `UNKNOWN`, never `false`. | §8.4 |
| D-07 | Jurisdictions activate only from confirmed scope. Weak signals create owner questions, not legal conclusions. | §9.2 |
| D-08 | When several packs are active, the default is one behavior that satisfies all of them. Region-differentiated behavior is opt-in. | §9.3 |
| D-09 | LLM output is quote-anchored: every extracted claim must carry a verbatim span that the engine checks mechanically. | §7.7, §8.10 |
| D-10 | Canary personas: synthetic, unique values are typed into the app, and every outbound request is searched for them (raw, encoded, hashed). | §7.6 |
| D-11 | Scheduling is derived from artifact dependencies (produces/consumes), like a build system, and has a global discovery barrier before any mutation. | §11.3 |
| D-12 | Shared files are edited through semantic-key upserts via adapters and recorded in a ledger. Marker comments are used only where no semantic key exists. | §28.4 |
| D-13 | Status (evaluation result) and disposition (human workflow) are separate fields. Legal review is recorded, never suppressed. | §8.3, §32 |
| D-14 | Four launch states (`BLOCKED`, `CONDITIONALLY_READY`, `READY_WITH_REVIEW_ITEMS`, `TECHNICALLY_READY`) with no numeric compliance score. | §30.4 |
| D-15 | Bundles (`launch-all`, `compliance-all`, …) are thin aliases of one orchestrator skill with a profile. No domain instructions are copied. | §10.2, §53.5 |
| D-16 | Frontmatter is minimal routing metadata. The orchestration contract lives in `contract.yaml` next to `SKILL.md`. | §53.7 |
| D-17 | Shared contract text is authored once in `/contract` and vendored into each skill by a build step. CI fails on drift. | §33, §53.9 |
| D-18 | JSON Schema 2020-12 is canonical for all artifacts. TypeScript types are generated from it. | §32 |
| D-19 | SemVer for code, skills, and schemas; CalVer for legal and guidance packs. | §41 |
| D-20 | The engine never executes project scripts or evaluates project config files unless the owner explicitly allows it, and then only under the configured sandbox. | §40 |
| D-21 | Mechanical edits are engine operations. Semantic edits are agent operations. Both go through the same change-set and ledger path. | §28 |
| D-22 | Visual skills must run design-system discovery, a component reuse plan, and token-conformance verification. | §51 |
| D-23 | Admin authorization is capability-based and enforced server-side. The verification matrix is generated from the capability model. | §52 |
| D-24 | Apache-2.0 for the engine, skill instructions, schemas, adapters, tests, and rules; CC0-1.0 for original templates and catalog data that flow into user projects. Authoritative legal and standards material is never relicensed or stored in bulk: it is represented by citations, identifiers, hashes, and short excerpts only. ([ADR 0001](../adr/0001-licensing.md)) | §54, §9.5 |
| D-25 | npm scope `@readyvibe`. Reserving it is the first Phase 0 action, and nothing outside the docs depends on it until confirmed. ([ADR 0002](../adr/0002-npm-scope.md)) | §53.1 |
| D-26 | Legal review state is per obligation and **computed**, from review records, obligation versions, and source-snapshot hashes. It is never authored. A changed source provision makes affected rules `REVIEW_REQUIRED` automatically. Specialist review is mandatory for tagged areas. ([ADR 0003](../adr/0003-legal-review-lifecycle.md)) | §9.10 |
| D-27 | Legal effect is per obligation (and per threshold), not per pack: `publishedAt`, `effectiveFrom`, `complianceFrom`, `effectiveUntil`, `transitionalRules[]`, `basis`, `sourceAsOf`. Runs are evaluated as of a date. ([ADR 0004](../adr/0004-rule-temporal-validity.md)) | §8.12 |
| D-28 | Phase 0 is frozen to six artifacts (schemas, interchange contract, provenance contract, `SKILL.md` layout rules, linter, clean-room installability fixture), proven with one internal canary skill that is retired when the first real specialist lands. | §42 |

## Glossary

| Term | Meaning |
| --- | --- |
| Target project | The website or web application being inspected. It is always untrusted input. |
| Skill | An installable directory under `skills/` containing `SKILL.md` (agent instructions), `contract.yaml` (machine contract), and optional `references/`, `assets/`, `scripts/`. |
| Engine | The deterministic toolchain (`@readyvibe/cli` and its packages) that performs static analysis, runtime probing, rule evaluation, evidence storage, diffing, and reporting. |
| Knowledge pack | Versioned data: rule packs, jurisdiction packs, the vendor catalog, standards mappings. |
| Artifact bus | The `.readyvibe/` directory in the target project, through which all skills and the engine exchange typed artifacts. |
| Reality Model | The sealed, evidence-backed description of what the target project actually is and does, for one commit and one set of environments. |
| Fact | One assertion about one subject (for example "cookie `_ga` is set before consent on `/`"), carrying a plane, provenance, confidence, and evidence references. |
| Plane | Where a fact comes from: `OBSERVED` (runtime), `IMPLEMENTED` (code), `CONFIGURED` (infrastructure or vendor settings), `DECLARED` (what the site tells users), `OWNER_ASSERTED`, `INFERRED`. |
| Evidence | An immutable, redacted, content-addressed record proving a fact, with the probe and environment that produced it. |
| Probe | An engine instrument that gathers evidence (HTTP fetch, browser session, storage capture, keyboard walk, and so on). |
| Detector | Code that turns evidence into facts. |
| Capability | A derived, evidence-backed property of the project (`HAS_ANALYTICS`, `HAS_AUTH`, …) with state `PRESENT`, `ABSENT`, `SUSPECTED`, or `UNKNOWN`. |
| Control | A framework-independent check the system can evaluate (for example "no non-essential network activity before consent"). |
| Obligation | A requirement from a legal, regulatory, standards, or guidance source, contained in a pack and mapped to controls. |
| Finding | The result of evaluating one control in one scope, annotated with its obligations, evidence, remediation, and verification. |
| Status | The evaluation outcome: `PASS`, `FAIL`, `WARNING`, `NOT_APPLICABLE`, `LEGAL_REVIEW_REQUIRED`, `UNKNOWN`. |
| Disposition | The human workflow state of a finding: open, suppressed as a false positive, accepted risk, legally reviewed, deferred, fixed pending verification, verified fixed. |
| Persona | A verification context (first-time visitor, rejected tracking, authenticated user, Arabic RTL, keyboard-only, …). |
| Change set | A reviewed, reversible group of file mutations produced by one skill for one or more findings. |
| Ledger | The committed record of every artifact the system created or manages, used for idempotency, rollback, and drift detection. |
| Profile | A named scope for the orchestrator (`full`, `compliance`, `discoverability`, `trust`, `admin`). Bundle skills select a profile. |
| Owner | The person or organization operating the target project and responsible for business and legal decisions. |
| Source record / snapshot | The registry entry for an authoritative instrument (`rules/sources/`) and a dated record of hashes of its normalized provisions plus status metadata. It never contains the source text. |
| Review state | `PROVISIONAL`, `REVIEWED`, or `REVIEW_REQUIRED` for one obligation, computed from review records and snapshots. It is never authored. |
| Temporal state | Whether an obligation applies on `evaluatedAsOf`: `NOT_YET_EFFECTIVE`, `EFFECTIVE_PRE_COMPLIANCE`, `COMPLIANCE_REQUIRED`, `ENDED`, or `UNDETERMINED`. |

## Naming notes

- Product name: **ReadyVibe**. Engine packages use the npm scope `@readyvibe/*` (ADR 0002). Reserving it is the first Phase 0 administrative action. An unindexed scope is not proof that it can be reserved. If reservation fails, ADR 0002 lists the fallback names, and the package name is changed in one configured place.
- Install commands in this document use the real repository `moh-obaida/ReadyVibe-Skills`. No command may be published in the README until the installability test in §38.1 passes for it. There is intentionally no root README until at least one real, installable skill exists.

## Revision history

| Version | Date | Changes |
| --- | --- | --- |
| 0.1 | 2026-09-28 | Initial architecture (§1–§54) |
| 0.2 | 2026-09-28 | Locked licensing (ADR 0001), npm scope (ADR 0002), computed rule-level legal review (ADR 0003), and rule-level temporal validity (ADR 0004). Added the interchange contract (§5.5), temporal validity (§8.12), source records and snapshots (§9.5), the review lifecycle (§9.10), the source-status register (§9.11), `us-ftc-rosca`, and schemas §32.12–§32.13. Froze Phase 0 to six artifacts plus a canary skill (§42). Fixed the frontmatter rule: `metadata.internal` must be a YAML boolean. |
