# Part IV — Skills and Orchestration

> **SUPERSEDED / HISTORICAL DESIGN.** This describes an earlier CLI/engine platform architecture that was dropped. The current model is [`docs/current-model.md`](../../current-model.md).

## 10. Specialist Skills

### 10.1 How the taxonomy was decided

**Rule of division: one skill per owned artifact set.** A skill exists when it owns a distinct set of artifacts (models, documents, files, semantic keys) and a distinct set of controls. Two proposed skills that would co-own the same artifact are merged. One proposed skill that would own unrelated artifacts with different activation conditions is split. Every skill can run in `audit` mode, so no domain needs separate audit and remediation skills.

| Proposed in brief | Final | Reason |
| --- | --- | --- |
| launch-readiness-orchestrator / launch-readiness | `launch-readiness` | Single orchestrator skill |
| launch-all, compliance-all, discoverability-all, trust-all, admin-all | Same names, as **bundles** | Thin aliases selecting a profile of `launch-readiness` (§10.2) |
| site-reconnaissance | `site-reconnaissance` | Also owns route-intent classification, which SEO, security, and admin consume |
| — | `design-system-reconnaissance` | Required foundation for every visual skill (§51) |
| data-flow-mapper | `data-flow-mapping` | Public names describe activities |
| privacy-readiness | `privacy-readiness` | Owns privacy obligations not owned by a more specific skill: minimization, retention, URL and log PII, transfers, DPIA and RoPA triggers |
| legal-surface-consistency | `policy-consistency` | Owns declared-claim extraction and matching for all trust surfaces, not only legal pages |
| privacy-policy | `privacy-policy` | Also owns the cookie notice, as one owner for privacy-notice documents |
| terms-of-service | `terms-of-service` | Also owns acceptable-use, community guidelines, and refund/subscription terms sections, with facts from other skills |
| cookie-and-storage-audit / cookie-audit | `cookie-and-storage-audit` | Covers all client storage, not only cookies |
| consent-management / cookie-preferences | `consent-management` | Preferences UI and consent banner share one state and one owner |
| analytics-consent | `analytics-privacy` | Scope is broader than consent: provider configuration, PII in events, replay masking, and wiring analytics to the consent gate |
| third-party-data-exposure / third-party-privacy | `third-party-privacy` | Owns the vendor inventory and non-analytics vendor configuration |
| minor-and-age-readiness | `minors-readiness` | — |
| email-compliance | `email-compliance` | — |
| account-rights, delete-export-withdraw, data-rights | `data-rights` | One rights layer with one owner |
| accessibility-wcag, wcag-audit, accessibility-remediation | `wcag-readiness` | Audit and remediation are modes, not separate owners |
| internationalization, multilingual-legal-surfaces | `multilingual-readiness` | Legal translations are produced by the document owners. This skill owns locale completeness and language metadata. |
| rtl-readiness | `rtl-readiness` | Distinct CSS-wide visual work, activated only by RTL locales |
| seo-discoverability, search-indexability, metadata | `seo-readiness` | The same route metadata and head keys; splitting would create co-ownership |
| google-index-readiness | `search-console-readiness` | Needs external account authorization and runs post-deploy; covers Google and Bing |
| social-sharing-metadata | `social-sharing` | — |
| structured-data | `structured-data` | — |
| launch-identity | `launch-identity` | Also owns favicon, icons, and manifest |
| error-and-failure-surfaces | `error-pages` + `failure-resilience` | Route-level error surfaces versus in-app failure states touch different files and tests |
| public-contact-and-support | `public-support` | Also owns `security.txt` as a contact surface |
| footer-and-legal-navigation | `legal-navigation` | — |
| security-baseline | `web-security` | — |
| security-headers, dependency-security | Same | — |
| performance-web-vitals | `performance-readiness` | — |
| payments-and-commerce-readiness | `payments-readiness` + `subscription-readiness` | Different activation and different packs |
| final-launch-verification | `launch-verification` | — |
| admin-dashboard, admin-security/authz, admin-audit-log | `admin-dashboard`, `admin-authorization`, `admin-audit-log` | Authorization and audit logging are reusable without the dashboard |
| admin-user-management, content-management, privacy-tools, operational-tools | Modules | Implemented inside `admin-dashboard`, or contributed by the domain owner through the admin module contract (§52.12). Separate skills would split one UI across many owners. |
| — | `compliance-diff` | Change-impact analysis (§39) |
| — | `ai-features-readiness` | AI-specific obligations (§47) |
| — | `user-content-safety` | UGC obligations (§48) |
| dark patterns | No skill | Controls are owned by the domain whose UI it is and tagged `dark-pattern`. The report aggregates the tag (§49). |

### 10.2 Skill kinds

| Kind | Mutates project files | Examples | Notes |
| --- | --- | --- | --- |
| `BUNDLE` | Never | `launch-all`, `compliance-all` | ≤80 lines of instructions: pick a profile, bootstrap members, follow `launch-readiness`. CI rejects domain procedures in bundles. |
| `ORCHESTRATOR` | Only `.readyvibe/` | `launch-readiness` | Owns planning, questions, approvals, waves, reports. Evaluates no domain rules. |
| `FOUNDATION` | Never (only `.readyvibe/`) | `site-reconnaissance`, `design-system-reconnaissance`, `data-flow-mapping` | Produce shared models |
| `SPECIALIST` | Yes, within declared scope | Most skills | Own controls, remediation, and verification for a domain |
| `AUDITOR` | Never | `policy-consistency`, `launch-verification`, `compliance-diff` | Cross-domain, read-only; their findings are routed to owning specialists for remediation |

### 10.3 The shared skill contract

Every skill ships `contract.yaml` (validated against `schemas/skill-contract.schema.json`, full type in §32.7). The contract is the orchestrator's interface. `SKILL.md` is the agent's and the human's interface. They must agree, and CI checks key fields (name, version, visual flag, mutation scopes) for consistency.

```yaml
# skills/compliance/consent-management/contract.yaml
name: consent-management
version: 1.0.0
contract: 1
kind: SPECIALIST
category: compliance
visual: VISUAL_BEHAVIORAL          # NON_VISUAL | MOSTLY_NON_VISUAL | POTENTIALLY_VISUAL | VISUAL | VISUAL_CONTENT | VISUAL_BEHAVIORAL
engine: ">=1.0.0 <2.0.0"
purpose: Gate non-essential client technologies behind a real, accessible, recorded consent choice.
activation:                        # three-valued, evaluated by the planner
  any:
    - { capability: { id: HAS_NON_ESSENTIAL_CLIENT_TECH, allow: [PRESENT, SUSPECTED] } }
    - { fact: { predicate: declarations.kind, op: contains, value: CONSENT_UI } } # a banner exists and must be checked, or found unnecessary
consumes: [model.routes, model.runtime, inventory.storage, inventory.vendors, model.designSystem, model.locales, packs.active]
produces: [consent.config, consent.gate, consent.records]
controlsOwned: ["CONSENT.*"]
mutation:
  mayCreate: ["<adapter:consent-module-path>", "<adapter:component-dir>/consent/**"]
  mayModify:
    - { semanticKey: "script-init:vendor:*", when: "vendor.category in [ANALYTICS, ADVERTISING, SESSION_REPLAY, SOCIAL, EMBED]", coordinateWith: [analytics-privacy, third-party-privacy] }
    - { semanticKey: "layout:body-end:consent-root" }
  mustNotModify: ["documents.*", "footer.legalLinks", "headers.*"]
questions: [consent.regionalBehavior, consent.categoriesUsed]
verification:
  personas: [first-visit, reject-all, accept-analytics-only, accept-all, withdraw, returning-visitor, keyboard-only, screen-reader-semantics]
  probes: [browser.freshContext, browser.networkTimeline, browser.storageTimeline, a11y.dialog, keyboard.walk]
failure:
  onVerificationFail: repair-once-then-rollback
  onMissingInputs: report-unknown
legalReviewTriggers: ["EU-EPRIVACY.*:purpose-disputed", "*:consent-mode-pings", "US-CA-CCPA.*:is-sale-or-share"]
bundles: [launch-all, compliance-all, trust-all]
```

**Phases.** Every non-bundle skill implements the same phase sequence. The orchestrator calls phases, and a standalone skill runs them itself.

```text
discover  → gather domain-specific facts not already in the model (via engine commands); write facts
analyze   → evaluate owned controls; produce findings; draft remediation proposals and questions
propose   → emit change-set proposals with remediation class, files, semantic keys, verification plan
remediate → (only if approved) apply change sets via adapters or agent edits; record in ledger
verify    → run the declared probes; re-evaluate owned controls with fresh evidence
report    → write the domain section artifact consumed by the report assembler
```

**Modes.** `audit` (discover and analyze), `plan` (plus propose), `remediate` (all phases, subject to approval). The default mode is `plan` unless the owner's autonomy setting says otherwise (§31.4).

**Standalone behavior.** When a specialist is invoked without the orchestrator (for example, a user installs only `consent-management`), it:

1. runs `readyvibe doctor`, and if the engine is unavailable, offers agent-only mode with the limits in §11.11;
2. checks whether a sealed Reality Model for the current commit exists; if not, runs the minimal engine reconnaissance its `consumes` list requires (`readyvibe recon --for consent-management`). The engine knows which detectors each artifact needs, so the skill never re-implements reconnaissance;
3. if a consumed artifact can only be produced by a skill that is not installed (for example `inventory.storage` classification from `cookie-and-storage-audit`), prints the exact install command and stops that part of the work with `UNKNOWN(reason = PRODUCER_SKILL_MISSING)`. It does not improvise the missing domain.

### 10.4 Catalog

Visual class key: **NV** non-visual, **MNV** mostly non-visual, **PV** potentially visual, **V** visual, **VC** visual and content, **VB** visual and behavioral.

| Skill | Category dir | Kind | Visual | Activation (summary) |
| --- | --- | --- | --- | --- |
| `launch-readiness` | core | ORCHESTRATOR | NV | Always, when invoked |
| `site-reconnaissance` | core | FOUNDATION | NV | Always |
| `design-system-reconnaissance` | core | FOUNDATION | NV | Any selected visual skill |
| `launch-verification` | core | AUDITOR | NV | Always, after remediation or when invoked alone |
| `compliance-diff` | core | AUDITOR | NV | On invocation (PRs, CI) |
| `data-flow-mapping` | compliance | FOUNDATION | NV | Any personal data suspected (forms, auth, storage, vendors) |
| `privacy-readiness` | compliance | SPECIALIST | MNV | Personal data present, or any privacy pack active or candidate |
| `cookie-and-storage-audit` | compliance | SPECIALIST | NV | Always (cheap; its absence evidence powers `NOT_APPLICABLE` elsewhere) |
| `consent-management` | compliance | SPECIALIST | VB | Non-essential client tech present or suspected, or a consent UI exists |
| `analytics-privacy` | compliance | SPECIALIST | NV | `HAS_ANALYTICS` or `HAS_SESSION_REPLAY` or `HAS_ADVERTISING` |
| `third-party-privacy` | compliance | SPECIALIST | MNV | Any third-party destination |
| `privacy-policy` | compliance | SPECIALIST | VC | Personal data processed, or a policy exists, or a pack requires notice |
| `terms-of-service` | compliance | SPECIALIST | VC | Accounts, commerce, UGC, or AI features; or a Terms page exists; or the owner requests it |
| `policy-consistency` | compliance | AUDITOR | NV | Any declared trust claim exists (policies, banners, badges, footer claims) |
| `minors-readiness` | compliance | SPECIALIST | PV | Audience assessment not `ADULT_ONLY`, or age collected, or a children's pack is candidate or confirmed |
| `email-compliance` | compliance | SPECIALIST | PV | Any email pathway |
| `data-rights` | compliance | SPECIALIST | VB | Rights obligations active, or rights promised in declarations, or accounts exist |
| `ai-features-readiness` | compliance | SPECIALIST | PV | `HAS_AI` |
| `user-content-safety` | compliance | SPECIALIST | VB | `HAS_USER_CONTENT` or `HAS_UPLOADS` with public visibility |
| `wcag-readiness` | accessibility | SPECIALIST | PV | Always (configurable target) |
| `seo-readiness` | discoverability | SPECIALIST | MNV | `HAS_PUBLIC_CONTENT` |
| `search-console-readiness` | discoverability | SPECIALIST | NV | `HAS_PUBLIC_CONTENT` and a production URL is known |
| `structured-data` | discoverability | SPECIALIST | NV | Public content of a type eligible for structured data, or existing JSON-LD |
| `social-sharing` | discoverability | SPECIALIST | PV | `HAS_PUBLIC_CONTENT` |
| `launch-identity` | launch-experience | SPECIALIST | V | Always |
| `error-pages` | launch-experience | SPECIALIST | V | Always |
| `failure-resilience` | launch-experience | SPECIALIST | V | Any client-side data fetching, forms, auth, or third-party dependency |
| `public-support` | launch-experience | SPECIALIST | VC | Always (contact paths are universal; content may be owner input only) |
| `legal-navigation` | launch-experience | SPECIALIST | V | Any legal or trust surface exists or is planned |
| `multilingual-readiness` | i18n | SPECIALIST | PV | `HAS_MULTIPLE_LOCALES`, or declared languages, or locale files |
| `rtl-readiness` | i18n | SPECIALIST | V | `HAS_RTL_LOCALE` |
| `web-security` | security | SPECIALIST | NV | Always |
| `security-headers` | security | SPECIALIST | NV | Always |
| `dependency-security` | security | SPECIALIST | NV | A dependency manifest exists |
| `performance-readiness` | performance | SPECIALIST | PV | `HAS_PUBLIC_CONTENT` or any runtime URL |
| `payments-readiness` | commerce | SPECIALIST | PV | `HAS_PAYMENTS` |
| `subscription-readiness` | commerce | SPECIALIST | VB | `HAS_SUBSCRIPTIONS` |
| `admin-dashboard` | admin | SPECIALIST | V | On invocation, or `HAS_ADMIN_SURFACE` within the admin profile |
| `admin-authorization` | admin | SPECIALIST | NV | `HAS_ADMIN_SURFACE` or `admin-dashboard` selected |
| `admin-audit-log` | admin | SPECIALIST | PV | Admin capabilities with auditable actions, or rights workflows needing records |
| `launch-all` | bundles | BUNDLE | — | Profile `full` |
| `compliance-all` | bundles | BUNDLE | — | Profile `compliance` |
| `discoverability-all` | bundles | BUNDLE | — | Profile `discoverability` |
| `trust-all` | bundles | BUNDLE | — | Profile `trust` |
| `admin-all` | bundles | BUNDLE | — | Profile `admin` |

### 10.5 Per-skill specifications

The format for each entry: **Purpose** · **Consumes → Produces** · **Controls** · **May modify** · **Must not** · **Verifies** · **Legal-review triggers**. "Model" artifacts live in the Reality Model. Artifacts are named as in §10.6.

#### Core

**`launch-readiness`**
- Purpose: turn "make this launch-ready" into a scoped, approved, verified run. Owns the run state machine, planning, owner questions, the consolidated plan, remediation waves, the repair loop, and report assembly.
- Consumes → Produces: all artifacts → `run.state`, `run.plan`, `run.questions`, `report.*`, `launch-manifest`.
- Controls: `RUN.*` (for example `RUN.COVERAGE_INSUFFICIENT`, `RUN.PACKS_STALE`).
- May modify: `.readyvibe/**` only. Must not: edit project files itself. All edits come from specialists.
- Verifies: that every remediated finding has post-change evidence. Legal-review triggers: aggregates those of others.

**`site-reconnaissance`**
- Purpose: establish project, deployment, environment, and route facts, run the baseline runtime observation, and classify route intent.
- Consumes → Produces: source, URLs, config → `model.project`, `model.deployment`, `model.environments`, `model.routes` (including intent), `model.runtime` (persona captures), `model.forms`, `model.auth`, `model.capabilities` (initial), `model.coverage`.
- Controls: `RECON.*` (for example `RECON.PRODUCTION_URL_UNKNOWN`, `RECON.ROUTE_UNREACHABLE`).
- May modify: nothing. Verifies: n/a. Legal-review triggers: none.

**`design-system-reconnaissance`**
- Purpose: discover the design language so visual skills reuse it (§51).
- Consumes → Produces: source, runtime computed styles and screenshots → `model.designSystem`, `ds.componentInventory`.
- Controls: `DS.*` (for example `DS.NO_TOKENS_FOUND`, `DS.EXISTING_TOKEN_CONTRAST_FAIL` routed to `wcag-readiness`).
- May modify: nothing.

**`launch-verification`**
- Purpose: final clean-state verification across all selected domains and personas, and launch-state computation. Also usable alone as "verify my site before launch".
- Consumes → Produces: sealed model, findings, change ledger → `verification.results`, re-evaluated findings, `launch.state`.
- Controls: `VERIFY.*` (for example `VERIFY.FIX_NOT_VERIFIED`, `VERIFY.REGRESSION`).
- May modify: nothing.

**`compliance-diff`**
- Purpose: explain what a code change means for privacy, consent, security, search, accessibility, identity, and documents (§39).
- Consumes → Produces: base and head models (static or runtime) → `diff.semantic`, `diff.implications`, PR-comment markdown.
- May modify: nothing.

#### Compliance

**`data-flow-mapping`**
- Purpose: inventory personal data. Covers what is collected, where, why (candidate purposes), where it goes, where it is stored, retention signals, and deletion behavior per store.
- Consumes → Produces: `model.forms`, `model.auth`, db schemas and migrations, API handlers, SDK calls, `model.runtime` → `model.data` (`dataElements`, `dataFlows`, `serverStores`).
- Controls: `DATA.*` (for example `DATA.UNCLASSIFIED_FIELD`, `DATA.PURPOSE_UNKNOWN`).
- May modify: nothing. Legal-review triggers: special-category data detected.

**`privacy-readiness`**
- Purpose: privacy obligations that do not belong to a more specific skill. Covers data minimization, retention enforcement, personal data in URLs, logs, and error payloads (first-party), infrastructure data facts, transfer questions, DPIA and RoPA triggers, and privacy-by-default settings.
- Consumes → Produces: `model.data`, `inventory.vendors`, `packs.active` → privacy findings, `privacy.retentionPlan` (proposals), `privacy.ropaDraft` (optional export).
- Controls: `PRIVACY.*`.
- May modify: first-party logging and redaction code, URL construction that embeds personal data, retention jobs (only with owner-approved retention decisions).
- Must not: vendor SDK configuration (owned by `analytics-privacy` or `third-party-privacy`), documents.
- Verifies: canary absence in first-party logs where log access exists; URL scans. Legal-review triggers: legal basis selection, transfers, DPIA necessity, special categories.

**`cookie-and-storage-audit`**
- Purpose: complete inventory and purpose classification of client-side storage.
- Consumes → Produces: `model.runtime`, vendor catalog, source → `inventory.storage` (classified `ClientStorageItem`s), `consent.categoryCandidates`.
- Controls: `STORAGE.*` (for example `STORAGE.UNKNOWN_PURPOSE`, `STORAGE.AUTH_COOKIE_ATTRIBUTES` handed off to `web-security`, `STORAGE.EXCESSIVE_EXPIRY`).
- May modify: nothing directly. Proposes changes to storage-setting code through the owning skill.
- Legal-review triggers: strict-necessity disputes.

**`consent-management`** (full contract in §10.3; architecture in §13)
- Purpose: real consent where required, and removal proposals where a banner is unnecessary.
- Produces: `consent.config`, `consent.gate`, `consent.records`, consent UI.
- May modify: the consent module and components, vendor init call sites (coordinated), layout mount point.
- Must not: documents, footer link group, headers.

**`analytics-privacy`**
- Purpose: analytics, advertising, and session-replay behavior. Covers provider configuration (IP handling, advertising features, user-ID usage, retention where configurable in code), PII in events and URLs sent to analytics, replay masking, and wiring each provider through `consent.gate`.
- Consumes → Produces: `model.analytics`, `inventory.vendors`, `consent.gate`, canary results → analytics findings, `analytics.config` proposals.
- Controls: `ANALYTICS.*`.
- May modify: analytics, advertising, and replay SDK init and config files; event-tracking call sites (to remove PII).
- Must not: the consent module, non-analytics vendors.
- Legal-review triggers: advertising data sharing ("sale/share" analysis), consent-mode pings.

**`third-party-privacy`**
- Purpose: the vendor inventory and data egress for every non-analytics third party (fonts, CDNs, embeds, maps, chat, CAPTCHA, error monitoring, auth, storage, AI transport, email transport). Covers necessity, self-hosting options, embed facades, and error-monitoring scrubbing.
- Consumes → Produces: `model.runtime`, static SDK usage, vendor catalog → `inventory.vendors` (authoritative), vendor findings.
- Controls: `VENDOR.*`.
- May modify: non-analytics vendor init and config, font loading (self-hosting), embed components (facades).
- Must not: analytics vendors, CSP.
- Legal-review triggers: transfers, controller/processor role questions.

**`privacy-policy`** (§15)
- Purpose: the Privacy Policy and cookie notice, compiled from facts.
- Consumes → Produces: `model.data`, `inventory.vendors`, `inventory.storage`, `rights.matrix`, `consent.config`, `model.locales`, `model.identity`, pack `disclosures.yaml` → `documents.privacy-policy.<locale>`, `documents.cookie-notice.<locale>`, `claims.generated`.
- Controls: `PPOLICY.*` (for example `PPOLICY.REQUIRED_DISCLOSURE_MISSING`, `PPOLICY.UNRESOLVED_PLACEHOLDER`).
- May modify: the document sources in `.readyvibe/documents/privacy-policy/**` and the rendered page route (via adapter).
- Must not: publish a right, vendor, or retention claim not bound to a fact.
- Legal-review triggers: every generated legal document version before first publication; translations.

**`terms-of-service`** (§15.8)
- Purpose: Terms and related contractual surfaces (acceptable use, community guidelines, subscription and refund terms, AI output terms), compiled from product facts and owner decisions.
- Produces: `documents.terms.<locale>`, `documents.acceptable-use.<locale>`, `claims.generated`.
- Controls: `TERMS.*` (for example `TERMS.TEMPLATE_FOREIGN_PRODUCT`, `TERMS.ELIGIBILITY_CONTRADICTS_AUDIENCE`).
- Legal-review triggers: governing law, dispute resolution, liability, warranties, always.

**`policy-consistency`** (§27)
- Purpose: extract anchored claims from every declaration surface and match them against reality. Owns claim extraction and policy drift detection.
- Consumes → Produces: all rendered trust surfaces, existing documents, UI copy, metadata, email templates → `claims.declared`, contradiction findings (routed to owners), `policy.drift`.
- Controls: `CLAIMS.*`.
- May modify: nothing.

**`minors-readiness`** (§14)
- Purpose: audience assessment and age-related safeguards, proportionate to identified requirements.
- Produces: `model.audience`, `minors.safeguardPlan`.
- Controls: `MINORS.*`.
- May modify: age-screening flow (only when required and approved), default settings for child users, geolocation and profiling toggles for child segments.
- Must not: add date-of-birth collection unless an approved requirement exists.
- Legal-review triggers: almost all applicability conclusions; parental-consent method.

**`email-compliance`** (§16)
- Purpose: every email pathway. Covers stream classification, permission capture, unsubscribe, suppression enforcement in the send path, sender identification, and DNS authentication checks.
- Produces: `email.streams`, `email.suppressionModel`.
- Controls: `EMAIL.*`.
- May modify: send-path code, unsubscribe endpoint and page, preference center, email template footers, newsletter form permission controls.
- Legal-review triggers: mixed-purpose messages; soft opt-in reliance.

**`data-rights`** (§17)
- Purpose: the unified rights-request layer, account deletion, export, correction, opt-outs, and consent withdrawal integration.
- Produces: `rights.matrix` (per right: `VERIFIED`, `PLANNED`, `ABSENT`, `NOT_REQUIRED`), `rights.deletionPlan`, rights endpoints and UI, the admin module for rights requests.
- Controls: `RIGHTS.*`.
- May modify: backend deletion and export executors, account settings UI, rights request form, admin rights module (via module contract).
- Legal-review triggers: retention exceptions, identity verification standard for non-account requesters.

**`ai-features-readiness`** (§47)
- Purpose: AI-specific transparency, data flows to AI vendors, key exposure, abuse and cost controls, automated-decision questions.
- Controls: `AI.*`.
- May modify: AI call sites (moving keys server-side, adding rate limits and auth checks), in-product AI disclosure UI.
- Legal-review triggers: significant automated decisions; AI Act transparency scope.

**`user-content-safety`** (§48)
- Purpose: reporting, moderation, blocking, enforcement, appeals, and visibility defaults for UGC.
- Controls: `UGC.*`.
- May modify: report buttons and flows, moderation queue (via admin module), visibility defaults.
- Legal-review triggers: DSA and OSA service classification.

#### Accessibility

**`wcag-readiness`** (§18)
- Purpose: WCAG 2.2 AA (default) evaluation and remediation of existing and new surfaces, including the compliance surfaces.
- Produces: `a11y.evaluation` (per-criterion coverage), findings.
- Controls: `A11Y.*`.
- May modify: markup and styles of any component, only for accessibility findings, through the design-system change ladder. Token changes are proposals routed as `Decision`s.
- Must not: redesign; add ARIA where native HTML works.

#### Discoverability

**`seo-readiness`** (§20)
- Purpose: crawlability, indexability, canonicalization, sitemap, robots, titles, descriptions, and hreflang.
- Produces: `seo.routePolicy` (per route: index/noindex, canonical, sitemap inclusion), `sitemap`, `robots`.
- Controls: `SEO.*`.
- May modify: head keys `title`, `meta:description`, `link:canonical`, `meta:robots`, `link:alternate:hreflang`; `robots.txt`; sitemap generation; redirect rules for canonical host and trailing slash (via hosting adapter, coordinated with `security-headers` for shared config files).

**`search-console-readiness`** (§20.11)
- Purpose: verification token placement, sitemap submission, URL inspection guidance, and index-status reporting.
- Produces: `gsc.status`.
- Controls: `GSC.*`.
- May modify: head key `meta:google-site-verification` (and Bing equivalent), with an owner-supplied token.
- Requires: owner action for DNS verification and OAuth.

**`structured-data`** (§21.4)
- Purpose: JSON-LD derived from visible content and owner facts; validation of existing JSON-LD.
- Controls: `SD.*`.
- May modify: head or body key `jsonld:<type>:<routeTemplate>`.
- Must not: invent ratings, reviews, prices, authors, events, or business details.

**`social-sharing`** (§21.2)
- Purpose: Open Graph and platform card metadata; share images from real brand assets.
- Controls: `SOCIAL.*`.
- May modify: head keys `meta:og:*`, `meta:twitter:*`; OG image routes or assets.

#### Launch experience

**`launch-identity`** (§21.5)
- Purpose: consistent product and operator identity; favicon, icons, manifest (only when useful), theme color; template residue removal.
- Produces: `model.identity`.
- Controls: `IDENTITY.*`.
- May modify: icon assets, `link:icon*`, `link:apple-touch-icon`, `link:manifest`, `meta:theme-color`, `meta:application-name`, the manifest file, and residue strings in non-document surfaces.
- Must not: legal documents (it reports residue there to the document owner).

**`error-pages`** (§22)
- Purpose: 404, 500, 403, 401, maintenance, and offline surfaces with correct HTTP semantics.
- Controls: `ERRORS.*`.
- May modify: framework error routes and boundaries, hosting not-found configuration (via adapter).

**`failure-resilience`** (§22.6)
- Purpose: in-app behavior under API failure, slow networks, rate limits, expired sessions, missing assets, and unavailable third parties.
- Controls: `RESILIENCE.*`.
- May modify: data-fetching error, loading, and empty states; form submission states; environment validation.

**`public-support`** (§21.7)
- Purpose: legitimate contact paths (support, privacy, security, legal, abuse) and `/.well-known/security.txt`.
- Controls: `SUPPORT.*`.
- May modify: contact or support page, `security.txt`. Never invents contact details.

**`legal-navigation`** (§21.8)
- Purpose: the footer's legal and trust link group, and other legal navigation entry points.
- Controls: `LEGALNAV.*`.
- May modify: semantic key `footer:legal-links` and `nav:legal`. Links only to routes that exist and return 200.

#### Internationalization

**`multilingual-readiness`** (§19)
- Purpose: locale inventory, completeness per surface and locale (including trust surfaces), `lang`, locale routing and persistence, fallbacks, and formatting.
- Produces: `model.locales` (authoritative), `i18n.completenessMatrix`.
- Controls: `I18N.*`.
- May modify: `html:lang`, locale routing configuration, message catalogs (adding keys, never inventing legal translations), the language selector.

**`rtl-readiness`** (§19.5)
- Purpose: correct RTL rendering (`dir`, logical properties, mirroring, bidi isolation, fonts).
- Controls: `RTL.*`.
- May modify: `html:dir`, component styles (physical-to-logical property conversion), icon mirroring.

#### Security

**`web-security`** (§23)
- Purpose: an OWASP ASVS-aligned baseline. Covers secrets, authentication, authorization (non-admin), input handling, CSRF, CORS, rate limiting, uploads, redirects, SSRF, logging of secrets, error disclosure, and session cookie attributes.
- Controls: `SEC.*`.
- May modify: server handlers and middleware, cookie-setting code, BaaS rules and policies (as migrations, never applied to production automatically), environment variable declarations (names only).
- Must not: rotate secrets (owner action); apply database migrations to shared environments.

**`security-headers`** (§23.8)
- Purpose: CSP (data-driven, report-only first), HSTS (staged), and other headers; HTTPS and mixed content.
- Consumes: final `inventory.vendors`, `consent.config`, and post-consent runtime captures.
- Controls: `HEADERS.*`.
- May modify: header configuration (hosting adapter or framework middleware), semantic keys `header:*`.

**`dependency-security`** (§23.10)
- Purpose: known vulnerabilities, abandoned or risky packages, install scripts, lockfile hygiene.
- Controls: `DEPS.*`.
- May modify: manifests and lockfiles for patch and minor upgrades with verification. Major upgrades are proposals only.

#### Performance

**`performance-readiness`** (§24)
- Purpose: Core Web Vitals readiness (lab) and field data where available; loading hygiene.
- Controls: `PERF.*`.
- May modify: image attributes and formats, font loading, script loading strategy for first-party scripts, caching headers (coordinated with `security-headers` for shared files).

#### Commerce

**`payments-readiness`** (§25)
- Purpose: payment integration safety (integration mode, webhook verification, idempotency, failure handling, receipts, PCI scope indicators).
- Controls: `PAY.*`.
- May modify: webhook handlers, payment error states, removal of client-exposed secret keys (keys moved to server env; rotation is an owner action).

**`subscription-readiness`** (§25.6)
- Purpose: recurring billing disclosures, cancellation parity, trials, billing management, dunning.
- Controls: `SUBS.*`.
- May modify: pricing and signup disclosure UI, cancellation entry points, billing portal links.
- Legal-review triggers: auto-renewal law specifics, refund entitlements.

#### Admin

**`admin-dashboard`**, **`admin-authorization`**, **`admin-audit-log`**: see §52 for full specifications.

### 10.6 Ownership matrix

Every artifact and every shared semantic key has exactly one owner. Other skills may **request** a change to an artifact they do not own by emitting a `ChangeRequest` addressed to the owner (§11.6). The orchestrator routes it.

**Model and inventory artifacts**

| Artifact | Owner | Main consumers |
| --- | --- | --- |
| `model.project`, `model.deployment`, `model.environments`, `model.routes` (incl. intent), `model.forms`, `model.auth`, `model.runtime` | `site-reconnaissance` | Everyone |
| `model.designSystem`, `ds.componentInventory` | `design-system-reconnaissance` | Visual skills |
| `model.data` | `data-flow-mapping` | privacy-*, data-rights, admin, ai |
| `inventory.storage` | `cookie-and-storage-audit` | consent, privacy-policy, analytics |
| `inventory.vendors` | `third-party-privacy` | privacy-policy, security-headers, consent, analytics |
| `model.analytics` classification | `analytics-privacy` | consent, privacy-policy |
| `model.audience` | `minors-readiness` | privacy-policy, terms, admin, consent |
| `model.locales` | `multilingual-readiness` | all content-producing skills, seo |
| `model.identity` | `launch-identity` | documents, social, seo, email |
| `consent.config`, `consent.gate` | `consent-management` | analytics, third-party, security-headers, privacy-policy |
| `rights.matrix` | `data-rights` | privacy-policy, admin |
| `email.streams` | `email-compliance` | privacy-policy |
| `claims.declared`, `policy.drift` | `policy-consistency` | Document owners, orchestrator |
| `seo.routePolicy` | `seo-readiness` | social-sharing, structured-data, error-pages |
| `admin.capabilities`, admin IA | `admin-dashboard` | admin-authorization, admin-audit-log |
| `admin.authzPolicy` | `admin-authorization` | admin-dashboard, web-security |
| `audit.eventModel` | `admin-audit-log` | admin-dashboard, data-rights |

**Shared semantic keys in project files** (the adapter locates them per framework, §34)

| Semantic key | Owner |
| --- | --- |
| `head:title`, `head:meta:description`, `head:link:canonical`, `head:meta:robots`, `head:link:alternate[hreflang]` | `seo-readiness` |
| `head:meta:og:*`, `head:meta:twitter:*` | `social-sharing` |
| `head:link:icon*`, `head:link:apple-touch-icon`, `head:link:manifest`, `head:meta:theme-color`, `head:meta:application-name` | `launch-identity` |
| `head:script[type=application/ld+json]:<type>` | `structured-data` |
| `head:meta:viewport` | `wcag-readiness` (zoom must not be disabled) |
| `head:meta:google-site-verification`, `head:meta:msvalidate.01` | `search-console-readiness` |
| `html:lang` | `multilingual-readiness` |
| `html:dir` | `rtl-readiness` (or `multilingual-readiness` when no RTL locale exists and `dir` is simply `ltr`) |
| `header:content-security-policy*`, `header:strict-transport-security`, `header:x-content-type-options`, `header:referrer-policy`, `header:permissions-policy`, `header:x-frame-options` | `security-headers` |
| `header:x-robots-tag` | `seo-readiness` |
| `header:cache-control` for static assets | `performance-readiness` |
| `redirect:canonical-host`, `redirect:trailing-slash` | `seo-readiness` |
| `redirect:https` | `security-headers` |
| `route:not-found`, `route:error`, `route:maintenance` | `error-pages` |
| `route:privacy`, `route:cookies` | `privacy-policy` |
| `route:terms`, `route:acceptable-use`, `route:legal-notice` | `terms-of-service` |
| `route:accessibility` (accessibility statement) | `wcag-readiness` |
| `route:contact`, `route:support`, `file:/.well-known/security.txt` | `public-support` |
| `route:unsubscribe`, `route:email-preferences` | `email-compliance` |
| `route:account/delete`, `route:account/export`, `route:privacy-request` | `data-rights` |
| `route:admin/**` shell and IA | `admin-dashboard` |
| `footer:legal-links`, `nav:legal` | `legal-navigation` |
| `layout:body-end:consent-root` | `consent-management` |
| `script-init:vendor:<id>` | `analytics-privacy` (analytics, ads, replay) or `third-party-privacy` (others). Gating is always requested from `consent-management` through `consent.gate`. |
| `file:robots.txt`, `sitemap:*` | `seo-readiness` |
| `file:manifest.webmanifest` | `launch-identity` |

**Shared files** (for example `next.config.js`, `vercel.json`, `app/layout.tsx`, `index.html`) are never owned by a skill. Only semantic keys within them are owned. The adapter performs key-scoped edits and the engine serializes writes (§28.4).

### 10.7 Visual specialist registry

| Visual class | Skills | Design-system discovery dependency |
| --- | --- | --- |
| `VISUAL` | admin-dashboard, launch-identity, error-pages, failure-resilience, legal-navigation, rtl-readiness | Required |
| `VISUAL_CONTENT` | privacy-policy, terms-of-service, public-support | Required |
| `VISUAL_BEHAVIORAL` | consent-management, data-rights, subscription-readiness, user-content-safety | Required |
| `POTENTIALLY_VISUAL` | wcag-readiness, minors-readiness, email-compliance (unsubscribe page), multilingual-readiness (selector), social-sharing (OG images), ai-features-readiness (disclosure UI), payments-readiness (error states), performance-readiness (image changes), admin-audit-log (viewer) | Required only if the planned change set touches UI; the planner checks the change set's `visualChanges` flag |
| `MOSTLY_NON_VISUAL` | seo-readiness, privacy-readiness, third-party-privacy (embed facades are visual and flip the flag) | Same rule as above |
| `NON_VISUAL` | site-reconnaissance, design-system-reconnaissance, data-flow-mapping, cookie-and-storage-audit, analytics-privacy, policy-consistency, web-security, security-headers, dependency-security, search-console-readiness, structured-data, launch-verification, compliance-diff, admin-authorization | Not required |

### 10.8 Control id namespaces

Each skill owns one or more namespaces, and CI enforces that a control's `ownerSkill` owns its namespace prefix: `RUN`, `RECON`, `DS`, `VERIFY`, `DATA`, `PRIVACY`, `STORAGE`, `CONSENT`, `ANALYTICS`, `VENDOR`, `PPOLICY`, `TERMS`, `CLAIMS`, `MINORS`, `EMAIL`, `RIGHTS`, `AI`, `UGC`, `A11Y`, `SEO`, `GSC`, `SD`, `SOCIAL`, `IDENTITY`, `ERRORS`, `RESILIENCE`, `SUPPORT`, `LEGALNAV`, `I18N`, `RTL`, `SEC`, `HEADERS`, `DEPS`, `PERF`, `PAY`, `SUBS`, `ADMIN`, `ADMINAUTHZ`, `AUDIT`.

---

## 11. Orchestrator

### 11.1 Responsibilities

The orchestrator is split between the `launch-readiness` skill (agent-facing procedure) and the engine's planner and run-state machine (deterministic parts).

| # | Responsibility | Deterministic part (engine) | Agent part (skill) |
| --- | --- | --- | --- |
| 1 | Inspect the project | `recon`, `observe` | Choose environments; ask for URLs if missing |
| 2 | Establish the Reality Model | `model build`, `model seal` | Classification tasks (anchored) |
| 3 | Determine unknowns | `model unknowns` | Prioritize and phrase questions |
| 4 | Classify the application | Capability derivation, complexity tier | Confirm ambiguous intent with the owner |
| 5 | Select relevant specialists | `plan --profile` (activation predicates) | Explain selections and skips |
| 6 | Skip irrelevant specialists | Records `NOT_APPLICABLE` with coverage | — |
| 7 | Execute in dependency order | DAG and waves | Execute each skill's procedure |
| 8 | Merge findings | Fingerprint dedupe, obligation attachment | — |
| 9 | Detect contradictions | Deterministic contradiction rules | Claim extraction (via `policy-consistency`) |
| 10 | Coordinate shared implementation | Write serialization, semantic-key locks, change requests | Resolve semantic conflicts or escalate |
| 11 | Trigger verification | `verify` per wave and final | Interpret failures, attempt repair |
| 12 | Rerun failed checks | Re-evaluation of affected controls | Decide repair or rollback |
| 13 | Produce the final report | `report`, `manifest` | Write the executive summary in plain language, subject to the report linter |

### 11.2 Planning and selection

```text
inputs: sealed model, capabilities, active/candidate packs, profile, installed skills, config overrides
for each skill contract in the catalog:
    if profile excludes the skill                    → skip(reason = OUT_OF_PROFILE)
    a = eval3(contract.activation)
    if a = FALSE                                    → skip(reason = NOT_APPLICABLE, evidence = coverage)
    if a = UNKNOWN                                  → select in AUDIT mode; add questions that would resolve it
    if a = TRUE                                     → select in configured mode
    if selected and not installed                   → missing(install command)
    if contract.visual requires DS and DS not selected → add design-system-reconnaissance
    for each consumed artifact: add its producer (transitively)
build DAG from produces/consumes; reject cycles (CI guarantees none exist in the catalog)
```

**Profiles** (selected by bundles or `--profile`):

| Profile | Includes (subject to activation) |
| --- | --- |
| `full` | All skills |
| `compliance` | Foundations, `data-flow-mapping`, `privacy-readiness`, `cookie-and-storage-audit`, `consent-management`, `analytics-privacy`, `third-party-privacy`, `privacy-policy`, `terms-of-service`, `policy-consistency`, `minors-readiness`, `email-compliance`, `data-rights`, `ai-features-readiness`, `user-content-safety`, `subscription-readiness` (disclosure controls only), `wcag-readiness` (scoped to compliance surfaces), `legal-navigation`, `launch-verification` |
| `discoverability` | Foundations, `seo-readiness`, `search-console-readiness`, `structured-data`, `social-sharing`, `launch-identity`, `error-pages` (404 semantics), `multilingual-readiness` (hreflang inputs), `performance-readiness` (read-only), `launch-verification` |
| `trust` | Foundations, `privacy-policy`, `terms-of-service`, `consent-management` (where needed), `legal-navigation`, `public-support`, `launch-identity`, `error-pages`, `policy-consistency`, `multilingual-readiness` (trust surfaces), `wcag-readiness` (scoped to trust surfaces), `launch-verification`. Inventory skills it depends on are pulled in automatically in `audit` mode. |
| `admin` | Foundations, `admin-dashboard`, `admin-authorization`, `admin-audit-log`, `data-rights` (admin module only, if rights exist), `web-security` (scoped to admin routes), `wcag-readiness` (scoped to admin routes), `launch-verification` |

**Scoped inclusion.** A profile can include a skill with a scope filter (for example `wcag-readiness{routes: surfaceKind in [LEGAL_*, CONSENT_*]}`). The skill then evaluates its controls only over those scope units, and the report states the scope.

### 11.3 Dependency graph (Decision D-11)

Dependencies are derived from `consumes` and `produces`, exactly like a build system. Skill-to-skill dependencies are never hand-written in the orchestrator. This is what enforces the required orderings:

| Required ordering | Enforced because |
| --- | --- |
| Data-flow mapping before the Privacy Policy | `privacy-policy` consumes `model.data` |
| Cookie detection before consent | `consent-management` consumes `inventory.storage` |
| Analytics discovery before analytics-consent configuration | `analytics-privacy` consumes `model.analytics` (engine detectors) and `consent.gate` |
| Locale discovery before translated legal planning | Document skills consume `model.locales` |
| Route discovery before the sitemap | `seo-readiness` consumes `model.routes` |
| Search-intent classification before indexability decisions | `seo-readiness` consumes `model.routes.intent` from `site-reconnaissance` |
| Rights promises not in the policy before workflows exist | `privacy-policy` consumes `rights.matrix`. A rights clause can bind only to `VERIFIED` rights, or to `PLANNED` rights behind a **publish gate** that blocks publication of the document version until the rights workflow passes verification (§15.5). |
| Security headers after the external-resource inventory | `security-headers` consumes the final `inventory.vendors` and the **post-remediation** runtime capture for accept-all personas |
| Final verification after remediation | `launch-verification` consumes `ledger.final` |

Typical resulting DAG (full profile, SaaS example):

```text
                         site-reconnaissance
          ┌───────────────┬──────┴─────────┬──────────────────┬──────────────────┐
          ▼               ▼                ▼                  ▼                  ▼
 design-system-recon  data-flow-mapping  cookie-and-storage  third-party-privacy  multilingual-readiness
          │               │                │                  │                  │
          │               ├──────► privacy-readiness          │                  │
          │               │                ▼                  │                  │
          │               │        consent-management ◄───────┤                  │
          │               │                ▼                  │                  │
          │               │        analytics-privacy          │                  │
          │               ▼                                   │                  │
          │        data-rights ──► rights.matrix              │                  │
          │               │                ▼                  ▼                  ▼
          │               └──────────────► privacy-policy / terms-of-service ◄───┘
          │                                ▼
          │                        policy-consistency ──► contradictions
          ▼                                ▼
 error-pages · launch-identity · social · structured-data · seo-readiness · legal-navigation · wcag-readiness
                                           ▼
                            security-headers · performance-readiness
                                           ▼
                                  launch-verification
```

### 11.4 Phases, barriers, and waves

1. **Global discovery barrier.** All selected skills run `discover` and `analyze` before any skill runs `remediate`. Discovery-before-remediation therefore holds system-wide, not just per skill. It also lets the orchestrator show one consolidated plan.
2. **Consolidated plan and approval (P10).** Findings, change sets, questions, and decisions are presented together (§30.2 "plan view").
3. **Remediation waves.** Approved change sets are grouped into waves by DAG depth of the artifacts they modify. Typical wave contents:

| Wave | Purpose | Typical skills |
| --- | --- | --- |
| W1 Behavior | Make the product do the right thing | web-security, dependency-security (patches), admin-authorization, data-rights (backend), email-compliance (suppression enforcement), analytics-privacy (PII removal), third-party-privacy (vendor removal, self-hosting, scrubbing), minors-readiness (defaults), ai-features-readiness (key relocation, rate limits) |
| W2 Controls | Give users real controls | consent-management, data-rights UI, email unsubscribe and preferences, subscription cancellation paths, user-content-safety reporting, admin-dashboard, admin-audit-log |
| W3 Content | State the truth | privacy-policy, terms-of-service, public-support, multilingual content, rtl-readiness |
| W4 Presentation | Make it discoverable and polished | error-pages, failure-resilience, launch-identity, social-sharing, structured-data, seo-readiness (after all new routes exist), legal-navigation (after documents exist), wcag-readiness (after new surfaces exist) |
| W5 Hardening | Derived from the final inventory | security-headers (CSP report-only, then enforce), performance-readiness |

4. **After each wave:** build, lint, and test (where the project has them and execution policy allows), targeted re-reconnaissance of touched surfaces, a new sealed model revision, and wave verification of the findings addressed in the wave.
5. **Final verification (P12)** by `launch-verification` from a clean state.

### 11.5 Write coordination

- Each change set declares its **write set**: files and semantic keys.
- Within a wave, change sets with disjoint write sets may be applied in any order. Overlapping write sets are applied sequentially in DAG order. Each subsequent change set is regenerated or re-applied against the latest file content (semantic-key upserts make this safe, §28.4).
- The engine holds a lock per semantic key during `apply`, so two agent sessions cannot interleave edits to the same key.

### 11.6 Conflict resolution

| Level | Example | Resolution |
| --- | --- | --- |
| **Ownership** (static) | Two skills want to write `head:title` | Impossible by construction: one owner per key. Others emit a `ChangeRequest` (for example, `multilingual-readiness` asks `seo-readiness` for localized titles). |
| **Textual** (dynamic) | Two change sets touch `app/layout.tsx` at different keys | Sequential key-scoped application. If the adapter cannot perform a key-scoped edit (unusual file structure), the second change set is regenerated by its skill against the new content. |
| **Semantic** | `third-party-privacy` proposes removing Google Fonts, while `security-headers` built a CSP allowing `fonts.gstatic.com` | Prevented by ordering: CSP is derived in W5 from the post-remediation inventory. |
| **Policy** | `performance-readiness` wants to defer the chat widget; `consent-management` gates it behind consent; product needs chat on the support page | A `Decision` record with options, consequences, and a recommended option, surfaced to the owner. Default precedence when the owner has delegated decisions: **security and legal obligations > privacy minimization > user-facing functionality > accessibility-neutral performance > aesthetics**. Accessibility is never traded away for aesthetics (§51.8). |
| **Owner fact vs detected fact** | Owner says "no analytics", probe sees GA | Never resolved silently. It becomes a contradiction finding (§27). |

### 11.7 Retries and repair

```text
apply(changeSet) → build/lint/test → targeted verify
   ├─ all good → mark findings FIXED_PENDING_VERIFICATION (final verification promotes them)
   └─ failure
        ├─ build/test broken by this change set → one repair attempt by the owning skill
        │     ├─ repaired → continue
        │     └─ not repaired → rollback change set (snapshot, §28.5); findings → MANUAL_ENGINEERING_REQUIRED
        │                        with the failure evidence attached
        └─ verification fails (fix did not work)
              ├─ one repair attempt with the verification evidence as input
              └─ still failing → keep changes only if strictly better and non-breaking (e.g., partial
                                 improvement) AND owner approved partial fixes; else rollback
```

Flaky verification (inconsistent results across three attempts) never counts as success. It yields `UNKNOWN(reason = FLAKY)`, and the orchestrator reports it.

### 11.8 Stopping conditions

The run stops (successfully or not) when any of these holds:

1. **Fixed point:** no approved change set remains, and the last full evaluation produced no new actionable findings.
2. **Blocked on the owner:** every remaining actionable finding needs owner input or legal review. The run ends with a questions list.
3. **Budget:** configured limits reached (waves, repair attempts, wall-clock, or probe count). The report shows what remained.
4. **Safety stop:** an action would violate the execution policy (for example, needing to run project scripts that are not allowed), or evidence suggests the target is production and a mutating probe would be needed.
5. **Integrity stop:** the working tree changed outside the run (the user edited files mid-run). The orchestrator pauses, re-seals, and asks before continuing.
6. **Breakage stop:** a rollback failed or the build is broken and cannot be restored. The orchestrator stops immediately and reports the snapshot to restore.

### 11.9 Owner questions

Questions are structured (`Question` in §32.9) and map to config keys, so answers persist in `config.yaml` with provenance.

- **Only ask what changes something:** a question must resolve an applicability `UNKNOWN`, supply a fact required for a mandatory surface, or choose between remediation options.
- **Batch and prioritize:** questions are grouped (identity, markets, audience, data decisions, email, commerce) and ordered by the number of blocking findings each resolves. The default batch is at most 7 questions at a time, and blocking questions come first.
- **Offer "I don't know":** every question has an "unsure" answer that leads to `LEGAL_REVIEW_REQUIRED` or stays `UNKNOWN`, never to a default guess.
- **Never ask for secrets in chat.** Credentials are configured as environment variable names in `config.yaml` (§31.3).

### 11.10 Run state machine and resumability

```text
CREATED → RECON_STATIC → RECON_RUNTIME → MODEL_BUILT → CLASSIFIED → SCOPED → SEALED → PLANNED
  → ANALYZED → CONTRADICTIONS_CHECKED → AWAITING_APPROVAL → REMEDIATING(wave n) → VERIFYING_FINAL
  → REPORTED → (BASELINE_PROPOSED)
any state → PAUSED(reason) → resume → same state
any state → STOPPED(reason)
```

State lives in `runs/<id>/state.json`. Every phase is idempotent: re-running a completed phase with unchanged inputs is a no-op, determined by input hashes. `readyvibe run resume` continues after interruptions such as agent context loss, a closed terminal, or waiting for owner answers across days. For long runs, the skill instructs the agent to re-read `state.json` and the plan rather than relying on conversational memory.

### 11.11 Agent-only degraded mode

If the owner declines engine installation or the engine cannot run:

- Skills follow the "manual procedure" sections in their `references/`, using agent tools (shell `curl`, the agent's browser tool) and saving raw outputs as `AGENT_OBSERVATION` evidence in the same schema.
- Confidence is capped at `HIGH`. Controls requiring `CONFIRMED` (most runtime consent, egress, and authorization controls) cannot `PASS`. They produce `WARNING(caveat = DEGRADED_COLLECTION)` at best.
- Launch state cannot exceed `CONDITIONALLY_READY`.
- The report's first paragraph states that the run was degraded.

### 11.12 Scaling to risk and complexity

The planner computes a **complexity tier** from capabilities. The tier sets default depth. It does not select rules; activation does that.

| Tier | Typical capabilities | Default depth |
| --- | --- | --- |
| T0 Static presence | Public content only; no forms or tracking | Foundations, identity, SEO, social, errors, a11y (sampled), security headers, performance. Privacy: storage audit only, which usually yields broad `NOT_APPLICABLE` with coverage. |
| T1 Interactive | Forms, newsletter, contact | + data-flow mapping, email, privacy notice, third parties |
| T2 Accounts | Auth, user data | + data rights, web-security depth (authorization tests), failure resilience |
| T3 High-risk | Payments, subscriptions, UGC, AI, minors, session replay, multiple jurisdictions | + commerce, UGC, AI, minors, deeper verification personas, legal review of documents |

The portfolio example from §1.4 finishes at T0 with a short report. The SaaS example is T3. This is how "a simple privacy-respecting portfolio stays simple" is implemented.
