# Part IX — Core Engines

## 27. Contradiction Detection

### 27.1 Idea

A contradiction is two facts about the same subject and predicate, from different planes, that cannot both be true. Because the Reality Model keeps every fact with its plane (D-03), contradiction detection is a uniform query plus a set of compatibility functions, not a pile of special cases.

```text
DECLARED (what the site says) ─┐
OWNER_ASSERTED ────────────────┤
                               ├──► normalize to Assertions ──► match subject/predicate ──► compatible? ──► no ──► CONTRADICTION finding
OBSERVED / IMPLEMENTED /       │                                                                   │
CONFIGURED (what it does) ─────┘                                                                   └─ unknown ──► UNVERIFIABLE_CLAIM finding
```

### 27.2 Declared claims

`policy-consistency` extracts claims from every declaration surface:

- legal and trust documents (Privacy Policy, cookie notice, Terms, accessibility statement);
- consent UI copy (banner, preferences);
- UI copy on trust-sensitive actions (deletion confirmation, unsubscribe confirmation, signup consent text, pricing and trial copy);
- marketing and trust badges ("GDPR compliant", "HIPAA compliant", "bank-level encryption", "we never sell your data", "no cookies");
- metadata (canonical host, `og:site_name`, language declarations, hreflang);
- footer claims ("English | العربية");
- email templates (sender identity, unsubscribe text);
- owner config (as `OWNER_ASSERTED`, not `DECLARED`).

```ts
interface DeclaredClaim {
  id: DeclaredClaimId;
  surface: SurfaceKind;
  locale: string;
  quote: DocumentQuoteEvidence;                // verbatim, validated (§7.7)
  kind: ClaimKind;
  assertion: Assertion;
  extractedBy: "DETERMINISTIC" | "SEMANTIC";
  confidence: Confidence;                      // of the interpretation, not the quote
}

interface Assertion {
  subject: string;                             // "vendor:google-analytics", "right:DELETION", "storage:*", "dataClass:IP_ADDRESS"
  predicate: string;                           // "used", "available", "category-only", "retention", "minimum-age", "sold"
  modality: "IS" | "IS_NOT" | "CAN" | "CANNOT" | "ALWAYS" | "NEVER" | "ONLY";
  value?: string | number | boolean | string[];
  scope?: { region?: string[]; audience?: string; condition?: string };
}
```

### 27.3 Claim kinds and matchers

| ClaimKind | Example | Matcher (against non-declared planes) |
| --- | --- | --- |
| `VENDOR_USE` | "We use Stripe and Plausible." / "We do not use Google Analytics." | Vendor inventory presence |
| `DATA_COLLECTION` | "We only collect your email." | Data inventory for the subject |
| `NO_COLLECTION_ABSOLUTE` | "We never collect IP addresses." | Application **and** infrastructure data facts (§12.8); unknown infrastructure → unverifiable |
| `COOKIE_CATEGORY_ONLY` | "We use only necessary cookies." | Storage inventory purposes |
| `NO_COOKIES` | "This site uses no cookies." | All client storage mechanisms (not just cookies, since the claim's spirit is usually tracking) → contradiction or a precise-wording note |
| `CONSENT_BEHAVIOR` | "Analytics runs only if you accept." | Consent verification timelines |
| `RIGHT_AVAILABLE` | "You can delete your account at any time in Settings." | Rights matrix plus mechanism route existence |
| `DELETION_SEMANTICS` | "Your data will be permanently deleted." | Deletion plan behaviors |
| `RETENTION_PERIOD` | "We delete logs after 30 days." | Retention facts (enforced mechanism) |
| `NO_SALE_SHARE` | "We do not sell or share your personal information." | Advertising vendors, data sent to ad networks, pack definitions → often `LEGAL_REVIEW_REQUIRED` rather than a plain contradiction |
| `AGE_LIMIT` | "Users must be 18 or older." | Signup flow (age handling), audience signals |
| `LANGUAGE_AVAILABILITY` | "Available in English and Arabic." | Completeness matrix |
| `SECURITY_CLAIM` | "All data is end-to-end encrypted." | Security facts; mostly unverifiable → `WARNING` |
| `COMPLIANCE_BADGE` | "GDPR compliant", "WCAG AA certified" | **Always** flagged: `CLAIMS.COMPLIANCE_BADGE` (`WARNING`, or `FAIL` if contradicted by open `FAIL` findings in that domain). The system never validates badges. |
| `CONTACT` | "Contact privacy@nova.example." | Address consistency across surfaces; mailbox existence is not probed |
| `LOCATION_OF_PROCESSING` | "Your data stays in the EU." | Vendor regions (owner-attested) and destinations |
| `PRICING_TERMS` | "Cancel anytime." / "No credit card required." | Subscription and checkout flow facts |
| `IDENTITY` | "Nova Labs Ltd." | Identity model and owner facts |
| `CANONICAL_HOST` | `<link rel=canonical href="http://localhost:3000/">` | Production origins |

### 27.4 Built-in contradiction rules (deterministic)

These do not need semantic extraction:

| Rule | Planes compared |
| --- | --- |
| Sitemap includes a route that requires authentication | DECLARED (sitemap) vs OBSERVED (auth probe) |
| Canonical or OG URL points to localhost, a preview host, or another domain | DECLARED (head) vs CONFIGURED (production origins) |
| A custom 404 renders but the status is 200 | IMPLEMENTED vs OBSERVED |
| The consent banner offers "Reject" but tracking still loads after rejection | DECLARED (UI) vs OBSERVED |
| A footer language switcher lists a locale whose trust surfaces are missing | DECLARED vs OBSERVED (completeness) |
| `html[lang]` differs from the detected content language | DECLARED vs OBSERVED |
| JSON-LD values differ from visible content | DECLARED vs OBSERVED |
| The manifest name, `og:site_name`, and title disagree | DECLARED vs DECLARED (identity surfaces) |
| Owner says "no analytics" but analytics is observed | OWNER_ASSERTED vs OBSERVED |
| Deletion UI says "permanent" but the implementation soft-deletes | DECLARED vs IMPLEMENTED |
| Terms say 18+ but signup has no age policy and content has child-directed signals | DECLARED vs IMPLEMENTED/INFERRED |

### 27.5 Output and resolution

A contradiction finding carries evidence from **both sides**: the quote with its location, and the behavior evidence. The remediation always offers the two truthful directions:

1. **Change the behavior** to match the statement (for example, implement deletion or gate analytics).
2. **Change the statement** to match the behavior (for example, disclose the analytics vendor).

The owner chooses. The system never recommends option 2 when the behavior itself fails an active obligation. In that case option 1 is required, and option 2 is shown only as an interim disclosure while the fix lands.

### 27.6 Unverifiable claims

Claims that cannot be checked against any plane ("industry-standard encryption", "we take privacy seriously", "we never share data with anyone" when server-side flows are not observable) produce `CLAIMS.UNVERIFIABLE` (`WARNING`, `TRUST_CONSISTENCY`) with guidance: make it specific and verifiable, remove it, or record owner attestation. Absolute claims ("never", "no", "all", "only") receive stricter treatment, because a single counterexample falsifies them.

### 27.7 Drift

The drift detector compares the facts snapshot of the last published document version with the current model and maps changed facts to dependent sentences through sentence-level provenance (§15.2). Output: `CLAIMS.POLICY_DRIFT` with affected sentences, changed facts, and a proposed new version. This runs in every audit and in the compliance diff.

---

## 28. Remediation Engine

### 28.1 Remediation types

| Type | Meaning | Approval default |
| --- | --- | --- |
| `AUTOMATIC_SAFE_FIX` | Mechanical, low-risk, reversible, with no business facts involved (a missing `lang` attribute where the locale is known, removing a duplicate meta tag, adding `rel="noopener"`, adding a favicon link to an existing asset) | Batch approval |
| `AUTOMATIC_WITH_VERIFICATION` | Implementable by the system, but behavior-changing, so runtime verification is required (consent gating, CSP report-only, sitemap generation, 404 semantics, deletion executor) | Per change set |
| `OWNER_INPUT_REQUIRED` | Needs facts or decisions only the owner has (operator name, retention period, support email, which www host) | Question |
| `LEGAL_REVIEW_REQUIRED` | Needs a legal conclusion (governing law, legal basis, a translated policy's validity) | Review record |
| `MANUAL_ENGINEERING_REQUIRED` | Too broad, risky, or architectural for automated change (migrating a SPA to SSR, rebuilding a deletion flow across five vendors without APIs, a major upgrade) | Plan and guidance only |

A single finding may need a sequence, for example `OWNER_INPUT_REQUIRED` (retention period) followed by `AUTOMATIC_WITH_VERIFICATION` (cleanup job).

### 28.2 Preconditions for any mutation

1. A sealed model for the current commit, with a matching working-tree digest (P2).
2. A clean working tree, **or** the owner explicitly accepted mutating a dirty tree. Pre-existing changes are then snapshotted separately and never mixed into ReadyVibe change sets.
3. Approval recorded for the change set's remediation class per the autonomy level (§31.4).
4. The change set's write set is within its skill's `mutation` scope (engine-checked against `contract.yaml`).
5. Any new dependency is justified in the change set (`newDependencies[]` with a reason and a license), and approved separately. The default preference is platform or framework features over new packages.

### 28.3 Capability operations

Remediation recipes are expressed as **capability operations**, which adapters implement per framework and host (§34, §35). This keeps rules framework-independent (P16).

| Operation | Examples of adapter implementations |
| --- | --- |
| `head.upsert(key, tag, scope)` | Next.js: `metadata`/`generateMetadata` export per route or layout · Astro: layout `<head>` slot or per-page frontmatter props · SvelteKit: `<svelte:head>` in the layout or page · Nuxt: `useHead`/`useSeoMeta` · Vite SPA: `index.html` (site-wide) plus the router's head manager (client-side, with a crawler-visibility warning) · Plain HTML: each file's `<head>` |
| `html.setAttr(lang|dir, value, scope)` | Root layout `<html>` · `index.html` · per-locale layout |
| `route.create(path, kind, component)` | Framework file routing conventions |
| `route.notFound.configure()` | Next `not-found` plus `notFound()` in dynamic segments · Astro `404.astro` · SvelteKit `+error.svelte` plus status · host 404 configuration for static sites |
| `headers.set(key, value, routeClass)` | Host config (`vercel.json`, `_headers`, `netlify.toml`, Workers response headers, nginx) or framework middleware, whichever the adapter selects as the single source |
| `redirects.add(from, to, status)` | Host or framework redirects |
| `sitemap.configure(source)` | Framework sitemap routes, integration plugins, or a build-time generator |
| `robots.configure(rules)` | Framework robots route or static file |
| `script.gate(vendorId, category)` | Wrap init in `consent.gate.whenGranted`, move script tags into the consent loader, or configure the tag manager's consent integration |
| `component.create(spec)` / `component.extend(name, variant)` | Following `conventions` from the design-system model |
| `env.declare(name, scope, validation)` | Env schema file (e.g., a zod env module), `.env.example` entry with an empty value, framework env typing. **Never writes values.** |
| `db.migration.create(sql or schema diff)` | New migration file in the project's migration tool. **Never applied automatically to shared environments.** |
| `job.schedule(name, cron, handler)` | Host cron config, framework scheduled functions, or the project's job runner |
| `text.replace(surface, fromQuote, to)` | Anchored replacement for residue or copy fixes, only on non-document surfaces (documents are compiled) |

Agents implement **semantic** changes (application logic, component internals, cross-file refactors) directly, and then register them through `readyvibe ledger record` with the semantic keys they touched (D-21). Both paths produce the same `ChangeSet` records.

### 28.4 Idempotency (Decision D-12)

- **Semantic keys** identify every managed artifact: `head:meta:og:image@route:/blog/[slug]`, `header:strict-transport-security@html`, `footer:legal-links`, `file:public/robots.txt`, `sitemap:primary`. Operations are **upserts by key**. Running twice changes nothing the second time.
- **The ledger** (`.readyvibe/ledger.json`, committed) records per key: owner skill, file, locator, content hash at write time, change set id, and run id.
  - If the current content hash equals the ledger hash, the artifact is still ReadyVibe-managed and may be updated by its owner.
  - If it differs, **the user edited it**. The artifact is treated as user-owned: the system proposes a diff and never overwrites silently (`LEDGER.USER_MODIFIED`).
  - If a managed key is missing from the file, the user removed it. The system asks before re-adding it and records "declined" if refused, so future runs don't keep re-adding it.
- **Marker comments** are used only where no semantic key can be located structurally, and they are minimal: `/* readyvibe:managed footer:legal-links */`. Generated files carry a header comment naming the source of truth (for example "generated from .readyvibe/documents/privacy-policy/source.en.yaml").
- **Single mechanism rule:** before creating a sitemap, favicon set, consent module, CSP header, or robots file, the adapter searches for existing mechanisms. If one exists, it is configured or adopted into the ledger, never duplicated (`*.DUPLICATE_MECHANISM` controls catch pre-existing duplicates).

### 28.5 Snapshots and rollback

- **Git-based by default:** before each wave, the engine records a snapshot commit object of the working tree without touching the user's index or branch (a stash-style commit object stored under `refs/readyvibe/snapshots/<runId>/<wave>`). Rollback restores the files in the change set's write set from the snapshot. No branch is created, and nothing is committed to the user's branch without consent.
- **Fallback:** a file-copy snapshot of the write set in `runs/<id>/snapshots/` when git is unavailable.
- **Commit policy:** the system never commits, pushes, or opens PRs unless the owner enables it (`autonomy.git: commit | pr`). With `pr`, each wave or domain becomes a reviewable commit with a message listing findings addressed.
- A snapshot ref is removed after the run is reported, unless `keepSnapshots` is set.

### 28.6 Change safety checklist (every change set)

1. Follows the framework conventions discovered by the adapter (file locations, routing, data-fetching patterns).
2. Follows the project style: the formatter is run if configured and allowed, and lint rules are respected.
3. Preserves architecture: no new state-management library, no framework swaps, no moved directories.
4. Preserves the design system (§51.6) for visual changes.
5. Adds no personal-data collection unless the change set declares it with a purpose. Any declared new `DataElement` triggers re-evaluation by `data-flow-mapping` and `privacy-readiness` (P10).
6. Adds no third-party requests unless declared. Declared vendors trigger inventory, consent, CSP, and policy re-evaluation.
7. Adds no secrets or values to files. Only env var names.
8. Includes tests where the project has a test setup and the change is behavioral (for example a unit test for the deletion executor and an integration test for unsubscribe suppression).
9. Declares its verification procedure.

After each wave: build, lint, tests (if the execution policy allows project scripts, §40.2), targeted re-reconnaissance, and wave verification. If anything breaks, the repair loop in §11.7 runs.

### 28.7 Placeholders and fabricated facts

Remediation never fills a required fact with a plausible value. The only allowed outputs for missing facts are typed placeholders (§15.4) and questions. The CI check `REMEDIATION.FABRICATED_FACT` scans generated content for patterns typical of invented facts (addresses, phone numbers, company suffixes, dates, durations, and currency amounts not bound to a fact) and fails the change set.

---

## 29. Verification Engine

### 29.1 Definition

Verification is **re-evaluating controls with fresh evidence** collected after changes. "Code was written" never counts. Only probe evidence collected after the change set was applied can move a finding to `VERIFIED_FIXED` (P18).

### 29.2 Probe catalog (engine)

| Probe | Captures |
| --- | --- |
| `http.fetch` | Status, headers, redirect chain, raw body |
| `http.unknownRoute` | Unknown-path behavior (§22.2) |
| `crawl.routes` | Link graph, reachable routes, sitemap reconciliation |
| `browser.freshContext` | New profile per persona, service workers cleared |
| `browser.networkTimeline` | Requests with timestamps relative to navigation and consent events |
| `browser.storageTimeline` | Cookie and storage writes over time with initiators |
| `browser.head` | Raw and rendered head snapshots |
| `browser.screenshot` | Viewports, themes, directions |
| `browser.computedStyles` | Style sampling for token conformance and contrast |
| `a11y.axe`, `a11y.dialog`, `a11y.formErrors`, `a11y.reflow`, `a11y.targets`, `a11y.auth` | §18.4 |
| `keyboard.walk`, `keyboard.widget` | §18.4 |
| `egress.canaries` | Canary search over captured traffic |
| `authz.matrix` | Direct requests per persona (§23.5, §52.15) |
| `email.lifecycle` | Mail catcher or sandbox checks (§16.5) |
| `rights.lifecycle` | Seeded export and deletion checks (§17.9) |
| `faults.inject` | Request interception matrix (§22.6) |
| `perf.lab` | Lab metrics (§24.2) |
| `csp.reportOnly` | Violation collection across personas (§23.8) |
| `dns.lookup` | TXT, SPF, DKIM, DMARC records |
| `tls.inspect` | Certificate and protocol facts |
| `external.searchConsole` | Authorized API calls (§20.11) |

### 29.3 Probe safety classes and environments

| Class | Examples | LOCAL | PREVIEW / STAGING | PRODUCTION |
| --- | --- | --- | --- | --- |
| `PASSIVE` | GET pages and assets, headers, DNS, TLS | ✓ | ✓ | ✓ |
| `INTERACTIVE_NON_MUTATING` | Consent clicks, navigation, typing without submitting, keyboard walks | ✓ | ✓ | ✓ (default on) |
| `SUBMITTING` | Submitting search or contact forms with canaries | ✓ | ✓ | Opt-in only (creates real submissions) |
| `MUTATING_TEST_DATA` | Creating synthetic accounts, subscribing canary emails, seeding data | ✓ | ✓ (with owner-configured seeding) | ✗ (unless explicitly enabled per class) |
| `DESTRUCTIVE_TEST_DATA` | Deleting synthetic accounts, deletion lifecycle | ✓ | ✓ | ✗ |
| `LOAD_SENSITIVE` | Rate-limit probing, fault injection at the server | ✓ | ✓ (bounded) | ✗ |

Every environment in `config.yaml` declares its kind and allowed classes. The engine refuses probes outside the allowance. It also refuses to treat an environment as non-production if its origin matches a configured production origin (a guard against mislabeling).

### 29.4 Personas

```ts
interface Persona {
  id: PersonaId;                        // "first-visit", "reject-all", "accept-analytics-only", "authenticated-user-a", "ar-rtl-mobile", …
  activation: PredicateNode;            // only when relevant: e.g., ar-rtl-mobile requires HAS_RTL_LOCALE
  context: {
    viewport: { width: number; height: number; deviceScaleFactor: number; mobile: boolean };
    locale?: string;                    // Accept-Language and URL locale
    colorScheme?: "light" | "dark";
    reducedMotion?: boolean;
    network?: "none" | "slow-3g" | "fast-3g" | "4g";
    gpc?: boolean;
    storageState?: "fresh" | { from: PersonaId } | { authenticatedAs: TestUserRef };
    userAgent?: "default" | "crawler:google" | "crawler:social";
    javascript?: boolean;               // false for crawler-perspective raw fetches
    region?: string;                    // regional-consent testing via test-only header, non-production only
  };
  script: PersonaStep[];                // e.g., consent actions, navigation, interactions
  canaries: boolean;
}
```

Standard personas (each activated only when relevant): first-time visitor, returning visitor, reject optional tracking, accept analytics only, accept all, withdraw consent, GPC enabled, logged-out user, authenticated user A and B, each admin role, minor or unknown-age path, each locale (including an RTL locale), mobile and desktop viewports, keyboard-only, reduced motion, dark theme, slow network, API failure, crawler perspective (no JS, crawler user agent), and social-crawler perspective.

### 29.5 Flakiness

Runtime evidence can vary (A/B tests, ads, time-based scripts, network timing). Each assertion-bearing probe runs at least twice by default (three times for consent and egress assertions). Outcomes:

- consistent → the evidence confidence is kept;
- inconsistent → `attempts` recorded, confidence ≤ `MEDIUM`, status at best `WARNING(caveat = FLAKY)`, and **never `PASS`**. A single observed pre-consent request in any attempt is enough for `FAIL`, because a leak that happens sometimes is still a leak.

### 29.6 Status transitions

```text
OPEN ──change set applied──► FIXED_PENDING_VERIFICATION ──fresh probe evidence: control PASS──► VERIFIED_FIXED
                                     │
                                     └── probe shows still failing ──► OPEN (with repair history)
VERIFIED_FIXED ──later run: control fails──► REGRESSED (baseline classification)
```

Final verification (`launch-verification`) runs everything from a clean state: a fresh build of the final tree (if execution policy allows) or the provided post-deploy URL, all activated personas, and all selected controls, including those that were `NOT_APPLICABLE`. This matters because remediation can itself introduce new technology (for example, a CMP vendor or a new font), which must be re-inventoried.

### 29.7 Verification plans

Each finding's remediation declares a `verificationProcedure` (probes, personas, assertions). `launch-verification` compiles the union into a verification plan, deduplicates probes (one browser session per persona serves many assertions), and records per-finding results with evidence links.

---

## 30. Reporting

### 30.1 Outputs

| File | Audience | Content |
| --- | --- | --- |
| `report.md` | Owner and team | Human report (§30.2) |
| `report.json` | Tools | Full findings, statuses, dispositions, coverage, launch state, pack versions (schema `report.schema.json`) |
| `findings.sarif` | Code scanning (GitHub and others) | Findings with source locations (security, accessibility, code-level privacy findings) |
| `junit.xml` | CI | One test case per blocking control and scope |
| `plan.md` | Owner (before remediation) | The consolidated plan view |
| `questions.md` | Owner | Open questions with the config keys they fill |
| `launch-manifest.json` | Auditable snapshot | §30.5 |
| `pr-comment.md` | Compliance diff in PRs | §39.5 |
| `evidence/index.jsonl` | Tools and reviewers | Evidence records (redacted) |
| `report.html` (future) | Owner | Navigable version with screenshots and preview cards |

### 30.2 Human report structure

```text
1.  LAUNCH STATE           one of four states, the definition box verbatim, what would change it
2.  EXECUTIVE SUMMARY      5–10 plain sentences: what this site is, what was checked (profile, packs, environments,
                           personas), the most important outcomes, what needs the owner, what needs counsel
3.  LAUNCH BLOCKERS        FAIL (blocking) and UNKNOWN (blocking) findings, ordered by priority
4.  LEGAL REVIEW REQUIRED  each item: question for counsel, facts gathered, packs and authorities, why automation stopped
5.  OWNER INPUT            open questions grouped, with the findings each unblocks
6.  DOMAIN SECTIONS        Privacy · Consent · Minors · Email · Data rights · Accessibility · Security · Search/SEO ·
                           Metadata & identity · Error surfaces · Internationalization · Performance (lab | field) ·
                           Commerce · Third parties · AI · User content · Admin · Choice architecture (tag view) ·
                           Policy consistency
                           Each: status counts; findings (title, status, severity, confidence, category, evidence
                           links, affected files/routes, remediation, verification result); NOT_APPLICABLE items
                           with the reason and coverage
7.  CHANGES MADE           change sets per wave, files, semantic keys, verification outcome, rollbacks
8.  VERIFICATION RESULTS   personas × environments matrix, flaky items, unverified fixes
9.  COVERAGE & LIMITS      routes/files/personas covered, blind spots, degraded modes, stale packs, what the system
                           did not check
10. SCOPE                  active / candidate / excluded / inactive packs with the facts that decided each; per pack:
                           review roll-up and counts of PROVISIONAL / REVIEWED / REVIEW_REQUIRED obligations;
                           evaluatedAsOf; UPCOMING obligations (dated), PENDING COMMENCEMENT (undated), ENDED
                           obligations (with end reason, e.g., vacated)
11. APPENDIX               vendor inventory, storage inventory, data inventory summary, route table, pack versions
```

"Not applicable" is displayed with pride, not buried. For example: "Consent banner: not needed. No non-essential storage or third-party requests were observed across 23 routes and 4 personas. Evidence: …"

### 30.3 Counts

Per domain and overall: `PASS`, `FAIL`, `WARNING`, `NOT_APPLICABLE`, `LEGAL_REVIEW_REQUIRED`, `UNKNOWN`, plus dispositions (suppressed, accepted risk, reviewed). Counts are shown per category (§8.2), so a missing favicon (`LAUNCH_QUALITY`) never sits in the same bucket as unlawful processing. **No percentage, no score, no grade** (D-14).

### 30.4 Launch states

Computed deterministically by `launch-verification`:

```text
BLOCKING SET = controls whose finding has (category ∈ config.blocking.categories AND severity ≥ config.blocking.minSeverity)
               OR controls explicitly listed in config.blocking.controls
               (defaults: LEGAL_REQUIREMENT, REGULATORY_GUIDANCE, TECHNICAL_SECURITY, ACCESSIBILITY_STANDARD,
                TRUST_CONSISTENCY at severity ≥ HIGH; plus SEO.PRODUCTION_NOINDEX, ERRORS.SOFT_404 for public sites,
                PPOLICY.UNRESOLVED_PLACEHOLDER, TERMS.UNRESOLVED_PLACEHOLDER)

BLOCKED                   ∃ finding in BLOCKING SET with status FAIL and disposition not in {ACCEPTED_RISK (owner-recorded,
                          unexpired)}
                          OR the run could not evaluate a majority of blocking controls (e.g., no runtime access at all)

CONDITIONALLY_READY       not BLOCKED, and ∃ blocking-set finding with status UNKNOWN, or a required launch surface is
                          waiting on owner input (placeholders, unanswered blocking questions), or fixes are
                          FIXED_PENDING_VERIFICATION, or the run was degraded. The report lists the exact conditions.

READY_WITH_REVIEW_ITEMS   not BLOCKED and no CONDITIONALLY_READY condition, and ∃ LEGAL_REVIEW_REQUIRED without a
                          ReviewRecord, or ∃ WARNING in the blocking categories, or ∃ candidate (unconfirmed) packs

TECHNICALLY_READY         none of the above: every selected, applicable check is PASS, NOT_APPLICABLE, or has a recorded,
                          unexpired disposition (review record or accepted risk), and final verification ran from a
                          clean state for the current commit
```

Every state is rendered with this definition box:

> **What this status means.** It summarizes the automated and guided checks selected for this run, evaluated against the listed packs at the stated versions, for commit `abc123`, on the listed environments, as of `2026-09-28`. *N* of the legal obligations evaluated are encoded under provisional (not yet professionally reviewed) rules. It is **not** a legal opinion, a certification, or a guarantee of compliance, accessibility conformance, security, or search indexing.

### 30.5 Launch manifest

A machine-readable snapshot of the verified launch configuration (committed, `PUBLIC` content only):

```ts
interface LaunchManifest {
  schemaVersion: "1.0";
  project: { productName: string; operatorName: string | null; productionOrigins: string[] };
  verification: { runId: string; commit: string; verifiedAt: string; engineVersion: string; launchState: LaunchState };
  packs: { id: PackId; version: string; activation: "CONFIRMED" | "CANDIDATE" | "EXCLUDED" }[];
  publicUrls: { sitemap: string | null; robots: string | null; privacy: string | null; terms: string | null; cookies: string | null; accessibility: string | null; securityTxt: string | null; support: string | null };
  languages: { locale: string; direction: "ltr" | "rtl"; trustSurfacesComplete: boolean }[];
  documents: { id: string; version: string; effectiveDate: string; contentHash: string; legallyReviewed: boolean }[];
  consent: { required: boolean; categories: string[]; configVersion: string | null; regional: boolean };
  vendors: { id: string; name: string; categories: string[]; consentCategory: string }[];
  analyticsProviders: string[];
  rightsRoutes: { right: string; mechanism: string; entry: string | null }[];
  contacts: { kind: "SUPPORT" | "PRIVACY" | "SECURITY" | "LEGAL" | "ABUSE" | "ACCESSIBILITY"; value: string }[];
  accessibilityTarget: string;
  securityHeaders: { csp: "ENFORCED" | "REPORT_ONLY" | "NONE"; hsts: string | null };
}
```

### 30.6 Report linter

Before any report is written, `report lint` checks agent-written prose (the executive summary and any narrative):

- **Banned phrases** (case-insensitive, all supported languages): "fully compliant", "GDPR compliant", "CCPA compliant", "WCAG compliant", "certified", "guaranteed", "legally safe", "100% secure", "no legal risk", "will be indexed", "will rank". Negated or quoted uses in finding explanations are allowed through an allowlist context.
- **Required statements:** the definition box; degraded-mode notice if applicable; stale-pack notice if applicable; coverage blind spots.
- **Every number in the summary** must match a count in `report.json`.
- **No finding may be summarized with a stronger status than its actual status** (for example, calling a `WARNING` "fixed").

Linter violations are fixed by the agent, or, if unresolved, printed at the top of the report. A report is never silently emitted with violations.

### 30.7 Shareable exports

`readyvibe report export --shareable` produces a version for sharing outside the team (for example, with counsel or an agency). It excludes `RESTRICTED` evidence, replaces `INTERNAL` source excerpts with file and line references (optional), and keeps screenshots only of public surfaces.

### 30.8 Suppressions and dispositions

```yaml
# .readyvibe/suppressions.yaml
- control: A11Y.CONTRAST_TEXT
  scope: { component: "src/components/marketing/HeroGradient.tsx" }   # or route, fingerprint, vendor, storage item
  kind: FALSE_POSITIVE            # FALSE_POSITIVE | ACCEPTED_RISK | DEFERRED
  justification: "Text sits on a solid #0B1220 panel; the scanner sampled the gradient behind it. Verified manually with the contrast checker."
  evidence: ["ev_3f2a…"]          # optional supporting evidence
  author: "owner@nova.example"
  createdAt: 2026-09-20
  expiresAt: 2027-03-20           # REQUIRED for ACCEPTED_RISK and DEFERRED; max 365 days; default 180
```

Rules:

- A suppression must name **one control** and a **specific scope** (fingerprint, route, component, vendor, storage item, or form). Wildcard controls (`A11Y.*`) and site-wide scopes are rejected by the schema.
- `LEGAL_REVIEW_REQUIRED` findings cannot be suppressed. They are resolved by `ReviewRecord`s in `reviews.yaml` (reviewer role, date, document or finding scope, outcome, notes). A review changes the disposition to `LEGAL_REVIEWED` and never changes the status.
- Expired suppressions reactivate their findings as `EXPIRED_SUPPRESSION` in the next run.
- A suppression that no longer matches any finding is reported as stale, for cleanup.
- Suppressions never hide **new** findings: a new fingerprint for the same control in another scope is a new finding.
