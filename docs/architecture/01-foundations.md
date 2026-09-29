# Part I — Foundations

## 1. Executive Architecture

### 1.1 The problem in one paragraph

A vibe-coded website can look finished while still loading analytics before anyone agreed to it, promising account deletion it cannot perform, serving `200 OK` for every unknown URL, shipping `localhost` in its canonical tags, leaking an API key through a `VITE_` variable, showing "Your Company Name" in its Privacy Policy, and trapping keyboard users inside a cookie dialog. None of this is visible in a screenshot. ReadyVibe exists to find the gap between *looks finished* and *responsibly ready to launch*, close the parts of that gap that can be closed safely, and prove the result.

### 1.2 What the system is

ReadyVibe is a public repository of installable agent skills backed by a deterministic engine and versioned knowledge packs.

1. **Skills** (installed with `npx skills add moh-obaida/ReadyVibe-Skills …`) are instruction sets for coding agents such as Cursor, Claude Code, and Codex. They provide judgment: classifying ambiguous things, drafting documents from facts, planning remediation, writing code that fits the project's architecture and design system, and asking the owner the right questions.
2. **The engine** (`@readyvibe/cli`, run through `npx`) provides instruments: static analysis, a headless browser that records network requests, cookies and storage before and after consent choices, HTTP probing, accessibility scanning, keyboard walks, head/metadata extraction with and without JavaScript, rule evaluation, evidence storage, diffing, and report generation. Everything the engine does is repeatable and testable, and it can run in CI without an LLM.
3. **Knowledge packs** hold the rules: framework-independent controls, jurisdiction packs (EU, UK, UAE, US federal, California, …), standards packs (WCAG 2.2, OWASP ASVS, PCI DSS triggers), guidance packs (Google Search, Core Web Vitals), and a vendor catalog. Packs are data with citations, versions, and review dates. They are not prose buried in prompts.

These layers meet in one place: the **artifact bus**, a `.readyvibe/` directory in the target project. Skills and the engine read and write typed, schema-validated artifacts there: the Reality Model, evidence, findings, plans, change sets, reports, and the launch manifest. No skill calls another skill directly, so any subset of skills can be installed and each still behaves correctly.

### 1.3 How a run works, in plain language

1. **Look before touching.** The system inventories the project: framework, routes, forms, database schema, cookies, storage, network destinations, scripts, vendors, auth, email, payments, locales, audience signals, deployment configuration, and design system. If a URL is available, it opens the site in fresh browser contexts and records what actually happens.
2. **Write down reality.** The findings of that inventory are assembled into a **Website Reality Model**. Every entry says where it came from (runtime observation, code, configuration, the site's own statements, the owner, or inference), how confident the system is, and which evidence proves it.
3. **Work out what "launch-ready" means for this site.** From the model the system derives capabilities (`HAS_ANALYTICS`, `HAS_AUTH`, `HAS_PAYMENTS`, …) and resolves which jurisdiction packs apply based on the owner's confirmed markets, never on a `.com` domain or hosting region. It then selects only the relevant specialist skills. A portfolio with no tracking does not get a cookie banner. A site with no accounts does not get account-deletion UI.
4. **Compare what the site says with what it does.** Specialists evaluate controls. A contradiction engine compares the site's declarations (policies, banners, badges, footer claims) against observed and implemented behavior.
5. **Propose, then fix.** The owner sees one consolidated plan: what was found, why it applies, what will change, what needs their input, and what needs a lawyer. Safe fixes are applied in dependency order, using the project's own framework conventions and design system. Anything requiring facts the system does not have becomes a typed placeholder and an owner question. It is never invented.
6. **Prove it.** After changes, the system rebuilds, reruns the probes from a clean state, and re-evaluates every affected control. "Code was written" is never treated as "feature verified".
7. **Report honestly.** The report gives a launch state (`BLOCKED`, `CONDITIONALLY_READY`, `READY_WITH_REVIEW_ITEMS`, or `TECHNICALLY_READY`), counts of each status per domain, the evidence behind every finding, what was not applicable and why, what could not be checked, and what needs owner or legal input. It never says "compliant" and never shows a percentage score.
8. **Keep watching.** The accepted state becomes a baseline. Later runs, and the **compliance diff** on pull requests, report what changed in privacy, consent, security, search, and accessibility terms, for example "this PR adds a new marketing pixel".

### 1.4 Two example outcomes

**A privacy-respecting portfolio** (Astro, static, self-hosted fonts, no analytics, contact via `mailto:`) produces a short report. Launch identity, metadata, social cards, 404 semantics, accessibility, security headers, and performance are checked and fixed. Consent is `NOT_APPLICABLE` with coverage evidence showing no non-essential storage or third-party requests across all crawled routes. Account rights, email compliance, payments, and minors are `NOT_APPLICABLE`. Privacy transparency is `LEGAL_REVIEW_REQUIRED` only if the owner confirms EU or UK visitors are in scope and the hosting provider's access logs contain IP addresses. In that case, the proposed remedy is a short, truthful notice, not a 5,000-word template.

**A SaaS app** (Next.js, Supabase auth, Stripe subscriptions, PostHog with session replay, Resend newsletters, an OpenAI-backed feature, English and Arabic) triggers most specialists. Typical outcomes: session replay records a canary email typed into a settings field (`FAIL`, confirmed); PostHog initializes before consent for EU visitors (`FAIL`); the Privacy Policy says "we do not use third-party analytics" (contradiction, `FAIL`); "Delete account" sets `deleted_at` but leaves the Stripe customer, Resend contact, and uploaded files (contradiction with the UI copy "permanently deleted", `FAIL`); the Arabic locale has no translated Terms (`FAIL` for the "fully bilingual" claim, and `LEGAL_REVIEW_REQUIRED` for the translation itself); the cancellation flow takes five steps against signup's one (`WARNING` or `LEGAL_REVIEW_REQUIRED` depending on active packs); `/dashboard` appears in the sitemap (`FAIL`).

### 1.5 Why this shape

| Alternative | Why it was rejected |
| --- | --- |
| Prompt-only skills (agents do everything with their own tools) | Not reproducible, cannot run in CI, and invites the LLM to "check" things by reading code instead of observing behavior. It is kept only as a degraded fallback with capped confidence (§11.11). |
| A monolithic scanner CLI with no agent layer | Cannot draft truthful documents, cannot plan cross-file remediation, cannot integrate new UI into a bespoke design system, and cannot hold a conversation about business facts. |
| An MCP server as the primary runtime | Agent support varies, and it adds a long-running process to install and secure. A shell-invoked CLI with JSON I/O works in every agent that can run commands and in CI. An MCP wrapper can be added later without changing the core (§44). |
| One enormous "make it launch-ready" skill | It cannot be installed selectively, cannot be tested per domain, invites duplicated logic, and overflows agent context. |

---

## 2. Principles

These are non-negotiable. Each one names the mechanism that enforces it. A principle without an enforcement mechanism is a wish.

| # | Principle | What it means in practice | Enforced by |
| --- | --- | --- | --- |
| P1 | **No compliance theater** | Nothing the system produces may state or imply a behavior the Reality Model does not support. A deletion promise requires a working deletion workflow. A "Reject all" button requires that rejection actually blocks tracking. | Claim registry and the policy-consistency gate (§27). Generated documents are compiled from facts, and every sentence traces to a fact or a clause (§15). |
| P2 | **Discovery before remediation** | No mutation happens until a sealed Reality Model exists for the current commit. | The engine refuses `apply` without a sealed model whose `commit` matches `HEAD` and whose working-tree digest matches (§28.2). |
| P3 | **Evidence or it did not happen** | Every `PASS`, `FAIL`, `WARNING`, and `NOT_APPLICABLE` references evidence. | Finding schema: `evidence` has `minItems: 1` for those statuses. CI rejects evidence-free findings (§32). |
| P4 | **Absence is a claim** | "No analytics" must be backed by coverage: which routes, personas, source files, and signatures were checked. | Capability `ABSENT` requires a `CoverageRecord`. `NOT_APPLICABLE` derived from `ABSENT` inherits it (§6.5). |
| P5 | **Deterministic first** | If a question can be answered by parsing, fetching, or observing, an LLM does not answer it. | Rule schema declares `evaluatorKind`. Semantic evaluators are allowed only where the rule states why determinism is impossible (§8.5). |
| P6 | **LLM output is anchored** | Extracted claims carry verbatim quotes and locations. Classifications cite evidence IDs. | The engine validates each quote as an exact substring of the referenced artifact and rejects unanchored output (§7.7). |
| P7 | **Never fabricate facts** | No invented company names, addresses, retention periods, subprocessors, DPOs, legal bases, prices, ratings, reviews, authors, metrics, or contact details. | Typed `OwnerInputRequired` placeholders; the unresolved-placeholder control blocks launch if one reaches a published page (§15.4). Structured-data and admin-metric bindings require a data source (§21, §52). |
| P8 | **Legal humility** | The system detects facts, maps them to sourced rules, and explains uncertainty. It never certifies compliance. | Status vocabulary; the report linter bans phrases such as "fully compliant", "GDPR compliant", and "guaranteed" (§30.6). |
| P9 | **Proportionality** | Requirements are derived from reality. `NOT_APPLICABLE` is a successful outcome. A simple site stays simple. | Applicability predicates; "no over-remediation" fixture tests that must produce zero added surfaces on minimal fixtures (§37). |
| P10 | **Minimal data, for the target and for the tool** | Never add data collection to satisfy a workflow (for example, no ID uploads for privacy requests by default, no date-of-birth field because an age gate "looks professional"). The tool collects only what it needs and redacts at capture. | Remediation recipes are reviewed for data additions. Any new `DataElement` introduced by a change set requires a stated purpose and triggers privacy re-evaluation (§28.6). Evidence redaction (§7.3). |
| P11 | **Least destructive action** | No production mutations, no destructive tests against production, no commits or pushes without consent, and rollback on breakage. | Probe safety classes per environment (§29.3); autonomy levels (§31); snapshots (§28.5). |
| P12 | **Design-system circulation** | Every visible surface reuses the product's existing design language. | Visual skill contract; token-conformance verification (§51). |
| P13 | **Native semantics before ARIA** | Fix HTML first. ARIA is added only when no native element works. | Accessibility remediation recipes and the ARIA-misuse controls (§18.7). |
| P14 | **Real choice over consent theater** | Consent UI must actually control processing and offer equivalent choices. | Consent verification protocol (§13.8); choice-architecture detectors (§49). |
| P15 | **One source of truth per domain** | Bundles compose specialists. They never copy instructions. | Bundle `SKILL.md` files have a line limit and a CI lint rejecting domain procedure headings in bundles (§53.5). |
| P16 | **Framework-independent rules** | Controls express intent (for example "set page metadata"). Adapters implement it. | Rules may reference only capability operations, never framework APIs (§8.8, §34). |
| P17 | **Jurisdiction packs, not global assumptions** | No law applies "globally" by default. | Pack activation model (§9.2). |
| P18 | **Runtime verification over static claims** | Fixes are verified by fresh probes. | The `VERIFIED_FIXED` disposition can only be set by the verification engine using post-change evidence (§29.6). |
| P19 | **Repositories are untrusted** | Target code, config, and text are data, never instructions. | Execution policy, sandbox, and prompt-injection guard (§40). |
| P20 | **Public by default** | Nothing in the skills repository is secret. All fixtures are synthetic. | Secret scanning and the synthetic-data lint in repository CI (§38.1). |
| P21 | **Idempotency** | Running twice produces no duplicates. | Semantic-key upserts and the ledger (§28.4). The idempotency test runs every remediation twice and expects an empty second diff (§36). |
| P22 | **Severity ≠ confidence ≠ category** | A missing favicon never looks like unlawful processing, and a high-impact suspicion is not presented as proven. | Separate fields in the finding schema; report grouping by category (§8.2, §8.7). |

---

## 3. System Boundaries and Risk Model

### 3.1 What the system does

- Inspects source code, configuration, build output, and running deployments (local, preview, production) that the owner points it at.
- Builds an evidence-backed model of data collection, storage, network behavior, vendors, user controls, disclosures, identity, search configuration, accessibility behavior, security posture, and design system.
- Evaluates framework-independent controls and maps them to sourced obligations in active packs.
- Detects contradictions between what the site declares and what it does.
- Implements straightforward technical controls (metadata, sitemaps, headers, consent gating, error pages, unsubscribe endpoints, rights workflows, admin authorization, and so on) following the project's conventions.
- Drafts legal and trust documents only from known facts, with explicit placeholders and review flags.
- Verifies changes at runtime and records evidence.
- Produces human and machine reports, a launch manifest, a baseline, and compliance diffs.

### 3.2 What the system does not claim or do

| Not claimed / not done | What it does instead |
| --- | --- |
| Legal advice or a legal conclusion that a site "complies" | Reports controls evaluated, obligations mapped, evidence, and `LEGAL_REVIEW_REQUIRED` items with precise questions for counsel. |
| WCAG conformance claims | Produces an evaluation report in the spirit of WCAG-EM, with automated, guided-manual, and manual-only criteria separated. A conformance claim is the owner's statement. |
| PCI DSS validation or determining an SAQ type | Flags scope indicators (for example, the server receives card data) and recommends confirming with the acquirer or a QSA. |
| Guaranteed indexing, ranking, or rich results | Verifies `SEARCH_READY` conditions. `ACTUALLY_INDEXED` requires Search Console data (§20.10). |
| Organizational processes (DPIAs, records of processing, vendor DPAs, incident response plans, staff training) | Pre-fills drafts from facts where useful, marks them `OWNER_INPUT_REQUIRED` or `LEGAL_REVIEW_REQUIRED`, and never marks them complete. |
| Penetration testing | Performs non-destructive verification of common weaknesses, using synthetic test users only in non-production environments unless explicitly permitted. |
| Operating on production data | Never reads or modifies real user records. Deletion and export tests use seeded synthetic users in test environments. |
| Deciding business policy (retention periods, refund policy, age policy, governing law) | Asks the owner, records the answer with provenance, and implements and discloses it truthfully. |
| Native mobile apps, desktop apps, pure backend APIs | Out of scope for v1. The model schema leaves room for them (§44). |

### 3.3 Boundary between the agent, the engine, and people

```text
             decides facts about the business          decides legal questions
                    ┌──────────┐                           ┌──────────┐
                    │  OWNER   │                           │ COUNSEL  │
                    └────┬─────┘                           └────┬─────┘
             answers questions, approves plans        review records (reviews.yaml)
                         │                                      │
  ┌──────────────────────▼──────────────────────────────────────▼──────────────┐
  │ AGENT + SKILLS  judgment · classification · drafting · planning · code     │
  │                 MUST cite evidence · MUST NOT fabricate · MUST ask         │
  └──────────────────────┬─────────────────────────────────────────────────────┘
          JSON commands  │  artifacts
  ┌──────────────────────▼─────────────────────────────────────────────────────┐
  │ ENGINE  probes · detectors · rule evaluation · evidence · ledger · reports │
  │         deterministic · sandboxed · no LLM · usable in CI                   │
  └────────────────────────────────────────────────────────────────────────────┘
```

- **The engine owns truth-finding** for everything that can be observed or parsed. Its outputs are deterministic for a given commit, environment, and engine version, apart from runtime flakiness, which is recorded (§29.5).
- **The agent owns interpretation and authorship.** Its interpretations are stored as `INFERRED` facts with confidence capped at `HIGH` unless corroborated by engine evidence, and it can never mark a legal obligation `PASS` on its own interpretation.
- **The owner owns business facts and approvals.** Owner-asserted facts are recorded with who confirmed them and when.
- **Counsel owns legal conclusions.** Their review is recorded as a `ReviewRecord`, which changes a finding's disposition but never rewrites its status.

### 3.4 Risk model

**Risks to end users and owners that the system addresses** (ordered roughly by typical harm):

1. Personal data flowing to third parties without a lawful basis or disclosure (pre-consent tracking, PII in analytics or error reports, session replay capturing inputs, AI vendors receiving user content).
2. Security exposure (leaked secrets, missing authorization, IDOR, open BaaS rules, unauthenticated AI proxy endpoints that can be abused for cost, insecure session cookies).
3. False promises (policies, banners, or UI copy that misstate behavior), which are both a user harm and a deceptive-practice risk.
4. Denial of rights (impossible deletion or export, broken unsubscribe, hidden cancellation).
5. Harms to children (profiling, geolocation, or public interaction on a service likely to be used by children).
6. Exclusion (inaccessible flows, including the compliance surfaces themselves).
7. Public embarrassment and lost discoverability (template residue, localhost metadata, private pages indexed, broken share previews, soft 404s).

**Risks the system itself creates, and the architectural response:**

| Risk | Response |
| --- | --- |
| False confidence from a clean report | Coverage reporting, `UNKNOWN` as a first-class status, explicit "not checked" lists, the no-score policy, and the failure-mode catalogue in §45. |
| Legal misstatement in generated documents | Fact-bound clause compilation, placeholders, quote-anchored consistency checks, and legal review flags (§15). |
| Destructive or breaking changes | Approval gates, snapshots, per-wave build and verification, automatic rollback (§28). |
| Leaking target-project secrets or personal data through evidence | Redaction at capture, hashed values, runs directory ignored by git, shareable-export redaction (§7.3, §30.7). |
| Executing malicious target code | Execution policy, sandboxing, static parsing of config files (§40). |
| Prompt injection from repository content | Content treated as data; injection guard in every skill; engine flags instruction-like strings (§40.4). |
| Supply-chain compromise of ReadyVibe itself | Minimal dependencies, provenance-attested publishing, pinned CI actions, signed tags (§40.7). |
| Stale legal knowledge | Pack freshness metadata, staleness warnings, CI checks on review dates (§9.6). |
| Over-remediation (bureaucratic bloat) | Applicability logic, no-over-remediation fixtures, and "unnecessary banner" controls that flag bloat as well as gaps (§13.1). |

---

## 4. High-Level Component Diagram

```text
┌─────────────────────────────── PUBLIC SKILLS REPOSITORY (moh-obaida/ReadyVibe-Skills) ───────────────────────────────┐
│                                                                                                                        │
│  skills/  (installed by `npx skills add`)                         packages/  (published to npm as @readyvibe/*)       │
│  ┌───────────────────────────────┐                                ┌──────────────────────────────────────────────────┐ │
│  │ bundles/  launch-all …        │──profile──┐                    │ cli ── engine ── schemas                         │ │
│  │ core/     launch-readiness    │◄──────────┘                    │   │       │                                      │ │
│  │           site-reconnaissance │                                │   │   ┌───┴──────────┬───────────┬────────────┐  │ │
│  │           design-system-recon │                                │   │   │ static       │ probes    │ evaluator  │  │ │
│  │           launch-verification │                                │   │   │ analyzers    │ (browser, │ (controls, │  │ │
│  │           compliance-diff     │                                │   │   │ (routes,     │  http,    │ obligations│  │ │
│  │ privacy/  …14 specialists     │                                │   │   │  forms, db,  │  storage, │ 3-valued   │  │ │
│  │ accessibility/ wcag-readiness │                                │   │   │  deps, env)  │  a11y,    │ logic)     │  │ │
│  │ discoverability/ …            │                                │   │   └──────────────┴─ keyboard)┴────────────┘  │ │
│  │ launch-experience/ …          │                                │   │   adapters: framework · hosting · data       │ │
│  │ i18n/ security/ performance/  │                                │   │   evidence store · ledger · diff · report    │ │
│  │ commerce/ admin/              │                                │   └──────────────────────────────────────────────┘ │
│  └───────────────┬───────────────┘                                └───────────────────────▲──────────────────────────┘ │
│                  │ SKILL.md + contract.yaml + references/                                   │ bundled at build          │
│                  │ (shared contract vendored from /contract)       rules/  vendor-catalog/  │ (versioned knowledge)     │
│                  │                                                 ┌────────────────────────┴────────────────────────┐ │
│                  │                                                 │ controls · packs: global, eu-*, uk-*, uae-*,    │ │
│                  │                                                 │ us-*, us-ca-*, wcag-2.2, owasp-asvs, pci-dss,   │ │
│                  │                                                 │ google-search, core-web-vitals · authorities    │ │
│                  │                                                 └─────────────────────────────────────────────────┘ │
└──────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                   │ installed into .agents/skills/, .claude/skills/, …
┌──────────────────▼──────────────────────────────── USER MACHINE / CI ──────────────────────────────────────────────────┐
│  CODING AGENT ──reads──► SKILL.md ──runs──► `npx @readyvibe/cli <cmd> --json` ◄── CI runner (no agent)               │
│       │  edits code (semantic changes)                 │  probes                                                      │
│       ▼                                                ▼                                                              │
│  TARGET PROJECT (untrusted) ◄────────────── static read ─┘    RUNNING DEPLOYMENT (local / preview / production URL)   │
│   ├─ source, config, migrations, lockfiles                     ▲  observed through a fresh browser context per persona │
│   └─ .readyvibe/  ◄══ ARTIFACT BUS ══► config · reality · evidence · findings · plan · ledger · reports · manifest    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Component responsibilities**

| Component | Responsibility | Must not |
| --- | --- | --- |
| Bundle skills | Pick a profile, bootstrap missing member skills, hand off to `launch-readiness`. | Contain domain procedures. |
| `launch-readiness` (orchestrator skill) | The agent-side procedure for planning, questions, approvals, remediation waves, repair loops, and reporting. | Evaluate domain rules itself. |
| Foundation skills | Produce shared models (project, routes, data flows, design system). | Mutate project files. |
| Specialist skills | Own a domain's controls, artifacts, remediation, and verification steps. | Mutate artifacts owned by other skills except through declared contracts. |
| Auditor skills | Cross-domain, read-only analysis (policy consistency, final verification, compliance diff). | Mutate project files. |
| Engine: static analyzers | Parse code, config, schemas, dependencies, and env usage without executing anything. | Execute or `require` project files. |
| Engine: probes | Observe HTTP and browser behavior per persona and environment, subject to safety classes. | Run mutating probes in production without permission. |
| Engine: evaluator | Evaluate controls and obligations with three-valued applicability; produce findings. | Call an LLM. |
| Engine: adapters | Translate capability operations into framework- or host-specific edits and facts. | Encode legal or policy logic. |
| Engine: evidence store and ledger | Store redacted, content-addressed evidence; record managed artifacts. | Store raw secrets or unredacted personal data. |
| Knowledge packs | Controls, obligations, authorities, vendor signatures, with versions and review dates. | Contain executable code other than references to named built-in evaluators. |

---

## 5. End-to-End Pipeline

### 5.1 Phases

Each phase has explicit inputs, outputs, a gate, and failure behavior. Phases are resumable (§11.10). The command column names the engine command an agent or CI calls. Agent-only phases have no command.

| # | Phase | Inputs | Outputs (artifacts) | Gate to proceed | On failure |
| --- | --- | --- | --- | --- | --- |
| P0 | **Intake and safety** | Repo path, optional URLs, `config.yaml`, invocation profile | `runs/<id>/state.json`, execution policy, environment list | Repo readable; execution policy resolved; working tree state recorded | Stop with instructions (for example "commit or stash changes first", or "no URL; runtime checks will be `UNKNOWN`") |
| P1 | **Static reconnaissance** (`recon --static`) | Source tree | Project, routes (declared), forms, schemas, dependencies, env usage, vendor signatures, auth/email/payment SDK usage, locale files, design-system sources | Coverage record written | Partial model; affected capabilities become `UNKNOWN` |
| P2 | **Runtime reconnaissance** (`observe`) | URLs per environment, personas | HTTP snapshots, crawl graph, raw vs rendered head, cookies, storage, network log per persona, screenshots, computed styles, axe results | At least the baseline persona completed on one environment, or an explicit "static-only" mode | Runtime-dependent controls become `UNKNOWN`; the report states this prominently |
| P3 | **Model assembly** (`model build`) | P1 and P2 evidence, owner config | Reality Model (entities and facts) | Schema-valid | Stop; this is an engine bug |
| P4 | **Classification** (agent + `model amend`) | Reality Model | `INFERRED` facts: route intent, data purposes, audience signals, message streams, vendor purposes | Every inference cites evidence and carries confidence | Unanchored inferences are rejected and retried once, then left `UNKNOWN` |
| P5 | **Scope resolution** (`scope resolve`) | Model, owner config, pack activation predicates | Active and candidate packs, owner `Question`s | No blocking question unanswered, or the owner chose "proceed with unknowns" | Continue with candidate packs in conditional mode (§9.2) |
| P6 | **Seal** (`model seal`) | Model at the current commit | Sealed model with hash | Commit and working-tree digest recorded | Cannot proceed to remediation |
| P7 | **Planning** (`plan --profile`) | Sealed model, capabilities, skill contracts, profile | Selected skills with reasons, skipped skills with `NOT_APPLICABLE` reasons, dependency DAG | DAG acyclic; every selected skill's inputs are producible | Report missing skills with install commands (§53.5) |
| P8 | **Specialist analysis** (skills + `evaluate`) | Sealed model, skill procedures | Findings, proposed remediations, owner questions, document drafts (not yet written) | All selected skills finished analysis | Failed skill: its findings are `UNKNOWN` with reason `SKILL_FAILED` |
| P9 | **Contradiction detection** (`contradictions`) | Declared-plane facts and all other planes | Contradiction findings | — | Degrades to deterministic contradictions only |
| P10 | **Consolidated plan and approval** | Findings and remediations | `plan.json`, and a human plan in the report format | Owner approval per remediation class, per the autonomy level (§31.4) | Audit-only report |
| P11 | **Remediation waves** (skills + `apply`, `ledger record`) | Approved change sets | File changes, ledger entries, snapshots | Each wave builds, lints, and tests (where available) and passes its wave verification | Repair once, then roll back the wave and mark findings `MANUAL_ENGINEERING_REQUIRED` |
| P12 | **Final verification** (`verify --final`) | Post-change build, fresh environments, all personas | Verification results, fresh evidence, re-evaluated findings | Every remediated finding re-evaluated with post-change evidence | Findings stay `FIXED_PENDING_VERIFICATION`; the launch state cannot be `TECHNICALLY_READY` |
| P13 | **Reporting and baseline** (`report`, `manifest`, `baseline propose`) | Everything above | `report.md`, `report.json`, `findings.sarif`, `launch-manifest.json`, proposed baseline | Report linter passes | Emit the report with linter violations listed (never silently) |

### 5.2 Data flow

```text
source ──► P1 static ─┐
                       ├─► evidence store ─► P3 model ─► P4 classify ─► P5 scope ─► P6 seal
URL ───► P2 runtime ──┘                                          ▲             │
                                                          owner answers        ▼
                                                                  │     P7 plan (DAG)
                                                                  │            │
                               ┌──────────── P8 specialists ◄─────┘            │
                               │                 │                             │
                               ▼                 ▼                             │
                       findings.json ◄──── P9 contradictions                   │
                               │                                               │
                               ▼                                               │
                       P10 consolidated plan ──approval──► P11 waves ──► re-recon of changed surfaces
                                                                │                  │
                                                                ▼                  ▼
                                                        P12 final verify (fresh contexts, all personas)
                                                                │
                                                                ▼
                                          P13 report · manifest · baseline · (later) compliance diff
```

### 5.3 The artifact bus (`.readyvibe/` in the target project)

```text
.readyvibe/
├── config.yaml          committed  owner facts, environments, execution policy, autonomy, targets (§31)
├── suppressions.yaml    committed  scoped, justified, expiring exceptions (§30.8)
├── reviews.yaml         committed  owner and legal review records (§32.3)
├── baseline.json        committed  accepted finding fingerprints and a fact digest (§38.3)
├── launch-manifest.json committed  last verified launch configuration snapshot (§30.5)
├── ledger.json          committed  artifacts created or managed by ReadyVibe (§28.4)
├── documents/           committed  structured sources for generated legal and trust documents (§15.3)
├── policies/            committed  document version records with effective dates (§41.6)
├── .gitignore           committed  ignores runs/ and cache/
├── runs/<runId>/        ignored    state, reality model, evidence index, artifacts, findings, plan,
│                                   change sets, verification results, reports
└── cache/               ignored    parsed-source cache, browser profile templates
```

**Why this split.** Everything that encodes a decision (owner facts, suppressions, reviews, baselines, managed-artifact records, document sources, policy versions) is committed, so it is reviewable in pull requests and survives across machines and CI. Everything that is an observation of a particular run is ignored by git, because even redacted runtime captures can contain personal or sensitive operational data, and because evidence is reproducible from the committed state plus the engine version.

### 5.4 Run identity

A run is identified by `runId = <UTC timestamp>-<short random>`. Its identity tuple is `(commit SHA, working-tree digest, engine version, pack versions, environment URLs, persona set)`. Two runs with the same tuple SHOULD produce identical deterministic findings. Differences are attributed to recorded runtime nondeterminism (§29.5) or to the target itself changing (for example, a production deployment between runs). The tuple also includes `evaluatedAsOf` (§8.12), so a run on a later date can legitimately differ when an obligation's effective or compliance date has passed. The report states such date-driven changes.

### 5.5 Interchange contract (normative)

The artifact bus is the only interface between skills, the engine, CI, and the owner. Its rules are independent of any particular skill, and Phase 0 ships them as a schema package and a validator (§42).

1. **Location.** Every artifact lives under `.readyvibe/`. Run artifacts: `runs/<runId>/<kind>.json`, or `.jsonl` for append-only logs. Committed artifacts use the fixed names in §5.3. Readers MUST reject any path that resolves outside `.readyvibe/`, including through symlinks.
2. **Envelope.** Every JSON artifact is an `ArtifactEnvelope` (§32.13): `schemaVersion`, `kind`, `producer` (name, version, type), `runId`, `createdAt`, `contentHash`, `data`, and optional namespaced `extensions`. A JSONL artifact starts with an envelope line (`data: null`, `format: "jsonl"`), followed by records validated against the kind's record schema. Owner-authored YAML (`config.yaml`, `suppressions.yaml`, `reviews.yaml`) carries `schemaVersion` and is validated, but it has no content hash because humans edit it.
3. **Validate on write and on read.** Writers validate before writing. Readers validate before use. An invalid artifact is rejected as a whole with a machine-readable error (`ARTIFACT_INVALID`, a JSON pointer, and the schema rule). It is never partially consumed.
4. **Versioning.** Same major: accepted. A newer minor than the reader knows: validated against the reader's latest known minor, with unknown `data` properties ignored and warning `ARTIFACT_NEWER_MINOR`. A different major: rejected with `ARTIFACT_MAJOR_UNSUPPORTED` and the `readyvibe migrate` command. Schemas are otherwise closed (`additionalProperties: false`), except `extensions`, which readers preserve on rewrite and never interpret.
5. **Integrity.** `contentHash` is the SHA-256 of the RFC 8785 canonical JSON form of `data`. A mismatch is rejected (`ARTIFACT_HASH_MISMATCH`). This catches hand edits of run artifacts.
6. **Atomic, single-writer updates.** Write to a temporary file in the same directory, flush, then rename. A run-level lock (`runs/<runId>/.lock`) serializes writers. Committed engine-managed artifacts (ledger, baseline, launch manifest) are changed only through engine commands.
7. **Status authority.** Artifacts that carry evaluation statuses (`findings`, `report`, `launch-manifest`, `baseline`) are valid only with `producer.type: ENGINE`. A skill-produced artifact containing a status is rejected (`ARTIFACT_STATUS_AUTHORITY`). Skills contribute facts (through amendments), change-set proposals, document sources, and questions.
8. **No secrets.** Validators scan artifact content with the secret-pattern set used by redaction (§7.3). A match is rejected (`ARTIFACT_CONTAINS_SECRET`), and the reported location is itself redacted.
9. **Degraded mode.** Without the engine, skills write the same envelopes with `producer.type: SKILL`. They are validated once the engine is available, and they can never contain statuses.
10. **Git.** `.readyvibe/.gitignore` is generated with exactly `runs/` and `cache/`, and the validator warns if run artifacts are tracked by git.
