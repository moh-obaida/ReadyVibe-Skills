# Part VII — Platform Domains

> **SUPERSEDED / HISTORICAL DESIGN.** This describes an earlier CLI/engine platform architecture that was dropped. The current model is [`docs/current-model.md`](../../current-model.md).

## 23. Security

### 23.1 Baseline framework

Security controls are mapped to **OWASP ASVS** requirements through the `owasp-asvs` standards pack. The pack pins an ASVS major version and maps requirement ids to controls. Controls stay stable when the ASVS version changes, and only the mapping is updated.

Verification depth is selected from capabilities, loosely following ASVS levels, **as a testing depth, not a certification**:

| Depth | When | Adds |
| --- | --- | --- |
| Baseline | Always | Secrets, headers, transport, cookies, error disclosure, dependencies, open redirects, XSS sinks |
| Standard | `HAS_AUTH`, personal data, `HAS_UPLOADS`, or `HAS_AI` | Authentication flows, authorization matrix (IDOR), CSRF, CORS, rate limiting, upload handling, SSRF, logging |
| Elevated | `HAS_PAYMENTS`, `HAS_ADMIN_SURFACE`, children's data, or special-category data | Admin authorization matrix, session hardening, step-up for dangerous actions, audit events, stricter dependency policy |

### 23.2 Safe testing rules

- Only non-destructive probes in production: reading headers, fetching public pages and bundles, TLS and redirect checks, unauthenticated access checks to routes discovered by static analysis, open-redirect checks with a harmless external target (a reserved `example.test` URL; the finding is based on the `Location` header, not on following it).
- Authorization, rate-limit, CSRF, upload, and SSRF tests run only on `LOCAL`, `PREVIEW`, or `STAGING` environments with synthetic users, unless the owner explicitly allows them for production in `config.yaml`, per class.
- Payloads are **markers, not exploits**: XSS checks inject inert canary strings (`rv-xss-<nonce>`) and look for unescaped reflection in HTML contexts, and SQL injection is assessed statically (query construction), not by sending injection payloads.
- Rate-limit tests are bounded (for example 30 requests over 10 seconds against a login endpoint in a test environment) and stop at the first 429.

### 23.3 Secrets

| Check | Method | Control |
| --- | --- | --- |
| Committed secrets | Pattern, entropy, and provider-format scan of tracked files (git history scan is optional and opt-in; it can be slow and surface old secrets that still need rotation) | `SEC.SECRET_COMMITTED` |
| Client-exposed secrets | Env vars with public prefixes (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`, `NUXT_PUBLIC_`, `EXPO_PUBLIC_`, `REACT_APP_`) whose names or values look secret (`*_SECRET`, `*_API_KEY` for server-side providers, `sk_live_`, `service_role`); **plus** fetching built JS bundles from the runtime and scanning them | `SEC.SECRET_IN_CLIENT_BUNDLE` (CRITICAL) |
| Publishable versus secret keys | Vendor catalog knows which keys are designed to be public (payment publishable keys, BaaS anon keys, analytics write keys) and which are not | Avoids false positives |
| BaaS keys | A service-role or admin key in the client is CRITICAL. An anon key in the client is expected, **but** it makes row-level security or security rules the only authorization layer, which triggers `SEC.BAAS_ACCESS_RULES` checks. | — |
| `.env` hygiene | `.env*` tracked in git; `.env.example` containing real-looking values; missing `.gitignore` entries | `SEC.ENV_FILE_TRACKED` |
| Source maps | Public production source maps exposing server code or comments with secrets | `SEC.SOURCEMAP_EXPOSURE` (WARNING, unless secrets are found) |

Remediation for exposed secrets always includes **rotation**, which is an owner action. Moving the key server-side without rotation leaves the leaked key valid. The finding stays `FAIL` until the owner records rotation.

### 23.4 Authentication

Session handling (cookie attributes, lifetime, rotation on login, invalidation on logout and password change), password reset (single-use, expiring tokens, no user enumeration in messages, `Referrer-Policy` on reset pages), email verification where the product relies on email ownership, brute-force protections (rate limit or lockout with safe unlock), credential storage (a provider-managed, standard password hash if custom), MFA availability for admin and high-risk roles (a recommendation, not universally forced; §52.14), and OAuth redirect URI validation and `state` or PKCE use.

### 23.5 Authorization

The most common critical failure in vibe-coded apps is missing server-side authorization. The architecture treats it as a matrix test, not a code review.

1. **Resource model:** from `model.data`, entities with an owner key (`user_id`, `owner_id`, `org_id`) and the endpoints, server actions, or BaaS tables that read or write them.
2. **Personas:** `user-A`, `user-B` (same role), `anonymous`, and one per privileged role (from `model.auth.roles`). All are synthetic, created via the owner-configured seeding method (a seed script the owner allows, test-environment sign-up, or provider test users).
3. **Matrix:** for each (endpoint or table operation × persona), the expected result is derived from ownership and role. Examples: B reading A's object must be denied, and anonymous listing of users must be denied.
4. **Execution:** direct HTTP or BaaS client calls, bypassing the UI.
5. **BaaS specifics:** the Supabase adapter checks that RLS is enabled on every table exposed to the anon or authenticated role and that policies reference `auth.uid()` appropriately (static, from migrations), then runs the matrix through the client API. The Firebase adapter parses security rules for `allow read, write: if true` or expiry-based test rules, then runs the matrix with the emulator if available.
6. **Findings:** `SEC.IDOR` (horizontal), `SEC.PRIVILEGE_ESCALATION` (vertical), `SEC.BAAS_RLS_DISABLED`, `SEC.BAAS_RULES_OPEN`, `SEC.UNAUTHENTICATED_MUTATION`.

Admin routes are covered by `admin-authorization` (§52) using the same machinery.

### 23.6 Input and request security

| Area | Detection | Control |
| --- | --- | --- |
| XSS | Dangerous sinks with untrusted data: `dangerouslySetInnerHTML`, `v-html`, `{@html}`, `innerHTML`, `document.write`, markdown rendering without sanitization, and `href={userValue}` without scheme validation; runtime inert-canary reflection | `SEC.XSS_SINK`, `SEC.XSS_REFLECTED` |
| Injection | Raw SQL built by string concatenation or template literals with request data; ORM raw-query escapes; NoSQL operator injection (request objects passed as queries) | `SEC.SQL_INJECTION_RISK`, `SEC.NOSQL_INJECTION_RISK` |
| Command execution and templates | `child_process` with request data; server-side template rendering of user input | `SEC.COMMAND_INJECTION_RISK`, `SEC.SSTI_RISK` |
| CSRF | Cookie-authenticated, state-changing endpoints without `SameSite=Lax/Strict`, anti-CSRF tokens, or origin checks (framework-aware: some server-action mechanisms include origin checks) | `SEC.CSRF` |
| CORS | `Access-Control-Allow-Origin` reflecting arbitrary origins together with `Allow-Credentials: true`; wildcard on authenticated APIs | `SEC.CORS_PERMISSIVE` |
| Rate limiting and abuse | Login, signup, reset, contact forms, and **AI endpoints** without limits (an unauthenticated AI proxy is a direct cost-abuse vector) | `SEC.RATE_LIMIT_MISSING`, `AI.UNAUTHENTICATED_PROXY` |
| Uploads | Type allowlist (content sniffing, not the extension alone), size limits, storage outside the web root or in private buckets, public-by-default buckets, filename handling (path traversal, overwrite), image re-encoding for metadata stripping (privacy), SVG served from the same origin (XSS) | `SEC.UPLOAD_*` |
| Redirects | `?next=`, `?redirect=`, and `?returnTo=` used without allowlist validation | `SEC.OPEN_REDIRECT` |
| SSRF | Server-side fetch of user-provided URLs (link previews, webhooks, image proxies, AI "browse" tools) without allowlisting or private-IP blocking | `SEC.SSRF_RISK` |
| Logging | Secrets, tokens, passwords, or full request bodies logged | `SEC.SECRET_IN_LOGS` (personal data in logs is `PRIVACY.PII_IN_FIRST_PARTY_LOGS`) |
| Error disclosure | Stack traces, debug pages, or verbose errors in production responses | `SEC.ERROR_DISCLOSURE` |

### 23.7 Cookie security

For authentication and session cookies (identified by `cookie-and-storage-audit`): `Secure`, `HttpOnly` (unless the framework requires JS access, which is then justified), `SameSite` (`Lax` default; `None` only with `Secure` and a cross-site need), a narrow `Domain` (no leading-dot parent domain unless subdomain sharing is intended), `Path`, and reasonable expiry. Consent-state cookies contain no personal or sensitive data. Tokens in `localStorage` are reported (`SEC.TOKEN_IN_WEB_STORAGE`, WARNING) with the trade-off explained, not auto-migrated.

### 23.8 Security headers (`security-headers`)

**Inspect first.** Existing headers are collected per environment and route class (HTML documents, API responses, static assets) from runtime responses. Configuration sources are identified by the hosting and framework adapters, so changes land where headers are actually set.

**CSP is built from data (algorithm):**

```text
inputs:
  R = resource inventory from runtime captures for personas {first-visit, accept-all, authenticated,
      checkout (if any), admin (if any)} AFTER remediation (so gated vendors and new surfaces are included)
  F = framework requirements from the adapter (inline bootstrap scripts, style injection, dev-only eval,
      nonce support, hash support, worker and wasm needs)
  V = vendor catalog CSP requirements for each vendor in inventory.vendors (documented origins per directive)
steps:
  1. For each directive (script-src, style-src, img-src, font-src, connect-src, frame-src, media-src,
     worker-src, manifest-src, form-action, frame-ancestors, base-uri, object-src):
       allowlist = observed origins in R for that resource type ∪ documented origins in V for vendors
                   that are present
       never add: '*' (except img-src data:/blob: when observed), 'unsafe-eval' unless F requires it in
                  production (then WARNING with reason)
  2. Inline scripts:
       if F supports nonces (SSR frameworks) → 'nonce-{per-request}' + 'strict-dynamic'
       elif static inline scripts           → 'sha256-…' hashes computed from the build output
       else                                 → 'unsafe-inline' only with a WARNING and a migration note
  3. Always: object-src 'none'; base-uri 'self' (or 'none'); frame-ancestors per owner embedding needs
     (default 'self'); form-action 'self' + observed form targets (payment redirects).
  4. Emit as Content-Security-Policy-Report-Only first, with a reporting endpoint if the owner wants
     reports (first-party route or none; never a third-party collector added silently).
  5. Verify: run every verification persona with the report-only policy and collect
     `securitypolicyviolation` events in the browser. Zero violations across personas is the gate.
  6. Enforce: switch to Content-Security-Policy (owner approval; for complex existing projects, after a
     configurable observation period in production with report-only).
```

**Other headers:**

| Header | Default proposal | Caution |
| --- | --- | --- |
| `Strict-Transport-Security` | Staged: `max-age=300` → `86400` → `31536000` after verification periods | `includeSubDomains` only after the owner confirms every subdomain serves HTTPS. `preload` only by explicit owner decision, with its hard-to-reverse nature explained. |
| `X-Content-Type-Options` | `nosniff` | — |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (stricter, `no-referrer`, on token-bearing pages) | — |
| Frame restrictions | CSP `frame-ancestors` (plus `X-Frame-Options: DENY/SAMEORIGIN` for legacy clients) | Owner confirms embedding needs |
| `Permissions-Policy` | Deny features not used (camera, microphone, geolocation, payment, …) based on the `HAS_DEVICE_PERMISSIONS` and `HAS_GEOLOCATION` facts | Must allow features the product actually uses, including for embedded payment frames |
| `Cross-Origin-Opener-Policy` | `same-origin` where compatible (OAuth popups and payment windows checked) | Breaks some popup flows; verified with personas |

**Idempotency:** header keys are upserted in exactly one configuration source per route class. Two sources setting the same header (for example host config and middleware) produce `HEADERS.DUPLICATE_SOURCES`, and the adapter consolidates them. Stacked, conflicting CSP headers are detected at runtime (multiple CSP headers are intersected by browsers, a frequent cause of breakage).

### 23.9 HTTPS and transport

Production HTTPS, HTTP-to-HTTPS redirect (single hop, preserving path), no mixed content (active or passive, from the network log), secure cookies over HTTPS, certificate validity and expiry horizon (a warning if under 14 days), and HSTS as above. Certificate management is assumed to be the host's responsibility, and the report states that assumption.

### 23.10 Dependencies (`dependency-security`)

- Known vulnerabilities via the package manager's audit database or OSV. **This sends package names and versions to that service.** It is disclosed in the report, enabled by default for public registries, and can be disabled (`security.dependencyAudit.online: false`) for offline or strict environments, in which case the result is `UNKNOWN`.
- Reachability hints: whether a vulnerable package is a production dependency and imported in reachable code (static), used to prioritize, never to dismiss.
- Abandoned or high-risk packages (no releases for a long period plus known issues, deprecated flags, typosquat-like names versus the popular package list), duplicate major versions, unused dependencies (static import graph).
- Install scripts (`preinstall`, `install`, `postinstall`) in dependencies are reported. The tool itself never runs them (§40).
- Lockfile present and consistent with the manifest.
- **Upgrades:** patch and minor upgrades with changelog review and a build and test run (`AUTOMATIC_WITH_VERIFICATION`). Major upgrades are proposals (`MANUAL_ENGINEERING_REQUIRED`) with a breaking-change summary.

---

## 24. Performance

### 24.1 Metrics

- **Core Web Vitals** as defined by the `core-web-vitals` guidance pack (currently LCP, INP, and CLS, with "good" thresholds evaluated at the 75th percentile of page loads). Thresholds and metric definitions are pack data, so metric changes are pack updates.
- **Lab** metrics (engine-measured): LCP, CLS, Total Blocking Time as a lab proxy for responsiveness, and interaction latency from scripted interactions where meaningful. Lab INP is an approximation.
- **Field** metrics: from the public Chrome UX Report API (requires an owner API key, and only available for sites with enough traffic) or from the site's existing RUM. Field data is **never** simulated.

The report keeps lab and field in separate sections, labeled as such. The system promises no scores.

### 24.2 Lab protocol

Key routes are the homepage, top route templates by intent, and conversion flows. Each is tested with mobile emulation and CPU and network throttling profiles from the pack, 3 runs, reporting the median with the spread. Cold cache and warm cache are recorded separately. Consent state: `first-visit` (what new visitors get) and `accept-all` (the heaviest case).

### 24.3 Checks and remediation

| Check | Control | Remediation class |
| --- | --- | --- |
| LCP element identified; image LCP not lazy-loaded, has `fetchpriority` where appropriate, and is appropriately sized | `PERF.LCP_*` | AUTOMATIC_WITH_VERIFICATION |
| Images without dimensions (CLS), without responsive `srcset` or `sizes`, unoptimized formats, oversized | `PERF.IMAGE_*` | AUTOMATIC_WITH_VERIFICATION (via framework image components when present) |
| Fonts: blocking loads, FOIT, excessive weights; self-hosting opportunity (coordinated with `third-party-privacy`) | `PERF.FONT_*` | AUTOMATIC_WITH_VERIFICATION |
| JavaScript: bundle size per route against budget, unused JS, large dependencies, missing code splitting | `PERF.JS_*` | Proposals; safe splits automated where the adapter supports them |
| Render-blocking resources | `PERF.RENDER_BLOCKING` | AUTOMATIC_WITH_VERIFICATION |
| Third-party cost attribution (blocking time and bytes per vendor) | `PERF.THIRD_PARTY_COST` | Proposals (defer, facade, remove) |
| Long tasks and hydration cost | `PERF.LONG_TASKS`, `PERF.HYDRATION` | Proposals |
| Caching headers for static assets (immutable hashed assets), compression | `PERF.CACHE_*`, `PERF.COMPRESSION` | AUTOMATIC_WITH_VERIFICATION (hosting adapter) |
| Layout shifts from late-injected banners (including consent banners), ads, embeds | `PERF.CLS_INJECTED_UI` | Reserve space; overlay banners |

Performance findings are `PERFORMANCE_BEST_PRACTICE`, non-blocking by default. The owner can set budgets in config that become `OWNER_POLICY` controls, which CI can enforce.

---

## 25. Payments and Commerce

### 25.1 Activation

Activated by `HAS_PAYMENTS`: payment SDKs (Stripe, Paddle, Lemon Squeezy, PayPal, Braintree, Adyen, Square, …), checkout redirects observed, or payment form fields (`autocomplete="cc-number"`) detected.

### 25.2 Integration mode

| Mode | Detection | Implication |
| --- | --- | --- |
| `HOSTED_REDIRECT` | Redirect to the provider's checkout domain | Smallest application exposure to card data |
| `EMBEDDED_PROVIDER_FIELDS` | Provider iframes or elements for card entry | Card data entered into provider-controlled fields; the page's script integrity still matters |
| `DIRECT_CARD_DATA` | Card inputs rendered by the app and posted to the app's server, or card data handled by server code | **CRITICAL:** `PAY.SERVER_TOUCHES_CARD_DATA`. Strongly propose migration to a provider-hosted method. |

PCI DSS applicability indicators are reported under the `pci-dss` pack. Which self-assessment questionnaire or validation applies is **always deferred** to the acquirer or a QSA (`LEGAL_REVIEW_REQUIRED(reason = PCI_SCOPE_DETERMINATION)`, labeled as a compliance-program question rather than a legal one). For embedded fields, the system notes that script integrity and change control on payment pages are scope-relevant, and checks CSP and third-party scripts on payment pages specifically.

### 25.3 Integration safety

| Check | Control |
| --- | --- |
| Secret keys server-only; publishable keys only on the client | `PAY.SECRET_KEY_EXPOSED` (CRITICAL; rotation is an owner action) |
| Webhook signature verification using the provider's library method on the raw body | `PAY.WEBHOOK_UNVERIFIED` |
| Webhook idempotency: event ids recorded, handlers safe to retry, out-of-order handling | `PAY.WEBHOOK_NOT_IDEMPOTENT` |
| Order and entitlement fulfilment driven by verified webhooks or server-side confirmation, not by client redirects alone ("success" URL grants access) | `PAY.CLIENT_TRUSTED_FULFILMENT` |
| Prices determined server-side (the client does not send the amount) | `PAY.CLIENT_CONTROLLED_PRICE` |
| Failed payments: clear UI, retry, no duplicate charge (idempotency keys) | `PAY.FAILURE_HANDLING` |
| Refunds: an admin path exists if refunds are promised; the policy matches implementation | `PAY.REFUND_PATH` |
| Receipts sent (provider or app) | `PAY.RECEIPTS` |
| Test versus live mode: production uses live keys, and live keys are not in preview environments | `PAY.MODE_MISMATCH` |

### 25.4 Pricing disclosure

Currency, tax inclusion or exclusion as displayed, and total price before commitment. Jurisdiction-specific display rules (for example tax-inclusive pricing for consumers in some regions) come from consumer packs, with `LEGAL_REVIEW_REQUIRED` where facts are ambiguous.

### 25.5 Card data never stored casually

No remediation recipe may introduce card data storage. `PAY.CARD_DATA_STORED` scans schemas and logs for PAN-like columns and patterns (Luhn-valid 13–19 digit sequences in fixtures and logs, and column names such as `card_number` or `cvv`).

### 25.6 Subscriptions (`subscription-readiness`)

| Area | Checks |
| --- | --- |
| Offer clarity | Price, billing period, renewal, trial length and conversion price, cancellation method stated **before** purchase, near the purchase button (DOM proximity and presence, anchored text classification) |
| Consent to renew | Affirmative action where packs require it; no pre-checked renewal consent |
| Cancellation | Available online if signup was online (packs); steps to cancel versus steps to subscribe (`SUBS.CANCELLATION_ASYMMETRY`, `dark-pattern` tag); no forced chat or phone call; retention offers allowed only as a single skippable step where packs permit |
| Trials | Reminder before conversion where packs require it (owner configures; the email stream is classified transactional or required notice) |
| Billing management | Customer portal or in-app billing page (payment method, invoices, cancel) |
| Failed payments and dunning | Notification, grace period behavior, access consequences stated |
| Termination consequences | What happens to data and access on cancellation (ties to data retention) |
| Receipts and renewal notices | Present |

Auto-renewal and cancellation law differs by jurisdiction and has changed through legislation and litigation. Obligations live in packs with per-obligation temporal blocks, and anything uncertain is `LEGAL_REVIEW_REQUIRED`. In the US, the federal baseline is ROSCA (`us-ftc-rosca`): clear material-term disclosure, express informed consent, and a simple mechanism to stop recurring charges. The vacated 2024 FTC Negative Option Rule amendments are **not** encoded as current requirements (§9.11). State automatic-renewal laws (`us-ca-auto-renewal` and future state packs) and EU consumer rules (`eu-consumer`) are separate packs.

---

## 26. Third-Party System

### 26.1 Vendor catalog (knowledge pack)

A community-maintained, versioned data set (`vendor-catalog/vendors/*.yaml`, CC0) describing how to recognize a vendor and what it typically does. It is **not** a verdict about any vendor.

```yaml
id: posthog
name: PostHog
category: [ANALYTICS, SESSION_REPLAY, FEATURE_FLAGS]
signatures:
  domains: ["*.posthog.com", "us.i.posthog.com", "eu.i.posthog.com"]
  scriptPatterns: ["/static/array.js"]
  npm: ["posthog-js", "posthog-node"]
  globals: ["posthog"]
  cookies: ["ph_*_posthog"]
  storageKeys: ["ph_*_posthog"]
defaultPurpose: ANALYTICS
publicKeys: ["phc_*"]                # designed to be public
configSignals:                        # code-level settings detectors can read
  - { key: "disable_session_recording", meaning: "replay disabled" }
  - { key: "session_recording.maskAllInputs", meaning: "replay input masking" }
  - { key: "persistence", values: { memory: "no persistent storage" } }
teardown: { method: "opt_out_capturing", clearsIdentifiers: "per vendor documentation" }
csp: { script-src: ["https://*.posthog.com"], connect-src: ["https://*.posthog.com"] }
regions: { selectable: ["US", "EU"], source: "https://posthog.com/docs" }
roleCandidate: PROCESSOR_OR_SERVICE_PROVIDER    # a candidate only; determination is legal
policyUrl: https://posthog.com/privacy
sources:
  - { kind: OFFICIAL_DOCUMENTATION, url: "https://posthog.com/docs", retrievedAt: "2026-08-10" }
lastReviewed: 2026-08-10
```

Catalog rules: signatures and behaviors must cite official vendor documentation. Evaluative language ("privacy-friendly", "illegal in the EU") is prohibited. Unknown third-party domains are still inventoried as `vendorId: null` with category `UNKNOWN`.

### 26.2 Inventory construction

```ts
interface Vendor {
  id: VendorId;                         // catalog id or "unknown:<registrableDomain>"
  name: string;
  categories: VendorCategory[];
  purpose: Tracked<string>;
  presence: { static: EvidenceRef[]; runtime: EvidenceRef[]; server: EvidenceRef[] };
  domains: string[];
  sides: ("BROWSER" | "SERVER")[];
  dataCategories: Tracked<DataClass[]>;  // from egress analysis + SDK call arguments
  storage: ClientStorageId[];
  consentCategory: Tracked<ConsentCategory | "necessary" | "UNKNOWN">;
  loadsBeforeConsent: Tracked<boolean>;
  necessity: Tracked<"ESSENTIAL" | "USEFUL" | "REPLACEABLE" | "UNNECESSARY" | "UNKNOWN">;
  alternatives: { kind: "SELF_HOST" | "FACADE" | "FIRST_PARTY_PROXY" | "REMOVE" | "NONE"; note: string }[];
  processorRole: Tracked<"PROCESSOR" | "CONTROLLER" | "JOINT" | "SERVICE_PROVIDER" | "THIRD_PARTY" | "UNKNOWN">; // always requires review
  region: Tracked<string | null>;       // account setting (owner-attested) or documented default
  policyUrl: string | null;
  cspNeeds: Record<string, string[]>;
  disclosedInPolicy: Tracked<boolean>;
  ownerSkill: "analytics-privacy" | "third-party-privacy";
  evidence: EvidenceRef[];
}
```

Sources merged: static imports and SDK initialization, script tags and tag-manager containers (where the container definition is available in the repository or fetched from the public container URL), runtime network capture across personas, server-side SDK usage and outbound HTTP clients (static only, unless the owner provides server logs or instrumentation). **Server-side coverage is explicitly marked as static-only** in the coverage record. The system does not pretend it observed server-to-server traffic.

### 26.3 Data egress analysis

For each vendor: canary matches (§7.6), payload field inventory (keys sent, value shapes), cookies sent to vendor domains, `Referer` leakage of full URLs, identifiers linking visits (user ids set via `identify`), and fingerprinting-like behavior where detectable (a canvas, audio, or WebGL read sequence by third-party scripts, reported as `WARNING` with evidence and never as a certainty).

### 26.4 Necessity and alternatives

| Pattern | Proposal |
| --- | --- |
| Web fonts from a third-party CDN | Self-host (license check: the font's license must permit self-hosting; open-licensed fonts usually do); preserves design fidelity |
| Video embeds | Click-to-load facade with a privacy-enhanced embed domain where the vendor provides one; the facade matches the design system and is accessible |
| Maps | Static map image plus click-to-load, or a link-out |
| Chat widgets | Load on user action or after consent; keep the support page usable without it |
| Social share widgets | Plain share links (no third-party script) |
| CAPTCHA | Consider privacy and accessibility trade-offs of providers; ensure an accessible alternative; disclose |
| Error monitoring | Scrub PII (`beforeSend`), disable default PII capture, no request bodies, mask replay |
| CDN-hosted libraries | Bundle locally, or add Subresource Integrity if kept |

No blanket legality claims ("Google Fonts is illegal"). The system reports the observed behavior (the visitor's IP address is sent to the font host on page load, before any choice), the active packs' obligations, and the alternatives. Whether a specific transfer requires consent or another basis is decided by packs and, where uncertain, `LEGAL_REVIEW_REQUIRED`.

### 26.5 Integration with other systems

- **Privacy Policy:** the recipients section is compiled from the inventory (§15.2).
- **Consent:** `consentCategory` drives gating (§13).
- **CSP:** `cspNeeds` together with observed origins (§23.8).
- **Cookie notice:** storage items per vendor.
- **Performance:** per-vendor cost (§24.3).
- **Compliance diff:** vendor added, removed, or changed is a first-class semantic delta (§39).

---

## 47. AI Features

Activated by `HAS_AI`.

| Area | Checks | Control examples |
| --- | --- | --- |
| Key exposure | Provider keys in client bundles; browser-direct calls to AI APIs with a secret key | `AI.KEY_IN_CLIENT` (CRITICAL; rotation is an owner action) |
| Abuse and cost | AI endpoints unauthenticated, without rate limits, without input size limits, or without per-user quotas | `AI.UNAUTHENTICATED_PROXY`, `AI.NO_RATE_LIMIT` |
| Data flow | What is sent: prompts, uploaded files, conversation history, user profile context, and system prompts that embed personal data; canary tests for prompt contents reaching logs and analytics | `AI.PII_IN_PROMPTS_UNDISCLOSED`, `AI.PROMPTS_LOGGED` |
| Output storage | Where outputs are stored and for how long; included in export and deletion plans | `AI.OUTPUTS_NOT_IN_RIGHTS_PLANS` |
| Provider settings | Retention, training use, and zero-retention agreements are **account-level settings, not detectable from code**. They are recorded as owner-attested facts with the date. | `AI.PROVIDER_SETTINGS_UNATTESTED` (`OWNER_INPUT_REQUIRED`) |
| Transparency | Users informed when they interact with an AI system, and AI-generated content labeled or marked where active packs require it. Under `eu-ai-act-transparency`, applicability is computed per AI system from: **role** (provider or deployer; an owner fact, or a `legalJudgment` when unsure), **behaviors** (interacts with people, generates synthetic content, other listed behaviors; detected and owner-confirmed), **output content types**, and **market-placement date** (owner fact `ai.systems[].placedOnMarketAt`, which drives the transitional rule, §9.11). It is never a single on/off flag. | `AI.INTERACTION_DISCLOSURE`, `AI.SYNTHETIC_OUTPUT_MARKING` (pack-dependent; `LEGAL_REVIEW_REQUIRED` for role and scope questions) |
| Moderation and safety | Input and output moderation for public or UGC-facing AI features; prompt-injection exposure when the AI reads untrusted content with tool access | `AI.MODERATION_MISSING` (WARNING), `AI.TOOL_USE_UNTRUSTED_INPUT` |
| Automated decisions | AI outputs used for decisions with significant effects (eligibility, pricing, moderation bans) | `AI.SIGNIFICANT_DECISION` (`LEGAL_REVIEW_REQUIRED`) |
| Minors and sensitive data | AI features available to child segments; special-category data in prompts | Routed to `minors-readiness` and `privacy-readiness` |
| Policy accuracy | AI processing disclosed with vendor, purpose, data categories, and retention (from owner attestation) | Via `privacy-policy` and `policy-consistency` |

No generic "AI disclaimer" is added when the AI feature is irrelevant to users (for example, an AI used only in the build pipeline) or when no pack requires one. Accuracy disclaimers for user-facing generated content are proposed as owner decisions, with Terms language placeholders (§15.8).

---

## 48. User-Generated Content

Activated by `HAS_USER_CONTENT`, or `HAS_UPLOADS` with public visibility.

| Area | Checks |
| --- | --- |
| Reporting | Every piece of UGC and every profile has a report mechanism (accessible, localized, with reasons) |
| Moderation | A queue exists (admin module) with actions (remove, restrict, warn, dismiss) and reasons recorded |
| Blocking and muting | Users can block others where interaction features exist |
| Enforcement | Account suspension and restoration flows; audit events |
| Statements of reasons and appeals | Where packs require them (e.g., EU DSA obligations for hosting services and online platforms, tiered by service type and enterprise size): notices to affected users and an internal complaint route |
| Notice-and-action | A reachable mechanism for anyone (not only users) to report illegal content, where packs require it |
| Visibility defaults | Public versus private defaults recorded; protective defaults for minors (§14.5) |
| Deletion and retention | UGC included in deletion plans with owner policy (delete, anonymize, retain for others' conversations) |
| Uploads | Security (§23.6) plus content scanning decisions (owner) |
| Copyright | A takedown contact where the owner relies on safe-harbor regimes (owner decision; `LEGAL_REVIEW_REQUIRED`) |
| Terms | Acceptable use and community guidelines exist and match enforcement features (§15.8) |

Platform-regime packs (`eu-dsa`, `uk-osa`, and future others) activate only when the service is within their scope. Service classification (intermediary, hosting, online platform, user-to-user service) is always a `LEGAL_REVIEW_REQUIRED` question, pre-filled with the facts.

---

## 49. Choice Architecture (Dark Patterns and Trust)

### 49.1 Ownership model

There is no separate "dark patterns" skill. Every trust-sensitive interface is owned by its domain, and its controls are tagged `dark-pattern`. The engine provides shared detectors, and the report aggregates the tag into a "Choice architecture" view.

| Interface | Owner |
| --- | --- |
| Consent banner and preferences | `consent-management` |
| Unsubscribe and preferences | `email-compliance` |
| Cancellation, trial signup | `subscription-readiness` |
| Account deletion | `data-rights` |
| Marketing opt-in at signup | `email-compliance` |
| Age screening | `minors-readiness` |
| Privacy settings | `privacy-readiness` |

### 49.2 Shared detectors (engine)

| Detector | Measures | Evidence |
| --- | --- | --- |
| `choice.prominenceRatio` | Size, contrast, font weight, fill versus outline, and position of the paired choices (accept versus reject, keep versus cancel) | Computed styles and bounding boxes |
| `choice.clickDepth` | Clicks or steps to complete choice A versus choice B (subscribe versus cancel, accept versus reject all) | Scripted walk |
| `choice.preselection` | Pre-checked optional boxes and pre-enabled toggles for optional processing | DOM state on first render |
| `choice.falseUrgency` | Countdown timers that reset on reload, "only N left" not bound to inventory data | Two loads compared; data-binding check |
| `choice.confirmshaming` | Guilt-inducing decline copy ("No thanks, I don't care about my privacy") | Anchored text classification |
| `choice.doubleNegative` | Confusing negations in toggles ("Don't not share") | Anchored text classification |
| `choice.hiddenOption` | The decline option below the fold, in a collapsed layer, or visually disguised as text | DOM and visibility analysis |
| `choice.nagging` | Repeated prompts after refusal within a session | Session walk |

Thresholds are control parameters. Where packs or guidance define expectations (for example equal prominence of choices, symmetry in choice, and prohibitions on deceptive design in some regimes), obligations cite them. Otherwise findings are `TRUST_CONSISTENCY` `WARNING`s.

**Principle:** the system never optimizes conversion at the expense of informed choice, and it will not implement a pattern its own detectors would flag, even on owner request. Remediation recipes are tested against these detectors.

---

## 50. Observability and Breach Readiness

What the system implements or verifies:

| Record | Owner | Minimization rule |
| --- | --- | --- |
| Admin audit events | `admin-audit-log` | Actor, action, target reference, reason; no secrets; no copies of personal data beyond identifiers |
| Security events (login failures, password or MFA changes, role changes) | `web-security` | Event type, account id, timestamp, coarse client info if needed for security |
| Privacy request logs | `data-rights` | Request metadata and completion evidence; not the exported data |
| Consent records | `consent-management` | §13.6 |
| Document and policy versions | Document owners | §41.6 |
| Vendor inventory history | `third-party-privacy`, via baselines | Inventory snapshots per verified run |
| Deployment change history | Engine baselines and compliance diffs | Semantic deltas per run |

Breach readiness is organizational. The system supports it without pretending to replace it:

- It checks that a security contact exists (`security.txt`, §21.7), that security events are logged, that the vendor inventory includes contact and role information useful for incident response, and that notification-deadline metadata from active packs is available in the report as information.
- It asks the owner to attest whether an incident response plan exists (`OWNER_INPUT_REQUIRED`). The system never marks it complete on its own and never generates a "breach response plan" presented as ready to use. At most, it provides a draft outline marked for owner and legal completion.
