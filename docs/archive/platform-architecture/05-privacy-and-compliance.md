# Part V — Privacy and Compliance Domains

> **SUPERSEDED / HISTORICAL DESIGN.** This describes an earlier CLI/engine platform architecture that was dropped. The current model is [`docs/current-model.md`](../../current-model.md).

## 12. Privacy System

### 12.1 Scope and owners

| Concern | Owner |
| --- | --- |
| What personal data exists, where it flows, where it is stored | `data-flow-mapping` |
| Minimization, retention enforcement, first-party log and URL leakage, infrastructure data, transfers, DPIA and RoPA triggers | `privacy-readiness` |
| Client storage classification | `cookie-and-storage-audit` |
| Analytics, advertising, and replay behavior | `analytics-privacy` |
| All other vendors and data egress | `third-party-privacy` |
| Notices | `privacy-policy` |
| Rights | `data-rights` |

This section describes the shared data inventory and the privacy analysis built on it.

### 12.2 Data classes

`DataClass` is a closed, versioned taxonomy (`rules/taxonomy/data-classes.yaml`). Each class has a default sensitivity and default flags. Examples:

| Group | Classes | Default sensitivity |
| --- | --- | --- |
| Identity | `NAME`, `USERNAME`, `EMAIL`, `PHONE`, `POSTAL_ADDRESS`, `GOVERNMENT_ID` | PERSONAL (`GOVERNMENT_ID`: SENSITIVE) |
| Age | `DATE_OF_BIRTH`, `AGE`, `AGE_RANGE`, `AGE_ATTESTATION` | PERSONAL; CHILDREN if the subject may be a child |
| Account | `ACCOUNT_ID`, `PROFILE_FIELD`, `PREFERENCES`, `AUTH_CREDENTIAL`, `MFA_SECRET`, `SESSION_ID`, `SOCIAL_LOGIN_PROFILE` | PERSONAL; credentials CREDENTIAL |
| Device and network | `IP_ADDRESS`, `DEVICE_INFO`, `BROWSER_INFO`, `USER_AGENT`, `REFERRER`, `ANALYTICS_ID`, `ADVERTISING_ID`, `COOKIE_ID` | PERSONAL |
| Location | `APPROXIMATE_LOCATION`, `PRECISE_GEOLOCATION` | PERSONAL; precise location SENSITIVE |
| Content | `UPLOADED_FILE`, `PHOTO`, `VIDEO`, `AUDIO`, `MESSAGE`, `USER_POST`, `SUPPORT_MESSAGE`, `SEARCH_QUERY` | PERSONAL (may contain special categories) |
| Activity | `ACTIVITY_HISTORY`, `PURCHASE_HISTORY`, `TELEMETRY`, `ERROR_LOG_CONTEXT` | PERSONAL |
| Financial | `PAYMENT_METADATA`, `BILLING_ADDRESS`, `CARD_DATA` | FINANCIAL (`CARD_DATA` triggers PCI scope) |
| AI | `AI_PROMPT`, `AI_OUTPUT`, `AI_FILE_INPUT` | Inherits from contained content; PERSONAL by default |
| Special | `HEALTH`, `BIOMETRIC`, `RACE_ETHNICITY`, `RELIGION`, `POLITICAL`, `SEXUAL_ORIENTATION`, `TRADE_UNION`, `GENETIC`, `CRIMINAL` | SPECIAL_CATEGORY (always `LEGAL_REVIEW_REQUIRED` where privacy packs are active) |
| Children | Any class whose subject is `CHILD` | CHILDREN |

Packs may map classes to regime-specific categories (for example California "sensitive personal information") in `rules/packs/<pack>/mappings.yaml`. The base taxonomy stays jurisdiction-neutral.

### 12.3 Discovery methods

| Source | Method | Confidence |
| --- | --- | --- |
| Forms (static) | JSX/HTML parsing of inputs, `name`, `type`, `autocomplete`, label text, and validation schemas (zod, yup, valibot) linked to forms | HIGH |
| Forms (runtime) | Rendered form fields per route and persona, accessible names | CONFIRMED |
| Database schemas | Migrations (SQL, Prisma, Drizzle), Supabase schema dumps (from migrations in repo), Firestore rules and typed models, Mongoose schemas | CONFIRMED for existence; column-to-class mapping MEDIUM to HIGH |
| API handlers | Request body parsing, which fields are persisted or forwarded (taint-style data-flow from request to sink: DB write, vendor SDK, log call, response) | HIGH for direct flows; MEDIUM through helpers |
| Auth providers | OAuth scopes requested, profile fields stored | CONFIRMED (config), HIGH (storage) |
| Vendor SDK calls | Arguments passed to `identify`, `setUser`, `track`, `captureException`, AI SDK calls, email send calls | HIGH |
| Runtime egress | Canary matches in outbound requests | CONFIRMED |
| Infrastructure | Hosting adapter knowledge (documented access-log behavior), owner confirmation | MEDIUM until owner-confirmed |
| Declarations | Policy claims about collected data (for contradiction checks, not as a source of truth) | DECLARED plane |

The mapper sends each candidate element to classification. Deterministic rules come first: `autocomplete="email"` or a column named `email` of type text is `EMAIL`, HIGH. LLM classification handles the rest, anchored to the code location.

### 12.4 The per-element question checklist

For every `DataElement`, the privacy system answers the questions in the brief. Each answer is a `Tracked` field in §6.6, so unanswered questions are visible as `null` with `UNKNOWN` confidence.

| Question | Field | Resolved by |
| --- | --- | --- |
| Why is it collected? | `purposes` | LLM candidate (MEDIUM) → owner confirmation |
| Where is it collected? | `collectionPoints` | Static and runtime |
| Where is it sent? | `recipients`, `dataFlows` | Static taint and canary egress |
| Where is it stored? | `storage` | Schema and flow analysis |
| How long is it kept? | `retention` | TTLs, cleanup jobs, provider settings, owner policy |
| Who can access it? | Store `accessControl`, admin field exposure (§52) | RLS and rules analysis, admin model |
| Which vendor receives it? | `recipients.vendorId` | Egress and inventory |
| Can the user delete it? | `deletion` | Deletion plan (§17.5) |
| Can the user access or export it? | `exportable` | Export plan (§17.8) |
| Is collection necessary? | `necessity` | LLM candidate → owner; an unnecessary candidate triggers a minimization proposal |
| Is it exposed to analytics? | `exposure.inAnalytics` | Canaries, event payload inspection |
| Is it logged unintentionally? | `exposure.inLogs` | Static log-call analysis; runtime only where logs are accessible |
| Is it in URLs? | `exposure.inUrls` | Route patterns, query construction, runtime URL scan for canaries |
| Is it in error reports? | `exposure.inErrorReports` | SDK config (`sendDefaultPii`, `beforeSend`), canary-triggered errors in test env |
| Is it in third-party requests? | `exposure.inThirdPartyRequests` | Canaries |
| Is it in session replay? | `exposure.inSessionReplay` | Replay config and canary typed into masked and unmasked fields |
| Is the Privacy Policy accurate about it? | `disclosedInPolicy` | `policy-consistency` |

### 12.5 Unintended exposure controls (examples)

| Control | Detects | Typical remedy |
| --- | --- | --- |
| `PRIVACY.PII_IN_URL` | Personal data in paths or query strings (for example `/reset?email=`), which leaks through history, referrers, logs, and analytics | Move to POST bodies or opaque tokens |
| `PRIVACY.PII_IN_FIRST_PARTY_LOGS` | `console.log(req.body)`, logger calls with user objects | Structured logging with an allowlist and redaction |
| `ANALYTICS.PII_IN_EVENTS` | Canary or PII-like properties in analytics events, full URLs with tokens as page views | Property allowlist; URL sanitization before page-view capture |
| `ANALYTICS.REPLAY_CAPTURES_INPUT` | A canary typed into a field appears in the replay payload | `maskAllInputs`, block selectors for sensitive regions |
| `VENDOR.ERROR_MONITORING_PII` | Canary or auth headers in error-monitoring payloads | `sendDefaultPii: false`, a `beforeSend` scrubber, and request-body capture disabled |
| `SEC.TOKEN_IN_URL` (owned by `web-security`) | Reset or magic-link tokens in URLs that are then sent to third parties via the `Referer` header or analytics | Strict `Referrer-Policy` on token pages, single-use tokens, exclusion from analytics |
| `PRIVACY.REFERRER_LEAK` | Third-party requests carrying full URLs with personal data in `Referer` | Referrer policy and URL design |

### 12.6 Retention

Retention must be enforced, not only described.

- **Detected:** TTL indexes, `expires_at` columns with cleanup jobs (cron config, scheduled functions), object lifecycle rules (in IaC or config), provider retention settings (only when readable via credentialed API, otherwise owner-asserted), log retention (hosting adapter documentation plus owner confirmation).
- **Classified per store:** `EXPLICIT_TTL`, `SCHEDULED_CLEANUP`, `PROVIDER_SETTING`, `INDEFINITE`, `SOFT_DELETE_ONLY`, `OWNER_POLICY` (declared but not enforced), or `UNKNOWN`.
- **Controls:**
  - `PRIVACY.RETENTION_UNDEFINED`: `WARNING`, with an owner question.
  - `PRIVACY.RETENTION_CLAIM_UNENFORCED`: a contradiction when a policy states a period that no mechanism enforces. `FAIL` when the claim is specific ("we delete logs after 30 days").
  - `PRIVACY.SOFT_DELETE_ONLY`: records survive "deletion". Routed to `data-rights`.
- **Remediation:** retention jobs are generated only from owner-approved periods (`config.yaml: retention.<store>`). The system never picks a number. Where a legal minimum or maximum might apply (for example tax records), the question is marked `LEGAL_REVIEW_REQUIRED`.

### 12.7 Legal bases, transfers, DPIA, and RoPA

The system never decides these. It prepares them.

- **Legal-basis candidates** are produced per purpose, per active pack, with `requiresReview: true`. They feed the policy's placeholders, and they are not asserted until the owner or counsel confirms them in `reviews.yaml`.
- **Transfers:** vendor region facts come from the vendor catalog (cited provider documentation) and owner-confirmed account settings. The system produces a transfer inventory (from region, to region, vendor, data classes) and `LEGAL_REVIEW_REQUIRED` for the mechanism.
- **DPIA triggers:** obligations in packs map fact patterns (large-scale special categories, systematic monitoring, children's data with profiling, innovative technology such as AI) to `LEGAL_REVIEW_REQUIRED(reason = DPIA_ASSESSMENT)`.
- **RoPA draft:** optional export of a record-of-processing draft (`privacy.ropaDraft`, CSV/JSON) pre-filled from facts. Every field is labeled with provenance, and the draft is marked "draft, not reviewed".

### 12.8 Infrastructure data

Application code may never log an IP address while the host, CDN, or WAF does. The system:

- records hosting-adapter facts (`deployment.infrastructureLogging`) with citations to provider documentation, at `MEDIUM` confidence until the owner confirms their plan and settings;
- blocks generated notices from saying "we do not collect IP addresses" unless infrastructure facts support it (`CLAIMS.ABSOLUTE_NEGATIVE_UNSUPPORTED`);
- distinguishes `application-level` from `infrastructure-level` data in the data inventory and the policy.

---

## 13. Consent System

### 13.1 When consent machinery is considered

Consent is not a default feature. The decision flow:

```text
HAS_NON_ESSENTIAL_CLIENT_TECH?
 ├─ ABSENT (sufficient coverage)
 │     └─ banner exists? ── yes → CONSENT.UNNECESSARY_BANNER (WARNING, LAUNCH_QUALITY):
 │                                propose removal (owner-approved only), keep a minimal preferences
 │                                page only if a pack requires a notice of necessary storage
 │                         no  → consent controls NOT_APPLICABLE (evidence: coverage)
 ├─ UNKNOWN → UNKNOWN(reason = INSUFFICIENT_COVERAGE), with the actions that would resolve it
 └─ PRESENT / SUSPECTED
       └─ Do active obligations require prior consent for these categories?
            ├─ yes (e.g., EU/UK packs confirmed) → consent required for those categories
            ├─ opt-out regime (e.g., CCPA sale/share) → opt-out controls, GPC handling (§13.7)
            ├─ candidate packs only → conditional findings + scope questions
            └─ no active obligation → no legal requirement; still check TRUST controls:
                                      a banner claiming "Reject" must actually reject
```

Alternatives to consent are always considered before adding consent UI: removing an unnecessary vendor, self-hosting a font, or using a click-to-load facade for an embed. The plan presents them first, because the best consent banner is often the one that is not needed.

### 13.2 Consent state model

```ts
type ConsentCategory = "necessary" | "preferences" | "analytics" | "advertising" | "personalization" | "social_embeds" | "session_replay" | string; // project-declared extras allowed

interface ConsentState {
  schema: 1;
  id: string;                        // random, non-identifying (not a user id)
  version: string;                   // consent config version (categories + notice version)
  decidedAt: string | null;          // null = no decision yet
  source: "BANNER" | "PREFERENCES" | "GPC" | "DEFAULT" | "API";
  categories: Record<ConsentCategory, "granted" | "denied">; // "necessary" always granted
  region?: string;                   // only when regional behavior is enabled
}
```

Storage: a first-party cookie or localStorage key holding only this state, never personal data. The storage item itself is classified `CONSENT_STATE`. A server-readable cookie is used when server-side processing (server-side tagging, SSR personalization) must honor consent.

### 13.3 Purpose categories and mapping

`cookie-and-storage-audit` and `third-party-privacy` assign each storage item and vendor a `StoragePurpose`, and consent categories are derived from those purposes:

| StoragePurpose | Consent category |
| --- | --- |
| `STRICTLY_NECESSARY`, `SECURITY`, `AUTHENTICATION`, `CONSENT_STATE` | `necessary` (no consent) |
| `PREFERENCE`, `FUNCTIONALITY` | `preferences` (packs decide whether an exemption applies for user-requested preferences; otherwise consent) |
| `ANALYTICS`, `PERFORMANCE` | `analytics` |
| `ADVERTISING` | `advertising` |
| `PERSONALIZATION` | `personalization` |
| `SOCIAL` | `social_embeds` |
| `UNKNOWN` | **Never `necessary`.** It is treated as its most likely non-necessary category, and produces `STORAGE.UNKNOWN_PURPOSE` plus an owner question. |

Only categories actually used appear in the UI. A site with only analytics gets one toggle, not six.

### 13.4 The consent gate

**Decision.** Gating is implemented in code through a small consent module whose API every vendor initialization goes through. Alternatives were compared:

| Approach | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| `type="text/plain"` script rewriting with a CMP script | Works for inline tags | Misses npm SDKs, fragile with frameworks, and hides behavior from static analysis | Supported only when an existing CMP already uses it |
| Tag-manager consent mode only | Centralized | Only covers tags inside the tag manager; some modes still send pings before consent | Supported as an integration target, verified at runtime |
| Third-party CMP | Mature UI, records | Adds a vendor, often heavy, often misconfigured | Existing CMPs are **integrated and verified, not replaced**. A new CMP is proposed only by owner choice. |
| **First-party consent module plus gate API** | Explicit, statically analyzable, testable, no vendor, fits the design system | Must be built well | **Default for new implementations** |

Gate API (framework-neutral; adapters generate the idiomatic form):

```ts
interface ConsentGate {
  get(): ConsentState;
  has(category: ConsentCategory): boolean;
  /** Run init exactly once when category becomes granted; never before. */
  whenGranted(category: ConsentCategory, init: () => void | Promise<void>): void;
  /** Called when a category changes from granted to denied. Vendors register teardown. */
  onRevoked(category: ConsentCategory, teardown: () => void): void;
  open(): void;                                  // reopen preferences (footer link, settings page)
  set(update: Partial<ConsentState["categories"]>, source: ConsentState["source"]): void;
}
```

Static verification: `CONSENT.UNGATED_INIT` searches for vendor init calls of non-necessary vendors that are not inside `whenGranted` (AST match), in addition to the runtime tests. Teardown is vendor-specific, recorded in the vendor catalog. For example, a vendor offers an `opt_out_capturing` call, and first-party identifiers are deleted where the vendor documents them. Where a vendor cannot be stopped mid-session, withdrawal takes effect on reload, and the UI says so truthfully.

### 13.5 UI requirements

| Requirement | Control | Verified by |
| --- | --- | --- |
| No non-essential activation before a choice | `CONSENT.PRE_CONSENT_NONESSENTIAL` | Network and storage timeline (fresh context) |
| Reject is as easy as accept (same layer, equivalent prominence) where active packs require it | `CONSENT.REJECT_PARITY` | DOM: both buttons in the first layer; computed-style prominence ratio (size, contrast, weight) within a tolerance; click count |
| Granular choice when multiple categories are used | `CONSENT.GRANULAR_CHOICE` | DOM |
| No pre-ticked optional categories | `CONSENT.NO_PRESELECTION` | DOM state on first open |
| Withdrawal as easy as giving consent; a persistent reopen entry point | `CONSENT.WITHDRAW_ACCESSIBLE` | Footer or settings link exists and opens preferences; `legal-navigation` places it |
| Rejection actually blocks | `CONSENT.REJECT_BLOCKS_NONESSENTIAL` | Timeline after reject |
| Only selected categories activate | `CONSENT.CATEGORY_ISOLATION` | Timeline after "analytics only" |
| Withdrawal stops future processing | `CONSENT.WITHDRAWAL_EFFECTIVE` | Timeline after revoke, and after reload |
| Choice persists across pages and reloads, and is re-asked when the config version changes | `CONSENT.PERSISTENCE`, `CONSENT.REPROMPT_ON_CHANGE` | Multi-page navigation, reload, version bump |
| Accessible dialog: focus moved in, not trapped without a dismissal route, labelled buttons, keyboard operable, not obscuring focused content, announced | `A11Y.*` scoped to consent surfaces, plus `CONSENT.DIALOG_SEMANTICS` | Keyboard walk, dialog probe, axe |
| Localized in every served locale | `I18N.TRUST_SURFACE_COMPLETE` | Completeness matrix |
| No misleading copy ("We value your privacy" plus accept-only, confirmshaming, double negatives) | `CONSENT.COPY_CLARITY` (semantic, anchored) | Quote-anchored classification |
| Does not block the site behind a consent wall where packs prohibit it | `CONSENT.NO_COOKIE_WALL` (pack-dependent) | DOM: content inert until choice? |
| Server and client agree | `CONSENT.SERVER_HONORS_STATE` | Server-side tagging or SSR code reads consent; runtime check that server-side vendor calls do not happen for denied categories where observable |

### 13.6 Consent records

Where packs require the ability to demonstrate consent, or the owner opts in, the module records decisions to a first-party endpoint:

```ts
interface ConsentRecord {
  consentId: string;                 // same random id as ConsentState.id
  configVersion: string;             // which categories and notice text were shown
  noticeVersion: string;             // privacy/cookie notice version (§41.6)
  choices: Record<ConsentCategory, "granted" | "denied">;
  source: ConsentState["source"];
  recordedAt: string;
  locale: string;
  userId?: string;                   // only if logged in AND the owner chose to link records to accounts
}
```

The record deliberately excludes IP address and user agent by default. They are not needed to demonstrate which notice and choices were presented, and adding them would add personal data (P10). A pack or owner policy may require otherwise. That is then an explicit, disclosed configuration.

### 13.7 Regional behavior and opt-out signals

- **Default:** one behavior satisfying all confirmed packs (D-08).
- **Regional (opt-in):** requires a trusted region source from the hosting adapter (for example a platform geolocation header read server-side), a per-region configuration, and the most protective behavior when the region is unknown. The verification plan adds one persona per configured region, using a test-only header override that is supported only in non-production environments.
- **Global Privacy Control:** when an active pack treats GPC as a valid opt-out preference signal (for example California for sale or sharing), the module reads `navigator.globalPrivacyControl` and the `Sec-GPC` request header, applies the opt-out to the mapped categories, records `source: "GPC"`, and does not show an interstitial asking the user to override it. It may display that the signal was honored. Verified with a GPC-enabled persona.
- **"Do Not Sell or Share" and "Limit the Use of Sensitive PI" links** are produced by `data-rights` with `legal-navigation` placement, only when the California pack is confirmed and the relevant facts (sale or sharing, sensitive PI use) are `TRUE` or under legal review.

### 13.8 Verification protocol

Each step uses a **fresh browser context** (no storage, no cache, service workers unregistered) unless noted. It records the full network log and storage timeline with event markers. The protocol runs on each environment the owner provides, and at least on one environment with the production build.

| Step | Persona | Action | Assertions |
| --- | --- | --- | --- |
| 1 | `first-visit` | Load each sampled route template; wait for network idle plus a grace period; **no interaction** | No request to a non-essential vendor; no non-necessary storage written; the banner is visible if consent is required. Baseline recorded. |
| 2 | `reject-all` | Click the first-layer reject control | Same as step 1 after rejection, across further navigation (3+ pages); state recorded as denied |
| 3 | `reject-all` | Scroll, interact with embeds (facades), submit a synthetic search | No non-essential activation triggered by interaction |
| 4 | `accept-analytics-only` | Grant only analytics | Only analytics-category vendors activate; advertising, replay, and social stay silent |
| 5 | `accept-all` | Grant all | All used categories activate. This capture is the input for CSP construction (§23.8). |
| 6 | `withdraw` | From `accept-all`, reopen preferences, deny all | No new non-essential requests after withdrawal; vendor teardown executed; identifiers removed where documented; post-reload behavior matches step 2 |
| 7 | `returning-visitor` | Reload and navigate with the step-4 state | The banner is not shown again; state is honored on first paint (no flash-then-load) |
| 8 | `config-change` | Bump the consent config version | The banner is shown again; old grants do not silently carry over to new categories |
| 9 | `keyboard-only`, `screen-reader-semantics` | Operate the banner and preferences with the keyboard only | Reachable, visible focus, correct names and roles, no trap, Escape behavior defined, focus restored |
| 10 | `gpc-enabled` (if applicable) | GPC set | Opt-out applied to the mapped categories without a prompt |

Timing: "before consent" is measured against the recorded consent event timestamp, not wall-clock guesses. Requests initiated before the event but completed after it count as pre-consent.

---

## 14. Minors and Age System

### 14.1 Stance

Children's protection is not an age gate. An age gate can be the wrong tool (it creates data, encourages lying, and may be unnecessary), and its absence can be right. The module's job is to establish, with evidence, whether children are likely present, whether the service is directed to them, what the active packs require in that situation, and the least intrusive safeguards that meet it. Most conclusions in this domain are legal judgments, so `LEGAL_REVIEW_REQUIRED` is the expected outcome for ambiguous cases.

### 14.2 Audience assessment

`minors-readiness` produces `model.audience` from signals:

| Signal kind | Examples | Weight | Method |
| --- | --- | --- | --- |
| Owner declaration | "Our service is for 13+", "for schools" | Authoritative for intent, not for actual audience | Config |
| Subject matter and content | Cartoon games, homework help, toys, child-oriented activities | STRONG to MODERATE | Content classification, anchored to page quotes and screenshots |
| Visual and audio design | Animated characters, child models, child-oriented music | MODERATE | LLM on screenshots with evidence, capped at MEDIUM |
| Language level and marketing | "for kids", "ages 8–12", school-year references | STRONG | Text search plus anchored classification |
| Education context | LMS integration, class codes, teacher and student roles | STRONG | Static and runtime |
| Age data | DOB or age fields, grade fields | Actual-knowledge risk | Data inventory |
| Social features | Messaging, public profiles, UGC | Risk multiplier | Capabilities |
| Advertising directed at children | Ad placements on child-oriented pages | STRONG | Vendor inventory plus content |
| Empirical audience | Owner-provided analytics demographics, if any | STRONG | Owner fact |

Several packs define their own tests (for example, the COPPA factors for "directed to children" and the UK Children's Code "likely to be accessed by children"). Each pack's obligations reference the same signal facts through its own predicate. The system reports signals and per-pack assessments separately and never merges them into one "child score".

```ts
interface AudienceAssessmentPerPack {
  pack: PackId;
  question: "DIRECTED_TO_CHILDREN" | "LIKELY_ACCESSED_BY_CHILDREN" | "ACTUAL_KNOWLEDGE" | "MIXED_AUDIENCE";
  result: "YES" | "NO" | "UNCERTAIN";
  basis: FactId[];
  status: "OWNER_CONFIRMED" | "SYSTEM_ASSESSED" | "LEGAL_REVIEW_REQUIRED";
}
```

### 14.3 Decision matrix

| Situation | Default outcome |
| --- | --- |
| Owner: adult-only (e.g., 18+), no strong child signals | Check that Terms and signup agree (`TERMS.ELIGIBILITY_CONTRADICTS_AUDIENCE`). No age collection added. `MINORS.*` mostly `NOT_APPLICABLE` with the owner statement as evidence. |
| Owner: general audience, moderate child signals | `LEGAL_REVIEW_REQUIRED` for "likely accessed" or "directed" assessments under active packs; propose child-protective defaults that cost little (no precise geolocation by default, no profiling-based ads, minimal public profile exposure) |
| Owner: child-directed or education | Children's packs apply fully. Parental-consent needs are assessed per pack (`LEGAL_REVIEW_REQUIRED` for method), high-privacy defaults, advertising and profiling restrictions, age-appropriate transparency, admin minimization (§52.9). |
| Mixed audience | Neutral age screening **only where** a pack's mixed-audience handling calls for it and the owner approves, with the youngest segment getting protective defaults |
| Age collected without a stated need | `MINORS.AGE_DATA_UNNECESSARY` (`WARNING`): propose removal or replacement with a less intrusive signal (e.g., an age-range attestation), subject to owner decision |

### 14.4 Age-assurance ladder (least intrusive first)

1. **None needed**, with evidence (adult-only service with no child signals and consistent terms).
2. **Self-declaration via neutral age screen:** asks for age or birth date neutrally, does not signal the "right" answer, does not default to an adult age, does not let the user trivially retry after an under-age answer within the same session (where a pack's guidance calls for it), and stores the minimum (an age band or boolean, not the DOB, unless needed).
3. **Age estimation or verification via a provider:** only by owner decision with legal review. It introduces a vendor and sensitive processing, and the system surfaces those costs explicitly.
4. **Parental consent workflows:** only where required, with a method chosen by the owner and counsel from pack-listed methods. The system implements the chosen method's technical flow and records consents. It never picks a method autonomously.

Forbidden behaviors (in every relevant `SKILL.md` and as review checks): helping users circumvent age restrictions; adding DOB collection "for professionalism"; defaulting age inputs to an adult value; designing screens that coach users toward a qualifying answer; collecting more data for verification than the method needs.

### 14.5 Protective defaults (when children are in scope)

| Area | Default | Control |
| --- | --- | --- |
| Geolocation | Off by default; visible indicator when on; precise location avoided | `MINORS.GEOLOCATION_DEFAULT_OFF` |
| Profiling and personalization | Off by default for child segments | `MINORS.PROFILING_DEFAULT_OFF` |
| Advertising | No behavioral advertising to child segments | `MINORS.NO_BEHAVIORAL_ADS` |
| Public visibility | Profiles and content private by default | `MINORS.PRIVATE_BY_DEFAULT` |
| Communication | Messaging from strangers off by default; reporting and blocking available | `MINORS.CONTACT_RESTRICTIONS`, links to `UGC.*` |
| Nudges | No techniques encouraging weaker privacy settings or extended use | `MINORS.NO_PRIVACY_NUDGES` (shared detectors with §49) |
| Transparency | Age-appropriate explanations at the point of use | `MINORS.CHILD_FRIENDLY_NOTICE` (drafted, `LEGAL_REVIEW_REQUIRED`) |
| Retention | Shorter retention proposals for child data (owner decision) | `MINORS.RETENTION_REVIEW` |
| Parental data rights | Rights workflows accept verified parent requests where packs require | `RIGHTS.PARENT_REQUESTS` |

---

## 15. Legal Document System

### 15.1 Documents covered

| Document | Owner | Condition |
| --- | --- | --- |
| Privacy Policy | `privacy-policy` | Personal data processed (including infrastructure data), a notice obligation, or an existing policy |
| Cookie notice (section or page) | `privacy-policy` | Client storage exists that a pack requires disclosing |
| Children's privacy notice or section | `privacy-policy` (with `minors-readiness` facts) | Children in scope |
| Notice at collection (e.g., California) | `privacy-policy` | Pack confirmed |
| Terms of Service | `terms-of-service` | Accounts, commerce, UGC, AI outputs, or owner request |
| Acceptable use and community guidelines | `terms-of-service` (with `user-content-safety` facts) | `HAS_USER_CONTENT` |
| Subscription, billing, and refund terms | `terms-of-service` (with commerce facts) | Commerce present |
| Accessibility statement | `wcag-readiness` | Owner opts in, or a pack requires it (e.g., the EAA for in-scope services) |
| Legal notice or imprint | `terms-of-service` | Pack requires it (member-state overlays) |
| `security.txt` | `public-support` | Always recommended (not a legal document) |

### 15.2 Compilation, never templates

A document is **compiled** from facts:

```text
Reality Model facts ─┐
Owner facts ─────────┤
Pack disclosures.yaml (required elements per active pack) ─┐
Clause library (skill assets, CC0) ────────────────────────┤
                                                           ▼
                        1. REQUIRED ELEMENTS: union of required disclosure elements from active packs
                        2. CLAUSE SELECTION: for each element, select clauses whose `when` predicate is TRUE
                        3. FACT BINDING: bind clause slots to facts; unbound required slots → placeholders
                        4. DRAFTING: the agent writes connective prose in the project's voice, within the
                           bound facts (no new factual assertions allowed)
                        5. CLAIM EXTRACTION: every factual assertion in the draft is extracted and must
                           map to a bound fact or a clause-declared claim (engine check)
                        6. REVIEW STATES: owner input → legal review → approval
                        7. RENDER: into the site via the adapter and design system
```

The clause library is data, not boilerplate text to paste:

```yaml
# skills/compliance/privacy-policy/assets/clauses/vendors-analytics.yaml
id: pp.vendors.analytics
element: transparency.recipients
when: { capability: HAS_ANALYTICS }
slots:
  vendors: { from: "inventory.vendors[category=ANALYTICS]", required: true }
  purposes: { from: "vendor.purpose", required: true }
  consentDependency: { from: "consent.config.categories.analytics", required: false }
  retention: { from: "vendor.retentionSetting", required: false, placeholderIfMissing: true }
claims:                        # machine-checkable assertions this clause makes when rendered
  - { kind: VENDOR_USE, subject: "{{vendor.id}}", predicate: used-for, value: "{{vendor.purpose}}" }
  - { kind: CONSENT_DEPENDENCY, subject: "{{vendor.id}}", value: "{{consentDependency}}" }
text:
  en: "We use {{vendor.name}} to {{vendor.purposeText}}.{{#if consentDependency}} It runs only if you allow analytics.{{/if}}"
reviewNotes: "Retention wording depends on the provider configuration; confirm with the owner."
```

Sentence-level provenance is kept in the document source so the consistency checker (§27) and drift detector know exactly which facts each sentence depends on.

### 15.3 Document source format in the target project

```text
.readyvibe/documents/privacy-policy/
├── source.en.yaml        # sections → clauses → bound facts → rendered text, with sentence ids
├── source.ar.yaml        # per-locale variant; translation status per sentence
└── meta.yaml             # current version, publish gate status, review records, facts snapshot hash
```

The rendered page is generated into the project's routing (for example `app/(legal)/privacy/page.tsx` or `src/pages/privacy.astro`) through the adapter. It uses the design system's prose or typography components (§51). The page includes a stable anchor per section, the effective date, and a version identifier.

**Existing, human-written documents** are not replaced by default. The system ingests them as `DECLARED` claims (§27), reports missing required elements, contradictions, and residue, and offers to either patch specific sections (keeping the rest verbatim) or migrate to a compiled source. That is an owner decision.

### 15.4 Placeholders

Missing facts become typed placeholders:

```text
«rv:owner-input key="operator.legalName" reason="Operator legal name is required in the privacy notice by active packs"»
```

- The rendered site shows placeholders in non-production builds with a visible style. The control `PPOLICY.UNRESOLVED_PLACEHOLDER` (or `TERMS.*`) is a **launch blocker** if any placeholder would reach a production build.
- Placeholders map one-to-one to owner `Question`s. Answering the question fills every placeholder with that key.

### 15.5 Publish gate

A document version can be published only when:

1. no unresolved placeholders remain;
2. every claim maps to a fact at `HIGH` or better, or to an owner-asserted fact;
3. every rights claim binds to a `VERIFIED` right, or to a `PLANNED` right whose change set has passed verification;
4. every vendor claim matches the current `inventory.vendors`;
5. review states are satisfied: first publication of a compiled legal document requires a `ReviewRecord` of kind `LEGAL`, unless the owner explicitly records "published without legal review" (allowed but reported as `LEGAL_REVIEW_REQUIRED` with the owner's acknowledgement);
6. every served locale has a translation, or the locale explicitly falls back to a designated language with a notice, and the fallback is disclosed on the page (`I18N.SILENT_FALLBACK`, §19.3).

### 15.6 Template residue and foreign-product detection

Deterministic detectors:

- Placeholder patterns: `Your Company Name`, `[Company]`, `{{`, `Lorem ipsum`, `example.com` as a contact, `yourdomain`, `ACME`.
- Foreign identity: organization or product names in the document that differ from `model.identity` and appear in a public list of well-known services, or appear with "we" or "our" in LLM-extracted claims (anchored).
- Foreign features: clauses describing capabilities that are `ABSENT` (for example a "marketplace sellers" section when there are no sellers). Detected by claim matching.
- Stale dates: "Last updated" older than the policy's facts snapshot changes.

Outcomes: `TERMS.TEMPLATE_FOREIGN_PRODUCT` and `PPOLICY.TEMPLATE_RESIDUE` (`FAIL`, `TRUST_CONSISTENCY`).

### 15.7 Versioning and drift

- Each published version gets a record in `.readyvibe/policies/<doc>/<version>.json`: content hash, effective date, facts snapshot hash, review records, change summary, and the claims list (§41.6).
- **Drift detector** (`policy-consistency`): on every run and in the compliance diff, it recomputes the facts each published sentence depends on. A change produces `CLAIMS.POLICY_DRIFT` listing the affected sentences and a proposed update. APPROVED documents are never silently rewritten. A new draft version is proposed instead.
- Material changes (new vendor category, new purpose, new data class, new sharing) are flagged as `material: true`. Packs may require advance notice to users, which is surfaced as an owner or legal question, not auto-implemented.

### 15.8 Terms of Service specifics

Conditional sections, each with a `when` predicate and an owner-input or legal-review profile:

| Section | Condition | Facts bound | Owner or legal input |
| --- | --- | --- | --- |
| Eligibility | Always if Terms exist | `audience.ownerPolicy.minimumAge` | Age policy (owner); must agree with signup and audience (control) |
| Accounts | `HAS_AUTH` | Auth model | Suspension policy (owner) |
| Acceptable use | `HAS_USER_CONTENT`, `HAS_AI`, or `HAS_UPLOADS` | Content model | Rules (owner) |
| User content license and ownership | `HAS_USER_CONTENT` | Visibility defaults | License scope (legal) |
| Subscriptions, billing, renewals, cancellation, refunds, trials | `HAS_SUBSCRIPTIONS` or `HAS_PAYMENTS` | Commerce model (periods, cancellation path, trial length) | Refund policy (owner); consumer-law specifics (legal) |
| Third-party services | Vendors with user-visible roles (social login, payments) | Inventory | — |
| AI-generated content | `HAS_AI` | AI model | Output ownership and accuracy disclaimers (legal) |
| Prohibited conduct, suspension, termination | `HAS_AUTH` | — | Owner and legal |
| Warranties, disclaimers, liability, indemnity | Always if Terms exist | — | **Always legal** |
| Governing law, disputes | Always if Terms exist | Operator country | **Always legal**; never inferred |
| Changes to terms | Always | Versioning mechanism | Notice approach (owner and legal) |

The system drafts only the fact-bound, descriptive parts. Liability, warranty, indemnity, dispute, and governing-law sections are generated **as explicit placeholders with guidance**, not as text. This prevents an agent from producing plausible-looking legal language nobody reviewed.

### 15.9 Translation workflow

- Each locale variant is compiled from the same bound facts. Clause library text exists per language where contributed. Otherwise the agent translates, and each sentence is marked `MACHINE_TRANSLATED_UNREVIEWED`.
- A document with unreviewed machine-translated legal text produces `LEGAL_REVIEW_REQUIRED(reason = TRANSLATION_REVIEW)` and blocks the "fully bilingual" claim (`I18N.FULLY_BILINGUAL_CLAIM_UNSUPPORTED`).
- Which language version prevails in case of conflict is a legal question. The system does not add a precedence clause without legal input.

---

## 16. Email System

### 16.1 Discovery

- **Providers:** SDKs and APIs (for example Resend, SendGrid, Postmark, Mailgun, SES, Mailchimp, Brevo, Loops, ConvertKit), SMTP configuration, BaaS auth emails (Supabase and Firebase templates), and forms posting directly to provider list endpoints.
- **Send sites:** every call that sends a message, with its trigger (signup, reset, order, cron, admin action, campaign), template, recipients source, and whether a suppression check is on the path (static call-graph reachability).
- **Templates:** JSX email components, HTML templates, provider-hosted templates (owner-attested if not in repo).
- **DNS:** SPF, DKIM (selector discovery via provider documentation), and DMARC for the sending domain (read-only DNS queries, `PUBLIC` evidence).

### 16.2 Stream classification

```ts
interface MessageStream {
  id: string;
  kind: "TRANSACTIONAL" | "SECURITY" | "ACCOUNT" | "RECEIPT" | "PRODUCT_UPDATE" | "NEWSLETTER" | "MARKETING" | "ABANDONED_CART" | "RE_ENGAGEMENT" | "NOTIFICATION";
  commercial: Tracked<boolean>;      // primary purpose is commercial advertisement or promotion
  sendSites: CodeLocation[];
  triggers: string[];
  templates: string[];
  permission: Tracked<"NOT_REQUIRED" | "OPT_IN" | "DOUBLE_OPT_IN" | "SOFT_OPT_IN_CANDIDATE" | "NONE" | "UNKNOWN">;
  unsubscribe: Tracked<{ link: boolean; header: boolean; oneClick: boolean }>;
  suppressionEnforced: Tracked<boolean>;
  senderIdentity: Tracked<{ fromName: string | null; postalAddress: boolean }>;
}
```

Classification is deterministic where possible (password reset triggered by a reset endpoint is `SECURITY`) and anchored LLM otherwise (template content). A transactional message containing promotional content is a **mixed message**. Its classification under packs with a primary-purpose test is `LEGAL_REVIEW_REQUIRED` unless clearly one or the other.

### 16.3 Permission capture

- Marketing opt-in controls must not be pre-checked (`EMAIL.OPTIN_PRECHECKED`, also tagged `dark-pattern`).
- Signup for an account must not bundle marketing consent by default where packs require separate consent (`EMAIL.BUNDLED_CONSENT`).
- Double opt-in is recommended (`WARNING` when absent) and is not a legal default everywhere. Packs decide.
- Consent to marketing is recorded (who, when, which form, which text version), and the record lives with the subscriber, not in logs.

### 16.4 Unsubscribe and suppression

**Design principle: an unsubscribe link is worthless if the send path ignores it.** The architecture enforces suppression at a single chokepoint.

```ts
interface EmailSuppressionEntry {
  addressHash: string;               // SHA-256 of normalized address (lowercased, trimmed; provider-specific normalization rules not applied silently)
  scope: "ALL_MARKETING" | `STREAM:${string}` | "ALL";
  reason: "UNSUBSCRIBE" | "COMPLAINT" | "BOUNCE" | "ADMIN" | "ACCOUNT_DELETION";
  createdAt: string;
  source: "LINK" | "ONE_CLICK_HEADER" | "PREFERENCE_CENTER" | "PROVIDER_WEBHOOK" | "ADMIN" | "RIGHTS_REQUEST";
}
```

- **Chokepoint:** all marketing sends go through one function (`sendMarketing()` or the provider's audience-based campaign with provider-side suppression). `EMAIL.SUPPRESSION_BYPASS` statically finds commercial send sites that do not reach the chokepoint.
- **Hash-based suppression:** storing a hash of the normalized address lets the system keep honoring an unsubscribe after the account or contact is deleted, without retaining the address itself. Data rights deletion therefore *converts* the contact into a suppression hash instead of erasing everything (`reason: ACCOUNT_DELETION`). That retention is disclosed in the policy and flagged for legal confirmation.
- **Provider sync:** unsubscribes in the app propagate to the provider (API call or webhook), and provider-side unsubscribes and complaints propagate back (webhook handler with signature verification).
- **No accidental re-subscription:** a suppression entry is removed only by an explicit, recorded user action (re-opt-in through a form with a fresh consent record). Contact imports and re-syncs cannot clear suppressions (`EMAIL.SUPPRESSION_OVERRIDE_BY_IMPORT`).
- **Headers:** `List-Unsubscribe` with an HTTPS endpoint and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` for bulk marketing (`PLATFORM_POLICY` controls from the `email-bulk-sender` pack).
- **Timing:** honoring deadlines come from packs (`thresholds.yaml`) and are shown in the report. The implementation takes effect immediately.
- **Sender identification:** a clear from-name consistent with `model.identity`, and a valid postal address where packs require it (owner input; never invented).

### 16.5 Lifecycle test

Run in a test environment with a local mail catcher (for example Mailpit) or the provider's sandbox or test mode. Never against real subscribers.

```text
1. SUBSCRIBE       canary email via the real form → subscriber record exists; consent record exists;
                   confirmation email captured (if double opt-in)
2. MESSAGE         trigger a test campaign or send → message captured with unsubscribe link + headers
3. UNSUBSCRIBE     follow the link (and separately POST the one-click endpoint) → confirmation page
                   (design system, accessible, no retention nags beyond one optional preference choice)
4. SUPPRESSION     suppression entry exists (hash); provider contact updated (sandbox)
5. FUTURE CAMPAIGN trigger another marketing send → the canary address receives nothing
6. TRANSACTIONAL   trigger a password reset → still delivered (security mail is not suppressed by
                   marketing unsubscribe)
7. RE-IMPORT       re-sync contacts from the source list → suppression persists
8. RE-SUBSCRIBE    explicit re-opt-in → allowed, with a new consent record
```

Where a test environment is unavailable, steps 1–2 are verified statically and step 5 by call-graph analysis. The findings are then capped at `HIGH`, and the report says the lifecycle was not executed.

---

## 17. Data Rights System

### 17.1 One layer for all regimes

Rights are modeled once. Packs supply which rights apply, deadlines, verification standards, and exceptions (`rights.yaml`). The implementation is a single request pipeline with pluggable executors per data store.

```text
         intake                    verify                  plan                     execute                  complete
 ┌───────────────────┐   ┌───────────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐  ┌──────────────────┐
 │ account settings  │   │ authenticated session │  │ deletion/export  │  │ store executors (DB,    │  │ confirmation to  │
 │ rights form       │──►│ or proportionate match│─►│ plan from        │─►│ object storage, vendor  │─►│ requester; audit │
 │ email/support     │   │ (no ID uploads by     │  │ rights.deletion  │  │ APIs, suppression, …)   │  │ event; evidence  │
 │ GPC/opt-out links │   │ default)              │  │ Plan (§17.5)     │  │ idempotent, resumable   │  │ record           │
 └───────────────────┘   └───────────────────────┘  └──────────────────┘  └─────────────────────────┘  └──────────────────┘
```

### 17.2 Rights matrix

```ts
interface RightsMatrixEntry {
  right: "ACCESS" | "DELETION" | "CORRECTION" | "PORTABILITY" | "OBJECTION" | "RESTRICTION" | "MARKETING_OPT_OUT" | "SALE_SHARE_OPT_OUT" | "LIMIT_SENSITIVE" | "CONSENT_WITHDRAWAL" | "APPEAL";
  requiredBy: { obligation: ObligationId; deadline?: string; extension?: string; verificationStandard?: string }[];
  promisedBy: DeclaredClaimId[];     // the site says users can do this
  state: "VERIFIED" | "PLANNED" | "ABSENT" | "NOT_REQUIRED";
  mechanism: { kind: "SELF_SERVICE" | "REQUEST_WORKFLOW" | "MANUAL_PROCESS" | "PROVIDER_FEATURE"; entry?: RouteId; executor?: string } | null;
  evidence: EvidenceRef[];
}
```

Key controls:

- `RIGHTS.PROMISED_NOT_IMPLEMENTED`: a right is claimed but `ABSENT`. This is a contradiction and `FAIL`.
- `RIGHTS.REQUIRED_NOT_AVAILABLE`: a confirmed pack requires the right, and it is `ABSENT`.
- `RIGHTS.MANUAL_PROCESS_UNDOCUMENTED`: the process is "email us" with no internal procedure record. `WARNING`, with an owner question.

"Email us at privacy@…" is a legitimate mechanism for small operators when a pack allows it. The system does not force self-service UI. It requires the mechanism to exist, be disclosed truthfully, and have a documented internal procedure (the owner confirms it).

### 17.3 Request model

```ts
interface RightsRequest {
  id: string;
  subject: { userId?: string; contactHash?: string };   // no raw email when a hash suffices
  requester: "SUBJECT" | "AUTHORIZED_AGENT" | "PARENT_GUARDIAN";
  jurisdictionContext: PackId[];                        // packs used for deadlines and standards
  rightType: RightsMatrixEntry["right"];
  submittedAt: string;
  channel: "SELF_SERVICE" | "FORM" | "EMAIL" | "GPC" | "ADMIN";
  verificationState: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
  verificationMethod: "AUTHENTICATED_SESSION" | "EMAIL_LINK" | "DATA_MATCH" | "AGENT_AUTHORIZATION" | "PARENT_VERIFICATION";
  workflowState: "RECEIVED" | "VERIFYING" | "IN_PROGRESS" | "AWAITING_REQUESTER" | "EXTENDED" | "COMPLETED" | "DENIED" | "PARTIALLY_COMPLETED";
  deadlines: { pack: PackId; dueAt: string; extendedTo?: string }[];
  denialReason?: string;                                // must cite a pack exception when denying
  plan?: DeletionPlanRef | ExportPlanRef;
  completion?: { at: string; summary: string; retainedItems: RetainedItem[]; evidence: EvidenceRef[] };
}
```

**Identity verification is proportionate** (P10):

- An authenticated session is sufficient for self-service requests by account holders, with re-authentication for deletion and export.
- Non-account requesters are verified by matching data already held (for example, an email link sent to the address on file). ID uploads are never required by default.
- Stronger verification is added only when a pack requires it for a specific right and data sensitivity, and the added data is deleted after verification.

### 17.4 Account deletion: what "delete" actually means

The deletion plan is a graph traversal from the user identity across every store and vendor holding their data:

```text
user(id=U)
 ├─ DB: users row                 → DELETE | ANONYMIZE
 ├─ DB: profiles, settings        → DELETE
 ├─ DB: sessions, tokens          → DELETE (and revoke refresh tokens)
 ├─ DB: oauth_accounts            → DELETE (and note: provider-side grant revocation instructions)
 ├─ DB: posts, comments           → owner policy: DELETE | ANONYMIZE ("deleted user") | RETAIN
 ├─ DB: messages to others        → owner/legal policy (other users' interests)
 ├─ Object storage: uploads/U/**  → DELETE (including derived thumbnails and CDN cache purge)
 ├─ Vendor: payments customer     → RETAIN_FOR_LEGAL (invoices/tax) + detach PII where supported
 ├─ Vendor: email contact         → DELETE contact; ADD suppression hash (§16.4)
 ├─ Vendor: analytics person      → vendor deletion API where available (owner key) | documented
 ├─ Vendor: error monitoring      → user id scrubbing / retention window (documented)
 ├─ Vendor: support desk          → documented manual step (owner)
 ├─ Vendor: AI provider logs      → per provider retention (owner-attested)
 ├─ Logs                          → retention window (documented; not rewritten)
 └─ Backups                       → retention window + tombstone re-application on restore (§17.6)
```

### 17.5 Deletion semantics

Each node gets exactly one `DeletionBehavior`:

| Behavior | Meaning | User-facing wording allowed |
| --- | --- | --- |
| `DELETE` | Removed from the store | "deleted" |
| `ANONYMIZE` | Irreversibly de-linked from the person (identifiers removed, content kept) | "anonymized" or "no longer linked to you" |
| `RETAIN_LEGAL` | Kept for a stated legal or billing obligation, with a retention period | "we keep X for Y because Z" |
| `SOFT_DELETE` | Marked deleted, still stored | **Not "deleted".** Allowed only as an intermediate state with a scheduled hard delete. Otherwise it must be described as "deactivated". |
| `DISABLE` | Account disabled, data kept | "deactivated" only |
| `UNKNOWN` | Not determined | Blocks any deletion claim |

Controls:

- `RIGHTS.DELETION_IS_SOFT`: UI or policy says "permanently delete" while only `deleted_at` or `active=false` is set. `FAIL`, contradiction.
- `RIGHTS.DELETION_INCOMPLETE`: plan nodes with `UNKNOWN`, or data stores not covered.
- `RIGHTS.DELETION_COPY_UNTRUTHFUL`: the confirmation copy promises more than the plan does.

The confirmation dialog copy is **generated from the plan**, so it cannot overpromise. Example: "Your account, profile, uploads, and saved items will be deleted. Invoices are kept for 7 years as required for tax records. Backups are overwritten within 30 days." The periods come from owner facts.

### 17.6 Backups and logs

The system does not pretend deletion reaches every backup instantly.

- Backup retention is an owner-attested or provider-documented fact.
- **Tombstone log:** deletions append a minimal tombstone (`subject hash`, `timestamp`, `plan id`) to a store excluded from normal restore, so that a restore procedure can re-apply deletions. The restore runbook step is generated as documentation (owner action).
- Logs are handled through retention windows, not rewriting, and the policy states this truthfully.

### 17.7 Other rights

| Right | Mechanism | Notes |
| --- | --- | --- |
| Correction | Profile editing covers most fields; a request workflow for non-editable data | Controls check that editable fields match the stored personal data |
| Objection and restriction | Request workflow with processing flags (`processing_restricted`) honored by jobs and analytics | Executors must enforce flags (static check that jobs read them) |
| Marketing opt-out | Email suppression (§16.4) | — |
| Sale or share opt-out, limit sensitive | Consent categories (`advertising`, `personalization`), GPC, links | California pack |
| Consent withdrawal | Consent gate (§13.4), plus revocation of recorded consents in backend flows (e.g., AI training opt-in) | — |
| Appeal | Workflow state for denied requests where packs require appeals | — |

### 17.8 Export and portability

- **Categories** come from `model.data` for the subject: profile, content, activity, preferences, purchases metadata, and consents.
- **Format:** a ZIP containing `data.json` (schema-described) and CSVs for tabular categories, plus a README describing each file. Uploaded files are included, or linked with expiring URLs if large.
- **Process:** re-authentication, rate limit (for example 1 per 24 hours), background job, signed URL with short expiry (for example 24 hours) and single-use, completion notification, and file deletion after expiry.
- **Authorization:** the export job is keyed to the authenticated subject only. `RIGHTS.EXPORT_IDOR` tests that user B cannot request, download, or enumerate user A's export (predictable IDs, unsigned URLs).
- **Sensitive data:** secrets, password hashes, internal risk scores, and other users' personal data are excluded. Exclusions are documented in the export README.

### 17.9 Verification

In a test environment with a seeded synthetic user (canary values), plus a second user:

1. Seed data across every store in the plan, including vendor sandboxes where available.
2. Export as the user: all categories present, no other user's data, URL expires, a second download fails after expiry.
3. Attempt the export as user B: denied.
4. Delete as the user, then query every store: `DELETE` nodes absent, `ANONYMIZE` nodes de-linked, `RETAIN_LEGAL` nodes present with PII detached, suppression hash present, sessions revoked (the old session cookie is rejected), uploads return 404 (including the CDN URL after purge).
5. Confirmation copy matches the plan (claim extraction against the plan).
6. Audit event recorded without unnecessary personal data.

Stores or vendors that cannot be queried in test are marked `UNKNOWN` in the verification result. They never count as passed.
