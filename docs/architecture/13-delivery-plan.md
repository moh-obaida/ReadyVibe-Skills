# Part XIII — Delivery

## 42. Phased Implementation Plan

Each phase ends with a release that is useful by itself. Later phases extend it without redesigning it. Exit criteria are measurable against the fixture suite (§37) and the acceptance criteria (§46).

### Phase 0 — Contracts and guardrails (scope frozen 2026-09-28)

**Administrative prerequisites** (owner actions, done first):

1. Reserve the `@readyvibe` npm organization (ADR 0002). Until it is confirmed, `tools/skill-lint/config.yaml` keeps `engine.scopeReserved: false`, and nothing outside `docs/` may reference `@readyvibe/*` as installable.
2. Add `LICENSE` (Apache-2.0), `LICENSES/CC0-1.0.txt`, and `NOTICE` listing the CC0 paths and the third-party-excerpt exclusion (ADR 0001).

**Exactly six engineering artifacts.** No privacy, SEO, admin, or other real skill; no engine commands; no real rule packs or legal content; no site fixtures; no root README; no npm publishing.

| # | Artifact | Contents | Location |
| --- | --- | --- | --- |
| 1 | **Schemas** | JSON Schema 2020-12 plus generated TypeScript types. **Stable 1.0:** common primitives (including `TemporalValidity`), `ArtifactEnvelope`, `Evidence`, `Fact`, `CoverageRecord`, `Finding`, `Disposition`, `Question`, project `ReviewRecord`, `RunIdentity` and `RunState`, `SkillContract`, `config`, `suppressions`, `LedgerEntry`, and the provenance schemas in artifact 3. **Draft 0.x:** Reality Model sub-entities and the domain models (design system, admin, consent, rights, …), promoted to 1.0 when their first producer skill ships. A validation library (Ajv) is exported for later reuse by the engine. | `packages/schemas/` (workspace-private until the scope is reserved) |
| 2 | **`.readyvibe/` interchange contract** | The normative rules of §5.5 as `contract/artifact-bus.md`, the envelope schema, and a workspace validator CLI (`rv-validate`) implementing rules 1–8 and 10: path containment, envelope, validate-on-read, version handling, RFC 8785 content hash, atomic write helper, status authority, and secret rejection | `contract/`, `packages/schemas/bin/` |
| 3 | **Rule and source provenance contract** | `contract/provenance.md`, covering source records, snapshots (hashes only), the text normalizer spec v1, reviewer registry, rule reviews, the **computed** review-state function (§9.10), the **temporal-state** function (§8.12), citation and excerpt rules (ADR 0001), and schemas for `Control`, `Obligation`, `SourceRecord`, `SourceSnapshot`, `Reviewer`, `RuleReview`, `ComputedReviewStatus`. Both functions are pure, with exhaustive tests. Test data uses a **fictional** jurisdiction (reserved domains, invented instrument), so no real legal content enters the repository in Phase 0. | `contract/`, `packages/schemas/provenance/` |
| 4 | **Canonical `SKILL.md` layout rules** | `contract/skill-layout.md`: directory rules (§33.3), naming (§53.6), frontmatter (§53.7, including the rule that `metadata.internal` is a YAML **boolean**), the section template (§53.8, stored as `contract/templates/SKILL.md.tmpl`, deliberately not named `SKILL.md`), `contract.yaml`, size budget, and `references/_shared` vendoring | `contract/` |
| 5 | **Skill and repository linter** | `tools/skill-lint` enforcing artifacts 2–4 statically: layout and shadowing; no `SKILL.md` outside `skills/<category>/<name>/`; no agent skill directories anywhere; frontmatter limits (name 1–64 characters matching the directory, description at most 1024 characters with "Use when" and "Do not use"); `contract.yaml` schema; name uniqueness; `_shared` in sync; bundle thinness; license paths (no authority excerpts or ids in CC0 paths); provenance (no authored review states, a temporal block on every obligation, resolvable sources, specialist tags for tagged families); engine package gating (ADR 0002); synthetic-data patterns. Its own test repositories store skill files as `SKILL.md.fixture` and materialize them into temp directories at test time, so they are never discoverable. | `tools/skill-lint/` |
| 6 | **Clean-room Skills CLI installability fixture** | `tools/installability/`: a harness that clones the commit into an empty temp directory, sets `HOME` to a temp directory (no global skills or agents), runs a **pinned** `skills` CLI version (1.7.0 at the time of writing, bumped deliberately), and executes the assertions below. A scheduled non-blocking job repeats it with the latest CLI to detect upstream behavior changes early. | `tools/installability/`, `.github/workflows/` |

**The canary skill.** One deliberately tiny skill, `skills/core/readyvibe-install-canary/`, exists only to exercise artifacts 2–6:

- frontmatter with `metadata.internal: true` (boolean), so public `npx skills add moh-obaida/ReadyVibe-Skills --list` shows **no** skills while Phase 0 is on `main`;
- a `SKILL.md` that says "internal test fixture, do not use", and describes writing one `questions` artifact to `.readyvibe/runs/<runId>/questions.json`;
- `assets/canary-questions.json`: a valid, skill-produced `questions` envelope containing one synthetic question.

**Exit criteria (all enforced in CI):**

1. **Only the canary is discoverable:**
   - `INSTALL_INTERNAL_SKILLS=1 npx skills add <clone> --list --json` returns exactly `[readyvibe-install-canary]`;
   - the same command without the variable returns zero skills;
   - with `--full-depth` added, it still returns exactly the canary, which proves `docs/`, `contract/`, `tools/` test repositories, and templates are not discoverable.
2. **Installs individually:** `--skill readyvibe-install-canary -a universal -y --copy` into an empty temp project installs `SKILL.md`, `contract.yaml`, `references/_shared/`, and `assets/` under `.agents/skills/readyvibe-install-canary/`.
3. **Installs via `--all`** (with the internal variable set) into a second empty project. The canary is present in at least the `.agents/skills/` and `.claude/skills/` locations.
4. **Removal works:** `npx skills remove readyvibe-install-canary -y` leaves no canary files.
5. **Exchange works:** the canary's asset, copied into `.readyvibe/runs/<runId>/questions.json` of the temp project as an agent following its `SKILL.md` would do, is accepted by `rv-validate`.
6. **Malformed artifacts are rejected**, each with its specific error code:
   - missing envelope field → `ARTIFACT_INVALID`;
   - wrong major version → `ARTIFACT_MAJOR_UNSUPPORTED`;
   - tampered `data` → `ARTIFACT_HASH_MISMATCH`;
   - skill-produced `findings` artifact carrying a status → `ARTIFACT_STATUS_AUTHORITY`;
   - secret-shaped value → `ARTIFACT_CONTAINS_SECRET`;
   - symlink escaping `.readyvibe/` → path rejection;
   - unknown property inside `data` of a same-minor artifact → `ARTIFACT_INVALID`.
7. **Linter negative controls:** injecting a skill with an over-long description, a mismatched name, a shallow `SKILL.md` in a category directory, a `.claude/skills/` directory, a CC0 file containing an authority excerpt, or an obligation with an authored review state each fails `skill-lint` with a specific rule id.
8. **Provenance functions:** the review-state and temporal-state test suites pass. They cover a version bump, a changed provision hash, a missing specialist, a normalizer-only change, every temporal boundary, and a transitional rule with a `TRUE`, `FALSE`, and `UNKNOWN` predicate.

**Canary retirement.** The canary is deleted **in the same PR that adds the first real specialist**. That PR updates the harness's expected skill set and switches the assertions from internal mode to public mode. The name `readyvibe-install-canary` is retired permanently (§41.5). The harness itself remains as the permanent installability test (§38.1).

**Phase 0 toolchain (default):** Node.js 22 LTS, TypeScript, pnpm workspaces, Ajv for JSON Schema 2020-12, Vitest, and a YAML parser with safe loading only.

### Phase 1 — MVP (see §43)

**Entry:** Phase 0 exit criteria met; npm scope reservation confirmed or superseded by an ADR; the canary is removed in the PR that adds the first MVP skill.

Phase 1 also delivers what Phase 0 deliberately excluded: the engine skeleton (`doctor`, `init`, JSON I/O, run state, evidence store with redaction, fact store, three-valued evaluator with temporal and review-state handling, ledger) and the first site fixtures.

**Exit:** §43.4.

### Phase 2 — Privacy depth

`data-flow-mapping` (static taint for forms → stores and vendors; Supabase, Prisma, and Drizzle adapters), `privacy-readiness`, `analytics-privacy` (canaries, replay masking), `third-party-privacy` (vendor catalog v1 with about 150 vendors), `privacy-policy` (clause library v1 in English, publish gate, placeholders), `policy-consistency` (full claim kinds, drift), `email-compliance` (static checks, lifecycle with a mail catcher), `data-rights` (deletion plan, soft-delete detection, export), and packs `eu-gdpr`, `uk-gdpr`, `us-can-spam`, `us-ca-ccpa` (provisional), `uae-pdpl` (provisional). Fixtures: newsletter-site, site-replay-leak, fake-deletion, policy-contradictions, saas-good.

**Exit:** all planted issues in those fixtures detected; drafting fidelity eval at 0 unbound assertions; deletion lifecycle verification passes on `fake-deletion` after remediation.

### Phase 3 — Accessibility, i18n, resilience

`wcag-readiness` (full probe set, coverage matrix, manual-test generation), `multilingual-readiness`, `rtl-readiness`, `failure-resilience`, `public-support`, `legal-navigation`, `terms-of-service`, Astro and SvelteKit adapters, and the `wcag-2.2` and `eu-eaa` packs. Fixtures: multilingual-en-ar, design-system-custom.

**Exit:** zero automated violations on generated surfaces; RTL fixture passes after remediation; completeness matrix correct on the multilingual fixture.

### Phase 4 — Security depth and commerce

`web-security` (authorization matrix with synthetic users, BaaS rules analysis, CSRF, CORS, uploads, SSRF), `security-headers` (CSP builder with report-only verification), `dependency-security`, `payments-readiness`, `subscription-readiness`, `ai-features-readiness`, the choice-architecture detectors, and packs `owasp-asvs`, `pci-dss`, `us-ca-auto-renewal`, `eu-consumer`. Fixtures: saas-broken, ecommerce-shop, subscription-dark, repo-hostile.

**Exit:** saas-broken is `BLOCKED` with every planted issue found; the CSP produces zero violations across personas on saas-good; `repo-hostile` passes the tool-security tests.

### Phase 5 — Design system and admin

`design-system-reconnaissance` (full model, token conformance), `admin-dashboard`, `admin-authorization`, `admin-audit-log`, the admin module contract (with `data-rights` and `user-content-safety` modules), `user-content-safety`, `minors-readiness`, and packs `eu-dsa`, `uk-osa`, `uk-aadc`, `us-coppa`. Fixtures: admin-panel-good, admin-broken-authz, kids-learning, design-system-custom (admin).

**Exit:** admin verification matrix passes after remediation on admin-broken-authz; `ADMIN.UNBOUND_METRIC` = 0; `DS.OFF_SYSTEM_VALUE` = 0 on generated admin; kids-learning produces `LEGAL_REVIEW_REQUIRED` items and no DOB field.

### Phase 6 — Continuous readiness

`compliance-diff` (static incremental plus runtime), `readyvibe ci`, baselines and regression classes, SARIF, PR comments, a GitHub Action wrapper, `search-console-readiness` with an OAuth flow, and field performance via CrUX.

**Exit:** the diff detects every delta kind on synthetic PR fixtures; CI blocking policy tests pass; installability of the pinned release is verified for every README command.

### Phase 7 — Breadth

Additional jurisdictions (§44), frameworks, hosting targets, locales for the clause library, the HTML report, and an optional MCP wrapper.

---

## 43. MVP

### 43.1 Goal

The smallest release that is **useful on day one** and **cannot be mistaken for more than it is**, built on the full architecture, so nothing needs to be redesigned later.

### 43.2 Included

**Skills** (all with full `SKILL.md` and contract, installable via the Skills CLI):

| Skill | MVP scope |
| --- | --- |
| `launch-all` | Bundle with bootstrap |
| `launch-readiness` | Full run state machine, planning, questions, waves, repair loop, report |
| `site-reconnaissance` | Next.js, Vite React, and static HTML static reconnaissance; runtime crawl; route intent (deterministic plus heuristics; anchored LLM for the remainder) |
| `cookie-and-storage-audit` | Complete runtime storage inventory and purpose classification, with an MVP vendor catalog of about 60 common vendors |
| `consent-management` | Detection, necessity decision (including the "no banner needed" outcome), the full verification protocol (§13.8 steps 1–7, 9), remediation via a first-party consent module for Next.js and Vite React, and integration checks for existing CMPs |
| `seo-readiness` | Two-render head extraction, indexability verdict, robots, sitemap validation and generation (Next.js, static), canonical checks, titles and descriptions |
| `social-sharing` | OG and card tags in raw HTML, image checks, preview renders |
| `launch-identity` | Identity consistency, residue catalog, favicon set from an existing logo |
| `error-pages` | Unknown-route probe, soft-404 and SPA-fallback detection, branded 404 via the design system (a minimal design-system model: tokens and layout from static plus computed styles) |
| `security-headers` | Audit, plus CSP **proposal** in report-only mode (enforcement in Phase 4) |
| `web-security` (subset) | Secrets in client bundles and env prefixes, `.env` hygiene, session cookie attributes, error disclosure |
| `policy-consistency` (subset) | Claim kinds `VENDOR_USE`, `COOKIE_CATEGORY_ONLY`, `NO_COOKIES`, `CONSENT_BEHAVIOR`, `RIGHT_AVAILABLE` (presence only), `COMPLIANCE_BADGE`, `LANGUAGE_AVAILABILITY`, plus the deterministic contradiction rules of §27.4 |
| `launch-verification` | Final clean-state verification, launch states, report linter |

**Engine:** static analyzers for the three MVP frameworks; HTTP, crawl, and browser probes with network and storage timelines and personas; head extraction; unknown-route probe; axe scan (reported under `wcag-readiness`-owned controls in audit mode, so accessibility findings appear even though the full skill arrives in Phase 3); evidence store with redaction; ledger; report (Markdown, JSON, SARIF).

**Packs:** `global-baseline`, `google-search`, `eu-eprivacy` and `uk-pecr` (consent-related obligations only), and security-header controls without legal mapping. Every obligation starts `PROVISIONAL` (§9.10). `uk-pecr` obligations affected by the Data (Use and Access) Act 2025 carry provision-level temporal blocks from the start (§9.11), and each source is captured as a source record with a snapshot before its obligation is written.

**Fixtures:** portfolio-minimal, portfolio-vibe-defaults, site-bad-consent, site-analytics-good, existing-cmp-working, policy-contradictions (MVP claim kinds), repo-hostile (tool security from day one).

### 43.3 Deliberately excluded (with schema support already in place)

Privacy Policy drafting, data rights, email, minors, payments, admin, full accessibility remediation, RTL, the compliance diff, and CI mode. The report's "Not checked" section lists these explicitly for every MVP run, with the reason "not available in this version". The launch state cannot be `TECHNICALLY_READY` in the MVP when excluded domains have applicable capabilities (for example, `HAS_AUTH` present means data rights are unchecked, which is `UNKNOWN(reason = PRODUCER_SKILL_MISSING)` for the rights controls, so the state is at most `CONDITIONALLY_READY`). This keeps the MVP honest.

### 43.4 MVP exit criteria

1. All planted conditions in the MVP fixtures are detected with evidence. Zero blocking false positives on `site-analytics-good` and `existing-cmp-working`.
2. `portfolio-minimal`: no consent UI proposed, and consent controls are `NOT_APPLICABLE` with a displayed coverage record.
3. `site-bad-consent`: `BLOCKED` before remediation; after approved remediation, consent controls `PASS` in fresh contexts across personas, and the dialog passes keyboard and dialog probes.
4. Idempotency: every MVP remediation yields a zero diff on the second run.
5. `repo-hostile`: all tool-security tests pass.
6. Installability: every README command verified against the release tag.
7. The report linter passes on all fixture reports. No banned phrases appear.

---

## 44. Future Extensions

| Area | Extensions |
| --- | --- |
| Jurisdictions | Canada (federal and Québec), Brazil (LGPD), Australia (Privacy Act), Singapore (PDPA), Saudi Arabia (PDPL), India (DPDP Act), other US state privacy laws (as separate state packs), EU member-state overlays (for example national cookie guidance), additional children's codes, and sector packs (health, finance, education, gambling) |
| Frameworks | Vue and Svelte SPAs, Angular, Gatsby, Eleventy, Hugo, Django, Rails, Laravel, WordPress (read-mostly), Webflow and Framer exports (static analysis of exported sites) |
| Hosting | AWS (CloudFront, Amplify), Google Cloud, Azure Static Web Apps, Fly.io, Render, Railway |
| Platforms | Native mobile apps (store privacy labels versus SDK reality), browser extensions, backend-only APIs (OpenAPI-driven checks) |
| Features | HTML report with interactive evidence; an MCP server wrapper; vendor-account integrations (reading analytics retention settings via credentialed APIs); DPIA and RoPA workflow modules; a consent-record retention manager; a status-page integration; a translation-review workflow integration; field-data dashboards; organization-wide fleet mode (many sites, one baseline policy) |
| Knowledge | A community vendor-catalog expansion program with evidence requirements; clause libraries in more languages (with native-speaker and legal review) |
| Verification | Real screen-reader automation where reliable; visual regression baselines; synthetic monitoring of consent behavior in production (passive personas on a schedule) |

---

## 45. Failure Modes (How False Confidence Could Arise, and What Prevents It)

| # | Failure mode | Prevention in this architecture |
| --- | --- | --- |
| 1 | "No findings" read as "compliant" | No-score policy; `UNKNOWN` status; coverage and "not checked" sections are mandatory; definition box on every launch state (§30.2, §30.4) |
| 2 | Absence inferred from not looking | `ABSENT` requires coverage with sufficiency; otherwise `UNKNOWN` (§6.5) |
| 3 | Missing business facts silently treated as false (for example thresholds) | Kleene logic; `ownerFact` returns `UNKNOWN` until answered (§8.4) |
| 4 | Jurisdiction guessed from language, TLD, or hosting | Activation rules forbid it; candidate mode cannot `FAIL` (§9.2) |
| 5 | The LLM hallucinates a policy sentence or evidence | Quote anchoring with an engine substring check; cited evidence must exist (§7.7) |
| 6 | The LLM sets a status | Only the engine computes statuses (§40.4) |
| 7 | Consent verified only on the homepage or only once | Personas × route templates; repeated attempts; any leak in any attempt fails (§13.8, §29.5) |
| 8 | Scripts loaded only after acceptance break under CSP, so CSP is "fixed" by removing consent | CSP built from post-remediation accept-all captures; report-only verification across personas (§23.8) |
| 9 | Unknown-purpose storage marked necessary to pass | `UNKNOWN` never maps to necessary; a forbidden-remediation list; `STORAGE.UNKNOWN_PURPOSE` (§13.3) |
| 10 | A policy drafted with promises the product cannot keep | Publish gate binds rights claims to `VERIFIED` rights; drift detection (§15.5, §27.7) |
| 11 | Placeholders shipped to production | `UNRESOLVED_PLACEHOLDER` is blocking (§15.4) |
| 12 | Soft delete reported as deletion | Deletion semantics per node; confirmation copy generated from the plan; lifecycle verification (§17.5, §17.9) |
| 13 | Unsubscribe link present, but sends ignore it | Chokepoint plus static bypass detection plus lifecycle test (§16.4, §16.5) |
| 14 | Hidden nav treated as admin security | Server-side enforcement points; direct-request matrix (§52.7, §52.15) |
| 15 | Admin overview shows plausible fake numbers | `ADMIN.UNBOUND_METRIC`; empty-database runtime check (§52.6) |
| 16 | An automated accessibility scan presented as WCAG conformance | Coverage matrix; `MANUAL_REVIEW_REQUIRED` unknowns; no conformance claims (§18.1, §18.3) |
| 17 | The sitemap treated as proof of indexing | `SEARCH_READY` versus `ACTUALLY_INDEXED` (§20.10) |
| 18 | Metadata written in code but not present for crawlers | Raw-render verification (§20.4, §21.3) |
| 19 | A 404 page exists but the status is 200 | Unknown-route probe on each environment (§22.2) |
| 20 | Fixes counted as done because code was written | `VERIFIED_FIXED` only via fresh probe evidence; final clean-state verification (§29.6) |
| 21 | Flaky runtime results averaged into a pass | Flaky results can never `PASS` (§29.5) |
| 22 | Stale legal packs silently used | Freshness states; `STALE_CRITICAL` prevents `PASS` on legal obligations (§9.6) |
| 23 | Suppressions hiding new problems | Single control, specific scope, expiry, fingerprints; new scopes are new findings (§30.8) |
| 24 | Legal review items suppressed away | Not suppressible; only `ReviewRecord`s change the disposition, never the status (§30.8) |
| 25 | A degraded run (no engine, no URL) looks like a full run | `degraded` flag; state capped at `CONDITIONALLY_READY`; the first paragraph states it (§11.11) |
| 26 | Server-side data flows assumed absent because they were not observable | Coverage blind spots stated; absolute negative claims unsupported (§26.2, §27.6) |
| 27 | Remediation introduces new tracking or data (for example a CMP vendor, fonts) | Change sets declare new vendors and data; final verification re-inventories everything, including previously `NOT_APPLICABLE` controls (§28.6, §29.6) |
| 28 | Owner statements override observed reality | Behavioral precedence: observed beats asserted; conflicts become contradictions (§6.8) |
| 29 | The report prose overstates results | Report linter: banned phrases, numbers checked against JSON, no status inflation (§30.6) |
| 30 | Bundles drift from specialists | Bundles are thin aliases; lint enforces it (§53.5) |
| 31 | Malicious repositories steer the agent | Injection guard; engine flags; status authority in the engine (§40.4) |
| 32 | A partially installed skill set gives partial results that look complete | `PRODUCER_SKILL_MISSING` unknowns with install commands; state capped (§10.3, §53.5) |
| 33 | Production harmed by testing | Probe safety classes per environment; production-origin guard (§29.3) |
| 34 | A reviewed rule silently goes out of date after its source changes | Review state is computed against the latest provision hashes; a changed hash makes it `REVIEW_REQUIRED` automatically (§9.10) |
| 35 | Law applied before commencement, during a transition, or after vacatur | Rule-level temporal validity with `evaluatedAsOf`; transitional rules; `VACATED` sources never evaluated as current (§8.12, §9.5) |
| 36 | Commentary fills the gap left by missing implementing regulations | `EXPECTED_NOT_LOCATED` sources; secondary sources can never supply requirement content (§9.5, §9.11) |
| 37 | A test or fake skill leaks into the public catalog | The canary is `internal: true` (boolean); installability asserts zero public skills in Phase 0; mandatory canary retirement; linter test repositories use `SKILL.md.fixture` (§42) |

---

## 46. Acceptance Criteria

### 46.1 The architecture is successful if

1. **Independent implementability:** a contributor can implement any one specialist skill using only its section, §10.3 (contract), §28–§29 (remediation and verification), §32 (schemas), and §53 (distribution), without changing the core or other skills.
2. **Extension without core changes:** adding a jurisdiction pack, a control mapped to existing detectors, a framework adapter, a hosting adapter, a vendor entry, or a fixture requires no engine or orchestrator code changes (only data, adapter packages, or fixtures).
3. **Single ownership:** every artifact and semantic key in §10.6 has exactly one owner. The ownership registry is machine-checkable.
4. **Traceability:** every status can be traced from finding → control and obligations → authority and evidence → probe and environment → commit.
5. **Separation holds:** detection, evaluation, interpretation, remediation, and verification are distinct components with distinct schemas (§8.1).
6. **Honesty is structural, not aspirational:** the principles in §2 each name an enforcing mechanism that exists in the design.

### 46.2 The implementation is successful when

**Correctness and honesty**

- 100% of planted blocking issues in the fixture suite are detected with evidence, and every finding with status `PASS`, `FAIL`, `WARNING`, or `NOT_APPLICABLE` has at least one evidence record (schema-enforced).
- Zero blocking false positives on the "good" fixtures (`saas-good`, `site-analytics-good`, `admin-panel-good`, `existing-cmp-working`).
- Zero over-remediation on minimal fixtures: `portfolio-minimal` receives no consent UI, no rights UI, no manifest, and no new dependencies.
- No report contains banned phrases. Every summary number matches `report.json`.
- No fabricated facts in any fixture output (`REMEDIATION.FABRICATED_FACT` = 0; drafting-fidelity eval = 0 unbound assertions).
- No obligation in the repository has an authored review state. Computed review states are published for every pack, and every obligation has a complete temporal block whose dates are consistent with its source snapshots.
- Pack tests cover every temporal boundary and transitional rule. Changing `evaluatedAsOf` across a boundary changes findings exactly as `expected.yaml` predicts.
- No CC0 path contains authoritative excerpts or authority identifiers (ADR 0001).
- Launch states on fixtures match `expected.yaml` before and after remediation.

**Safety**

- `repo-hostile` passes: no project script executed, no path escape, limits respected, injection text ignored, secrets redacted everywhere.
- No mutating probe runs against an environment whose origin matches a production origin unless explicitly allowed.
- Rollback restores byte-identical files in the remediation tests.

**Idempotency and integration**

- Every remediation run twice yields a zero diff. User-modified managed artifacts are never overwritten.
- Generated visual surfaces pass token conformance (`DS.OFF_SYSTEM_VALUE` = 0) and have zero automated accessibility violations, plus passing keyboard and dialog probes.

**Public repository**

- Every skill passes `skill-lint`. `npx skills add moh-obaida/ReadyVibe-Skills --list` shows every public skill with a description that includes when to use it and when not to.
- Every README install command is verified by the installability job against the release tag.
- Secret scanning and the synthetic-data lint are clean on every release.
- Each skill has a changelog, a version, and documented inputs, outputs, file changes, commands, verification, and legal-uncertainty behavior.

**Continuity**

- Compliance diff: each delta kind in §39.3 is detected on synthetic PR fixtures, with implications matching `implications.yaml`.
- A new vendor added in a PR produces, in one comment: an inventory change, a consent implication, a CSP implication, and a policy drift notice.

### 46.3 Per-skill definition of done

A skill is releasable when:

1. The contract validates, and `SKILL.md` follows §53.8 within the size budget.
2. Owned controls have unit tests and fixtures (fail, pass, and not-applicable where possible).
3. Remediation recipes pass idempotency and rollback tests on each claimed adapter.
4. The verification procedure runs in CI on fixtures.
5. Visual skills pass design-system and accessibility verification on fixtures.
6. Semantic tasks meet eval thresholds.
7. Documentation (what it reads, changes, and runs; limits; legal uncertainty) is complete, and the catalog entry is generated.
8. A changelog entry and version bump follow §41.2.
