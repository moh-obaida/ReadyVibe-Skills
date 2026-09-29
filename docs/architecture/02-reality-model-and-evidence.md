# Part II — Reality and Evidence

## 6. Website Reality Model

### 6.1 Purpose

The Website Reality Model (WRM) is the single description of what the target project **is** and **does**, for one commit and one set of environments. Every specialist reads it. Only foundation skills, the engine's detectors, and owner answers write to it, and every write carries provenance. Nothing downstream (documents, consent configuration, CSP, sitemap, admin navigation, reports) may rely on a behavior that is not in the model.

### 6.2 Representation

**Decision D-03.** The WRM is a set of **typed entities** (routes, data elements, storage items, vendors, …) plus an append-only log of **facts** about those entities. The nested JSON shown in §6.6 is a *projection* of this store, generated for readability and for skills that prefer a document.

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| One nested JSON document | Easy to read | Conflicting sources overwrite each other, so contradictions disappear; provenance is awkward per field | Rejected as the store, kept as a projection |
| Graph database | Powerful queries | Heavy dependency for a CLI; hard to diff in git | Rejected |
| **Entities + fact log (JSON / JSONL)** | Each source keeps its own assertion; contradictions are just two facts with the same subject and predicate from different planes; diffable; simple | Needs a small query layer | **Chosen** |

Storage in a run: `reality/entities/<type>.json`, `reality/facts.jsonl`, and the projection `reality/model.json`. A sealed model adds `reality/seal.json` with the content hash and run identity tuple.

### 6.3 Planes and provenance

Every fact belongs to exactly one plane:

| Plane | Meaning | Typical producers | Example |
| --- | --- | --- | --- |
| `OBSERVED` | Seen at runtime | Browser, HTTP, and storage probes | `_ga` cookie present after first load, before any interaction |
| `IMPLEMENTED` | Present in code or build output | Static analyzers | `posthog.init()` called in `app/providers.tsx:14` |
| `CONFIGURED` | Infrastructure or vendor configuration | Hosting adapters, config parsers, owner-attested vendor settings | `vercel.json` sets no `Content-Security-Policy` |
| `DECLARED` | What the site tells users or crawlers | Claim extraction from policies, banners, footer, UI copy, metadata | Privacy Policy: "We do not use analytics cookies." |
| `OWNER_ASSERTED` | Supplied by the owner | `config.yaml`, question answers | Operator legal name; target markets; retention decision |
| `INFERRED` | Derived by heuristics or LLM classification | Classifiers, agents | Route `/app/*` intent is `PRIVATE_AUTH` (MEDIUM) |

The report distinguishes **detected** facts (`OBSERVED`, `IMPLEMENTED`, `CONFIGURED`), **declared** facts, **owner-supplied** facts, and **inferred** facts everywhere they appear, as the requirements demand.

### 6.4 Confidence

| Level | Criteria | Examples |
| --- | --- | --- |
| `CONFIRMED` | Directly observed at runtime or read verbatim from a parsed artifact, reproducible | Cookie captured; response header recorded; line of code parsed; owner answer recorded |
| `HIGH` | Deterministic static evidence of behavior that was not exercised at runtime, or strong multi-signal inference | Analytics init in code on a route not crawled; vendor identified by both script URL and global variable |
| `MEDIUM` | Single indirect signal, or an LLM classification anchored to evidence | Vendor inferred from `package.json` only; data purpose inferred from variable names |
| `LOW` | Weak heuristic | Target market guessed from language; child audience guessed from imagery |
| `UNKNOWN` | Not determined | Server-side retention for a table without TTL or cleanup code |

Rules:

- `LOW` facts MUST NOT activate a jurisdiction pack, produce a `FAIL`, or justify `NOT_APPLICABLE`. They may only generate questions or `WARNING`s labeled as suspicions.
- An `INFERRED` fact produced by an LLM is capped at `MEDIUM` unless at least one cited evidence item is `CONFIRMED` and the inference is a direct reading of that evidence (for example, "this form field is labelled 'Date of birth'"), in which case it may be `HIGH`.
- When facts about the same subject and predicate disagree, confidence is **never averaged**. Each is kept, and the disagreement is evaluated as a potential contradiction (§27).

### 6.5 Coverage (absence is a claim)

**Decision D-04.** A capability can be `ABSENT` only with a `CoverageRecord` that states what was searched and how. `NOT_APPLICABLE` statuses derived from absent capabilities inherit that record and show it in the report ("no analytics found across 42 source files matched against 312 vendor signatures, 17 crawled routes, and 3 personas; server-side destinations not observable").

```ts
interface CoverageRecord {
  id: CoverageId;
  scope: "STATIC" | "RUNTIME" | "CONFIG" | "OWNER";
  // What was covered
  sourceFiles?: { scanned: number; skipped: number; skippedReasons: Record<string, number> };
  routes?: { discovered: number; visited: number; unvisitedReasons: Record<string, number> };
  personas?: PersonaId[];
  environments?: EnvironmentId[];
  signatureSets?: { name: string; version: string; count: number }[];
  interactions?: string[];              // e.g., "consent.accept_all", "form.newsletter.submit(test env)"
  // Known blind spots, always shown next to any ABSENT conclusion
  blindSpots: string[];                 // e.g., "server-to-server requests", "routes behind login"
  sufficiency: "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT";
}
```

`sufficiency` is computed by the control that consumes it. For example, `CONSENT.NOT_REQUIRED` needs runtime coverage of all public route templates under the baseline persona and at least one interaction persona. Static coverage alone yields `PARTIAL`, which produces `UNKNOWN` rather than `NOT_APPLICABLE`.

### 6.6 Schema

Common primitives (`Id`, `Confidence`, `Plane`, `EvidenceRef`, …) are defined in §32.1. Every entity below carries `facts: FactId[]`. Fields shown with values are convenience projections of the latest winning fact per predicate (§6.8). Fields that need evidence are typed `Tracked<T>`.

```ts
/** A value plus where it came from. The projection's unit of truth. */
interface Tracked<T> {
  value: T | null;                 // null = unknown
  plane: Plane;
  confidence: Confidence;
  evidence: EvidenceRef[];         // ≥1 unless plane = OWNER_ASSERTED
  conflicts?: FactId[];            // other facts disagreeing on the same predicate
}

interface WebsiteRealityModel {
  schemaVersion: "1.0";
  run: RunIdentity;                // commit, tree digest, engine & pack versions, environments, personas
  sealed: boolean;
  project: ProjectModel;
  deployment: DeploymentModel;
  environments: EnvironmentModel[];
  routes: RouteModel[];
  forms: FormModel[];
  dataElements: DataElement[];
  dataFlows: DataFlow[];
  serverStores: ServerStore[];
  clientStorage: ClientStorageItem[];
  networkDestinations: NetworkDestination[];
  vendors: VendorRef[];            // full Vendor records in §26 / §32
  auth: AuthModel;
  communication: CommunicationModel;
  analytics: AnalyticsModel;
  audience: AudienceModel;
  regions: RegionModel;
  languages: LanguageModel;
  commerce: CommerceModel;
  content: ContentModel;
  ai: AiModel;
  search: SearchModel;
  accessibility: AccessibilitySnapshot;
  security: SecurityPosture;
  identity: IdentityModel;         // §21.5
  designSystem?: DesignSystemModel;// §51.2, present when design-system-reconnaissance ran
  admin?: AdminCapabilityModel;    // §52.3, present when admin discovery ran
  declarations: DeclaredClaim[];   // §27.2, the DECLARED plane in structured form
  capabilities: CapabilityState[];
  coverage: CoverageRecord[];
  unknowns: UnknownItem[];         // explicit list of important unresolved predicates
}

/* ───────────── PROJECT / DEPLOYMENT ───────────── */

interface ProjectModel {
  name: Tracked<string>;                         // package name, not necessarily the product name
  frameworks: { id: FrameworkId; version: Tracked<string>; adapter: AdapterId | "generic" }[];
  runtime: Tracked<"node" | "bun" | "deno" | "edge" | "python" | "php" | "ruby" | "go" | "other">;
  packageManager: Tracked<"npm" | "pnpm" | "yarn" | "bun" | "none">;
  buildSystem: Tracked<string>;                  // vite, turbopack, webpack, astro, …
  renderingModes: { routePattern: string; mode: "SSR" | "SSG" | "ISR" | "CSR" | "EDGE" | "STATIC_FILE" }[];
  apiArchitecture: Tracked<("ROUTE_HANDLERS" | "SERVER_ACTIONS" | "REST" | "GRAPHQL" | "RPC" | "BAAS_DIRECT" | "SEPARATE_BACKEND")[]>;
  dataPlatforms: { id: DataPlatformId; adapter: AdapterId | "generic"; evidence: EvidenceRef[] }[]; // supabase, firebase, prisma, drizzle, mongoose…
  monorepo: Tracked<boolean>;
  appRoot: string;                               // relative path of the analyzed app
  scripts: { name: string; command: string; executed: false }[]; // recorded, never executed by default
  testTooling: Tracked<string[]>;
  lintTooling: Tracked<string[]>;
  formatter: Tracked<string | null>;
}

interface DeploymentModel {
  hosting: Tracked<HostingId | "unknown">;       // vercel, netlify, cloudflare, container, static, traditional
  deploymentModel: Tracked<"STATIC" | "SERVERLESS" | "EDGE" | "LONG_RUNNING" | "HYBRID">;
  productionOrigins: Tracked<string[]>;          // OWNER_ASSERTED or CONFIGURED
  canonicalHost: Tracked<string | null>;
  httpsEnforced: Tracked<boolean>;
  previewBehavior: Tracked<{ noindexHeader: boolean; authProtected: boolean } | null>;
  headersConfigSources: string[];                // files where headers can be set
  redirectConfigSources: string[];
  notFoundBehavior: Tracked<"FRAMEWORK_404" | "SPA_FALLBACK_200" | "HOST_DEFAULT_404" | "CUSTOM_404_FILE" | "UNKNOWN">;
  infrastructureLogging: Tracked<InfraLoggingFacts | null>; // what the host logs (IP, UA), from hosting adapter + owner
}

interface InfraLoggingFacts {
  logsIpAddresses: boolean | null;
  logsUserAgents: boolean | null;
  retentionDescription: string | null;           // from provider documentation, cited
  sourceUrl: string | null;
}

interface EnvironmentModel {
  id: EnvironmentId;                             // "local" | "preview" | "production" | custom
  kind: "LOCAL" | "PREVIEW" | "STAGING" | "PRODUCTION";
  baseUrl: string;
  allowedProbeClasses: ProbeSafetyClass[];       // §29.3
  reachable: Tracked<boolean>;
}

/* ───────────── ROUTES ───────────── */

interface RouteModel {
  id: RouteId;
  pattern: string;                               // "/blog/[slug]"
  sampleUrls: string[];                          // concrete URLs probed
  source: { file?: string; kind: "FILE_ROUTE" | "CONFIG_ROUTE" | "CLIENT_ROUTE" | "CRAWLED" | "SITEMAP" | "REDIRECT" };
  locale: Tracked<string | null>;
  intent: Tracked<RouteIntent>;                  // §20.2
  auth: Tracked<"PUBLIC" | "OPTIONAL" | "REQUIRED" | "ROLE_REQUIRED">;
  roles?: Tracked<string[]>;
  status: { environment: EnvironmentId; url: string; code: number; redirectedTo?: string; evidence: EvidenceRef }[];
  head: { raw: HeadSnapshot; rendered: HeadSnapshot }; // without JS vs after JS (§20.4)
  h1: Tracked<string[]>;
  indexability: Tracked<IndexabilityVerdict>;    // computed, §20.6
  inSitemap: Tracked<boolean>;
  internalInlinks: number;
  handlesPersonalData: Tracked<boolean>;
  surfaceKinds: SurfaceKind[];                   // e.g., LEGAL_PRIVACY, CONSENT_SETTINGS, ERROR_404, ADMIN, CHECKOUT
}

type RouteIntent =
  | "PUBLIC_INDEXABLE" | "PUBLIC_NOINDEX" | "PRIVATE_AUTH" | "ADMIN"
  | "UTILITY"           // callbacks, webhooks, APIs, OAuth redirects
  | "TRANSACTIONAL"     // checkout steps, thank-you pages, unsubscribe confirmations
  | "ERROR" | "STAGING_OR_INTERNAL" | "UNKNOWN";

interface HeadSnapshot {
  title: string | null;
  metaDescription: string | null;
  canonical: string[];                           // arrays to catch duplicates
  robotsMeta: string[];
  xRobotsTag: string[];
  hreflang: { lang: string; href: string }[];
  og: Record<string, string[]>;
  twitter: Record<string, string[]>;
  icons: { rel: string; href: string; sizes?: string; type?: string }[];
  manifest: string | null;
  jsonLd: { raw: string; parsed: unknown | null; parseError?: string }[];
  htmlLang: string | null;
  htmlDir: string | null;
  viewport: string | null;
  themeColor: string[];
}

/* ───────────── FORMS / DATA ───────────── */

interface FormModel {
  id: FormId;
  routeIds: RouteId[];
  purpose: Tracked<"CONTACT" | "NEWSLETTER" | "SIGNUP" | "LOGIN" | "PASSWORD_RESET" | "CHECKOUT" | "PROFILE" | "SEARCH" | "UPLOAD" | "SUPPORT" | "RIGHTS_REQUEST" | "OTHER">;
  fields: { name: string; type: string; label: Tracked<string | null>; autocomplete: string | null; required: boolean; dataElement?: DataElementId }[];
  submitsTo: Tracked<{ kind: "SAME_ORIGIN_API" | "SERVER_ACTION" | "THIRD_PARTY" | "BAAS" | "MAILTO" | "UNKNOWN"; target: string }>;
  consentControls: { label: string; preChecked: boolean; purpose: Tracked<string> }[];
  protections: Tracked<{ csrf: boolean | null; rateLimit: boolean | null; captcha: VendorId | null; serverValidation: boolean | null }>;
  a11y: { labelled: boolean | null; errorsAssociated: boolean | null; evidence: EvidenceRef[] };
}

interface DataElement {
  id: DataElementId;
  name: string;                                  // "email", "users.date_of_birth"
  dataClass: DataClass;                          // §12.2 taxonomy
  sensitivity: "PUBLIC" | "PERSONAL" | "SENSITIVE" | "SPECIAL_CATEGORY" | "CHILDREN" | "CREDENTIAL" | "FINANCIAL";
  subjects: ("VISITOR" | "USER" | "CUSTOMER" | "CHILD" | "EMPLOYEE" | "THIRD_PARTY_PERSON")[];
  sources: { kind: "FORM" | "OAUTH_PROFILE" | "DEVICE" | "INFERRED_BY_APP" | "IMPORT" | "THIRD_PARTY" | "INFRASTRUCTURE"; ref: string }[];
  collectionPoints: { routeId?: RouteId; formId?: FormId; code?: CodeLocation }[];
  purposes: Tracked<string[]>;                   // candidate purposes; owner confirms
  necessity: Tracked<"REQUIRED_FOR_SERVICE" | "OPTIONAL" | "UNNECESSARY_CANDIDATE" | "UNKNOWN">;
  storage: { storeId: ServerStoreId | ClientStorageId; location: string }[];
  retention: Tracked<RetentionFact>;
  recipients: { vendorId?: VendorId; internalRole?: string; flowId: DataFlowId }[];
  deletion: Tracked<DeletionBehavior>;           // §17.5
  exportable: Tracked<boolean>;
  legalBasisCandidates?: { basis: string; pack: PackId; confidence: Confidence; requiresReview: true }[];
  exposure: {                                    // unintended exposure checks, §12.5
    inUrls: Tracked<boolean>;
    inAnalytics: Tracked<boolean>;
    inErrorReports: Tracked<boolean>;
    inLogs: Tracked<boolean>;
    inThirdPartyRequests: Tracked<boolean>;
    inSessionReplay: Tracked<boolean>;
  };
  disclosedInPolicy: Tracked<boolean>;           // filled by policy-consistency
}

interface RetentionFact {
  kind: "EXPLICIT_TTL" | "SCHEDULED_CLEANUP" | "PROVIDER_SETTING" | "INDEFINITE" | "SOFT_DELETE_ONLY" | "OWNER_POLICY" | "UNKNOWN";
  duration?: string;                             // ISO-8601 duration, only if enforced or owner-asserted
  enforcedBy?: CodeLocation | string;
}

interface DataFlow {
  id: DataFlowId;
  dataElements: DataElementId[];
  from: FlowNode;                                // BROWSER | SERVER | STORE | VENDOR
  to: FlowNode;
  trigger: string;                               // "page_load", "form.submit:newsletter", "cron:nightly"
  transport: "BROWSER_REQUEST" | "SERVER_REQUEST" | "SDK" | "WEBHOOK" | "EMAIL" | "DB_WRITE";
  consentDependency: Tracked<ConsentCategory | "NONE" | "UNKNOWN">;
  crossBorder: Tracked<{ fromRegion: string | null; toRegion: string | null } | null>;
  evidence: EvidenceRef[];
}

/* ───────────── STORAGE ───────────── */

interface ServerStore {
  id: ServerStoreId;
  kind: "SQL_TABLE" | "DOCUMENT_COLLECTION" | "KV" | "OBJECT_STORAGE" | "SEARCH_INDEX" | "QUEUE" | "SESSION_STORE" | "LOG_SINK" | "CACHE" | "THIRD_PARTY_STORE";
  name: string;
  platform: DataPlatformId | VendorId;
  fields?: { name: string; type: string; dataElement?: DataElementId; nullable?: boolean }[];
  ownerKey?: Tracked<string>;                    // column linking rows to a user (e.g., user_id)
  accessControl: Tracked<"RLS_ENABLED" | "RLS_DISABLED" | "RULES_OPEN" | "RULES_RESTRICTED" | "SERVER_ONLY" | "UNKNOWN">;
  softDeleteColumn?: string;
  ttlOrCleanup?: Tracked<RetentionFact>;
  publicAccess?: Tracked<boolean>;               // e.g., public bucket
}

interface ClientStorageItem {
  id: ClientStorageId;
  mechanism: "COOKIE_HTTP" | "COOKIE_JS" | "LOCAL_STORAGE" | "SESSION_STORAGE" | "INDEXED_DB" | "CACHE_STORAGE" | "SERVICE_WORKER" | "OTHER";
  name: string;                                  // cookie name, storage key, DB name
  domain: string | null;
  path: string | null;
  partyContext: "FIRST_PARTY" | "THIRD_PARTY";
  expiry: { kind: "SESSION" | "PERSISTENT"; maxAgeSeconds?: number } | null;
  attributes?: { secure: boolean; httpOnly: boolean; sameSite: "Strict" | "Lax" | "None" | null; partitioned?: boolean };
  valueShape: "OPAQUE_ID" | "JWT" | "JSON" | "BOOLEAN_FLAG" | "PREFERENCE" | "UNKNOWN"; // value itself never stored raw
  initiator: { scriptUrl?: string; vendorId?: VendorId; code?: CodeLocation; responseHeaderOf?: string };
  purpose: Tracked<StoragePurpose>;              // §13.3; UNKNOWN never collapses to STRICTLY_NECESSARY
  setBeforeConsent: Tracked<boolean>;
  setAfterReject: Tracked<boolean>;
  observedInPersonas: PersonaId[];
}

type StoragePurpose =
  | "STRICTLY_NECESSARY" | "SECURITY" | "AUTHENTICATION" | "PREFERENCE" | "FUNCTIONALITY"
  | "ANALYTICS" | "PERFORMANCE" | "ADVERTISING" | "PERSONALIZATION" | "SOCIAL" | "CONSENT_STATE" | "UNKNOWN";

/* ───────────── NETWORK ───────────── */

interface NetworkDestination {
  id: NetworkDestinationId;
  origin: string;                                // scheme + host (+ port)
  registrableDomain: string;
  vendorId: VendorId | null;
  side: "BROWSER" | "SERVER";
  firstParty: boolean;
  resourceTypes: ("script" | "xhr" | "fetch" | "beacon" | "image" | "font" | "stylesheet" | "frame" | "media" | "websocket" | "other")[];
  triggers: { persona: PersonaId; phase: "PRE_INTERACTION" | "POST_ACCEPT" | "POST_REJECT" | "POST_WITHDRAW" | "INTERACTION"; routeId: RouteId }[];
  dataSent: { kind: "COOKIE" | "QUERY_PARAM" | "BODY_FIELD" | "HEADER" | "REFERRER" | "CANARY_MATCH"; key: string; dataElement?: DataElementId; encoding?: "RAW" | "URL" | "BASE64" | "SHA256" | "MD5" }[];
  purpose: Tracked<string>;
  essentialCandidate: Tracked<"ESSENTIAL" | "NON_ESSENTIAL" | "UNKNOWN">;
  permittedByCsp: Tracked<boolean | null>;
  evidence: EvidenceRef[];
}

/* ───────────── AUTH / COMMUNICATION / ANALYTICS ───────────── */

interface AuthModel {
  present: Tracked<boolean>;
  providers: { kind: "PASSWORD" | "MAGIC_LINK" | "OTP" | "OAUTH" | "SAML" | "PASSKEY" | "BAAS"; vendorId?: VendorId; scopes?: string[]; profileFieldsRequested?: string[] }[];
  emailVerification: Tracked<boolean>;
  passwordReset: Tracked<{ present: boolean; tokenInUrl: boolean | null; expiry: string | null }>;
  mfa: Tracked<"NONE" | "OPTIONAL" | "REQUIRED" | "ROLE_REQUIRED">;
  session: Tracked<{ mechanism: "COOKIE" | "LOCAL_STORAGE_TOKEN" | "MEMORY"; cookieIds?: ClientStorageId[]; lifetime?: string }>;
  logout: Tracked<{ clearsServerSession: boolean | null; clearsClientTokens: boolean | null }>;
  roles: Tracked<{ name: string; source: CodeLocation | string }[]>;
  accountDeletion: Tracked<{ present: boolean; entry: RouteId | null; behavior: DeletionBehavior | null }>;
  accountExport: Tracked<{ present: boolean; entry: RouteId | null }>;
  bruteForceProtection: Tracked<boolean | null>;
}

interface CommunicationModel {
  channels: { kind: "EMAIL" | "SMS" | "PUSH" | "IN_APP" | "WEBHOOK_TO_USER"; vendorId: VendorId | null; sendSites: CodeLocation[] }[];
  streams: MessageStream[];                      // §16.2
  unsubscribe: Tracked<{ link: boolean; listUnsubscribeHeader: boolean; oneClick: boolean; endpoint: string | null }>;
  preferenceCenter: Tracked<RouteId | null>;
  suppression: Tracked<{ present: boolean; enforcedAt: CodeLocation[]; bypasses: CodeLocation[] }>;
  senderIdentity: Tracked<{ fromName: string | null; fromDomain: string | null; postalAddressPresent: boolean | null }>;
  dnsAuthentication: Tracked<{ spf: boolean | null; dkim: boolean | null; dmarc: string | null }>;
}

interface AnalyticsModel {
  providers: {
    vendorId: VendorId;
    loading: "DIRECT_SCRIPT" | "NPM_SDK" | "TAG_MANAGER" | "SERVER_SIDE" | "PROXY_FIRST_PARTY";
    initPoint: CodeLocation | null;
    initTiming: Tracked<"BEFORE_CONSENT" | "AFTER_CONSENT" | "CONSENT_MODE_PINGS_BEFORE_CONSENT" | "NO_CONSENT_MECHANISM" | "UNKNOWN">;
    identifiers: ClientStorageId[];
    userIdSet: Tracked<boolean>;
    ipHandling: Tracked<string | null>;          // provider setting, CONFIGURED or OWNER_ASSERTED
    advertisingFeatures: Tracked<boolean | null>;
    sessionReplay: Tracked<{ enabled: boolean; maskAllInputs: boolean | null; canaryCaptured: boolean | null } | null>;
    heatmaps: Tracked<boolean | null>;
    retentionSetting: Tracked<string | null>;
    events: { name: string; properties: string[]; piiSuspects: string[]; evidence: EvidenceRef[] }[];
  }[];
  tagManagers: { vendorId: VendorId; containerIds: string[]; consentIntegration: Tracked<string | null> }[];
}

/* ───────────── AUDIENCE / REGIONS / LANGUAGES ───────────── */

interface AudienceModel {
  assessment: Tracked<"GENERAL" | "LIKELY_CHILD_ACCESS" | "CHILD_DIRECTED" | "MIXED" | "EDUCATION" | "ADULT_ONLY" | "UNKNOWN">;
  signals: { kind: AudienceSignalKind; description: string; weight: "STRONG" | "MODERATE" | "WEAK"; evidence: EvidenceRef[] }[];
  ageCollection: Tracked<{ collected: boolean; field: DataElementId | null; purpose: string | null }>;
  ageGate: Tracked<{ present: boolean; neutral: boolean | null; retryPrevented: boolean | null } | null>;
  actualKnowledgeSignals: EvidenceRef[];         // e.g., profile field "grade", support messages mentioning age
  ownerPolicy: Tracked<{ minimumAge: number | null; childDirected: boolean | null }>; // OWNER_ASSERTED
}

interface RegionModel {
  operator: { country: Tracked<string | null>; freeZone: Tracked<"DIFC" | "ADGM" | "OTHER" | "NONE" | null> }; // never inferred from hosting
  targetMarkets: Tracked<string[]>;              // ISO 3166 codes; OWNER_ASSERTED is authoritative
  signals: { kind: "CURRENCY" | "SHIPPING" | "LANGUAGE" | "PHONE_FORMAT" | "ADDRESS_FORMAT" | "TLD" | "CONTENT_MENTION" | "PAYMENT_METHODS" | "HOSTING_REGION"; value: string; confidence: Confidence; evidence: EvidenceRef[] }[];
  userConfiguredComplianceRegions: Tracked<string[]>;
}

interface LanguageModel {
  locales: { tag: string; direction: "ltr" | "rtl"; default: boolean }[];
  urlStrategy: Tracked<"PATH_PREFIX" | "SUBDOMAIN" | "DOMAIN" | "QUERY" | "COOKIE_ONLY" | "NONE">;
  selector: Tracked<{ present: boolean; persistence: ClientStorageId | null }>;
  fallback: Tracked<string | null>;
  completeness: { surface: SurfaceKind; locale: string; status: "COMPLETE" | "PARTIAL" | "MISSING" | "MACHINE_TRANSLATED_UNREVIEWED"; evidence: EvidenceRef[] }[];
  untranslatedStrings: { locale: string; sample: string; location: string }[];
  libraries: string[];
}

/* ───────────── COMMERCE / CONTENT / AI ───────────── */

interface CommerceModel {
  sellsProducts: Tracked<boolean>;
  subscriptions: Tracked<{ present: boolean; autoRenew: boolean | null; trials: boolean | null; billingPeriods: string[] }>;
  paymentProviders: { vendorId: VendorId; integration: "HOSTED_REDIRECT" | "EMBEDDED_PROVIDER_FIELDS" | "DIRECT_CARD_DATA" | "UNKNOWN"; webhookVerified: Tracked<boolean | null>; idempotent: Tracked<boolean | null> }[];
  serverTouchesCardData: Tracked<boolean>;
  pricingDisclosure: Tracked<{ taxInclusive: boolean | null; currencies: string[]; renewalTermsShown: boolean | null }>;
  refunds: Tracked<{ policyRoute: RouteId | null; implemented: boolean | null }>;
  cancellation: Tracked<{ path: RouteId[]; stepsToCancel: number | null; stepsToSubscribe: number | null; online: boolean | null }>;
  receipts: Tracked<boolean | null>;
  taxHandling: Tracked<string | null>;
}

interface ContentModel {
  kinds: ("STATIC" | "BLOG" | "UGC_POSTS" | "COMMENTS" | "PROFILES_PUBLIC" | "MESSAGING" | "UPLOADS" | "FEEDS" | "REVIEWS" | "LISTINGS")[];
  moderation: Tracked<{ reporting: boolean; queue: boolean; blocking: boolean; appeals: boolean } | null>;
  uploads: Tracked<{ types: string[]; maxSize: string | null; storage: ServerStoreId | null; publicByDefault: boolean | null; scanned: boolean | null } | null>;
  visibilityDefaults: Tracked<Record<string, "PUBLIC" | "PRIVATE" | "FOLLOWERS" | "UNKNOWN">>;
}

interface AiModel {
  present: Tracked<boolean>;
  integrations: {
    vendorId: VendorId;
    calledFrom: "BROWSER" | "SERVER";
    keyExposure: Tracked<"SERVER_ONLY" | "CLIENT_BUNDLE" | "UNKNOWN">;
    inputs: DataElementId[];                     // prompts, files, user content
    outputsStored: Tracked<ServerStoreId | null>;
    providerRetentionAndTraining: Tracked<string | null>; // OWNER_ASSERTED; not detectable
    moderation: Tracked<boolean | null>;
    rateLimited: Tracked<boolean | null>;
    authenticatedOnly: Tracked<boolean | null>;
    usedForSignificantDecisions: Tracked<boolean | null>;
    userFacingDisclosure: Tracked<boolean | null>;
  }[];
}

/* ───────────── SEARCH / A11Y / SECURITY SNAPSHOTS ───────────── */

interface SearchModel {
  robotsTxt: Tracked<{ url: string; status: number; body: EvidenceRef; parsedGroups: unknown; sitemaps: string[] } | null>;
  sitemaps: { url: string; status: number; urls: number; invalidEntries: number; evidence: EvidenceRef }[];
  canonicalPolicy: Tracked<{ host: string | null; trailingSlash: "ALWAYS" | "NEVER" | "MIXED" | null; strippedParams: string[] }>;
  duplicateClusters: { urls: string[]; reason: string }[];
  structuredData: { routeId: RouteId; types: string[]; valid: boolean; consistentWithVisible: Tracked<boolean> }[];
  searchConsole: Tracked<{ verified: boolean | null; method: string | null }>;
}

interface AccessibilitySnapshot {
  target: { standard: "WCAG"; version: "2.2" | string; level: "A" | "AA" | "AAA" };
  sampledRoutes: RouteId[];
  processes: string[];                           // complete flows tested, e.g., "signup", "consent", "checkout"
  automatedViolations: number;
  manualRequired: string[];                      // success criteria ids not conclusively automatable
}

interface SecurityPosture {
  headers: { environment: EnvironmentId; routeId: RouteId; headers: Record<string, string[]>; evidence: EvidenceRef }[];
  secretsFindings: number;                       // details live in findings, not in the model
  cookieAttributes: ClientStorageId[];
  cors: Tracked<{ reflectsOrigin: boolean; allowCredentials: boolean } | null>;
  dependencies: { total: number; direct: number; knownVulnerable: number; lockfile: boolean };
  rateLimiting: Tracked<Record<string, boolean | null>>; // per sensitive endpoint class
}

/* ───────────── CAPABILITIES / UNKNOWNS ───────────── */

interface CapabilityState {
  id: CapabilityId;                              // §6.7
  state: "PRESENT" | "ABSENT" | "SUSPECTED" | "UNKNOWN";
  confidence: Confidence;
  derivedFrom: FactId[];
  coverage?: CoverageId;                         // REQUIRED when state = ABSENT
}

interface UnknownItem {
  predicate: string;                             // "retention(users.email)"
  importance: "BLOCKING" | "HIGH" | "NORMAL";
  resolvableBy: ("OWNER" | "RUNTIME_PROBE" | "TEST_ENVIRONMENT" | "CREDENTIALED_API" | "LEGAL")[];
  questionId?: QuestionId;
}
```

### 6.7 Capability derivation

Capabilities are named, evidence-backed predicates that the planner and rule applicability use. They are defined in `rules/capabilities.yaml` as predicates over facts (using the language in §8.4). An illustrative subset:

| Capability | `PRESENT` when (any, confidence ≥ HIGH) | `SUSPECTED` when | `ABSENT` requires coverage of |
| --- | --- | --- | --- |
| `HAS_ANALYTICS` | An analytics vendor is observed at runtime, or its init call is implemented in reachable code | Only a dependency in `package.json` | All public route templates, baseline and accept-all personas, and a full static scan |
| `HAS_SESSION_REPLAY` | A replay vendor is observed, or replay is enabled in SDK config | SDK present with unknown config | Same as analytics |
| `HAS_ADVERTISING` | An ad or pixel vendor is observed, or conversion API calls exist | Tag manager container not inspectable | Runtime accept-all persona, tag manager contents, static scan |
| `HAS_AUTH` | Login route responds, or an auth SDK is initialized with UI | Auth dependency only | Static scan and route crawl |
| `HAS_PRIVATE_CONTENT` | A route returns 401/403 or redirects to login when unauthenticated | Route names like `/dashboard` | Crawl of all declared routes unauthenticated |
| `HAS_MARKETING_EMAIL` | Newsletter form submits to an email provider list, or campaign/broadcast API use | Email provider present, stream unclassified | Static scan of send sites, forms |
| `HAS_TRANSACTIONAL_EMAIL` | Send calls triggered by account or order events | — | Static scan of send sites |
| `HAS_PAYMENTS` | Payment SDK initialized, or checkout redirect observed | Payment dependency only | Static and runtime |
| `HAS_SUBSCRIPTIONS` | Recurring price or subscription API usage | Pricing page with "/mo" text only | Static |
| `HAS_USER_CONTENT` | Other users' content is rendered from stored user input | Comment component unused | Static and runtime |
| `HAS_UPLOADS` | File input posting to storage | — | Static and runtime |
| `HAS_MINOR_AUDIENCE` | Owner asserts child-directed, or strong directed-to-children signals | Moderate signals | Owner assertion, or signal scan with no moderate or strong signals |
| `HAS_MULTIPLE_LOCALES` | ≥2 locales served | Locale files present but unrouted | Static and runtime |
| `HAS_RTL_LOCALE` | A served locale has RTL direction | — | Same as locales |
| `HAS_GEOLOCATION` | `navigator.geolocation` called or IP-geo vendor used for personalization | — | Static and runtime |
| `HAS_DEVICE_PERMISSIONS` | Camera, microphone, or notifications requested | — | Static and runtime |
| `HAS_AI` | AI vendor SDK or API calls in reachable code | Dependency only | Static |
| `HAS_PUBLIC_CONTENT` | At least one `PUBLIC_INDEXABLE` route | — | Crawl |
| `HAS_NON_ESSENTIAL_CLIENT_TECH` | Any client storage or network destination whose purpose is not `STRICTLY_NECESSARY`, `SECURITY`, `AUTHENTICATION`, or `CONSENT_STATE`, including `UNKNOWN` | — | Runtime coverage as for analytics, plus embed interaction personas |
| `HAS_ADMIN_SURFACE` | Admin routes, role checks, or admin APIs exist | — | Static |
| `HAS_CAPTCHA` | CAPTCHA vendor observed or implemented | — | Static and runtime |

`HAS_NON_ESSENTIAL_CLIENT_TECH` is the capability that decides whether consent machinery is even considered. Treating `UNKNOWN` purposes as non-essential is intentional: unknown tracking must never be silently classified as essential.

### 6.8 Precedence between planes

When a predicate has facts from several planes, the projection chooses a winning value **for display and planning only**. All facts are kept, and disagreements are always evaluated for contradictions.

| Predicate class | Precedence (highest first) | Rationale |
| --- | --- | --- |
| Behavioral (what happens: requests, storage, status codes, headers) | `OBSERVED` > `IMPLEMENTED` > `CONFIGURED` > `OWNER_ASSERTED` > `INFERRED` | Reality beats intention. If the owner says "no analytics" and the probe sees GA, GA is real. |
| Business and legal facts (operator identity, target markets, retention policy, age policy) | `OWNER_ASSERTED` > `DECLARED` > `INFERRED` | The system cannot detect these. The site's own text is a weaker source than the owner. |
| Vendor account settings (IP anonymization, training opt-out, retention) | `CONFIGURED` (API-read, credentialed) > `OWNER_ASSERTED` > `IMPLEMENTED` (SDK flags) > `INFERRED` | Often invisible from code; must be attested. |
| Declarations (what the site says) | `DECLARED` only | A declaration is a fact about the site's statements, not about behavior. |

### 6.9 Model lifecycle

```text
BUILT ──classify──► AMENDED ──owner answers──► AMENDED ──seal──► SEALED(commit C)
                                                                   │
                            remediation wave changes files ────────┤
                                                                   ▼
                                           SUPERSEDED ──re-recon of changed surfaces──► SEALED(commit C', revision n+1)
```

- A sealed model is immutable. Amendments create a new revision with a parent pointer.
- After each remediation wave, the orchestrator runs **targeted re-reconnaissance** on the surfaces the change sets touched (for example, after consent gating: the runtime network capture for all personas). This produces a new sealed revision. The final verification (P12) always performs full reconnaissance from a clean state.
- Owner answers are recorded in `config.yaml`, not just in the run, so they persist.

---

## 7. Evidence Model

### 7.1 Principles

1. **Immutable and content-addressed.** Artifacts are stored under `artifacts/sha256/<hash>`. Evidence records reference artifacts by hash.
2. **Redacted at capture, not at report time.** Secrets and personal values never reach disk in raw form (§7.3).
3. **Reproducible.** Every evidence record includes a reproduction recipe (engine command and parameters).
4. **Typed.** Evidence types determine how a record is rendered and validated, and what confidence it can support.
5. **Attributable.** The collector (engine probe, static analyzer, agent, owner) is always recorded.

### 7.2 Evidence types

| Type | Collector | Artifact | Max confidence |
| --- | --- | --- | --- |
| `SOURCE_LOCATION` | Static analyzer | File path, line range, code excerpt (secrets masked) | CONFIRMED (as to presence in code) |
| `AST_MATCH` | Static analyzer | Matched node kind and excerpt | CONFIRMED |
| `DEPENDENCY` | Static analyzer | Package, version, lockfile path | CONFIRMED |
| `CONFIG_VALUE` | Config parser or adapter | File, key path, value (masked if secret-like) | CONFIRMED |
| `DB_SCHEMA` | Data adapter | Table or collection definition, migration file | CONFIRMED |
| `HTTP_EXCHANGE` | HTTP probe | Request line, status, headers (redacted), body hash plus a truncated body when textual | CONFIRMED |
| `HTML_SNAPSHOT` | HTTP or browser probe | Raw HTML (no JS) or serialized rendered DOM | CONFIRMED |
| `HEAD_EXTRACT` | Browser probe | Structured `HeadSnapshot` | CONFIRMED |
| `NETWORK_LOG` | Browser probe | Ordered request list with timestamps relative to navigation and to consent events, initiator stack, redacted payloads | CONFIRMED |
| `COOKIE_JAR` | Browser probe | Cookie names, domains, attributes, expiry, value shape and hash | CONFIRMED |
| `STORAGE_DUMP` | Browser probe | Keys per mechanism, value shape and hash | CONFIRMED |
| `DOM_STATE` | Browser probe | Selector, accessible name and role, computed styles, bounding box | CONFIRMED |
| `SCREENSHOT` | Browser probe | PNG, viewport, theme, direction, persona | CONFIRMED (visual state) |
| `A11Y_SCAN` | Accessibility probe | Engine rule id, nodes, impact, tool version | HIGH (tools have false positives and negatives) |
| `KEYBOARD_TRACE` | Keyboard probe | Sequence of focused elements, visibility of focus, trap detection | CONFIRMED |
| `CANARY_MATCH` | Egress analyzer | Canary id, destination, location in request, encoding | CONFIRMED |
| `DNS_RECORD` | DNS probe | Record type, value | CONFIRMED |
| `TEST_RESULT` | Verification engine | Test id, assertions, pass/fail, logs | CONFIRMED |
| `DOCUMENT_QUOTE` | Claim extractor (agent) validated by engine | Document artifact hash, character offsets, verbatim quote | CONFIRMED (the quote exists); the interpretation is a separate `INFERRED` fact |
| `OWNER_STATEMENT` | Owner via config or question | Key, value, confirmer, timestamp | CONFIRMED (as the owner's statement) |
| `AGENT_OBSERVATION` | Agent in degraded mode | Command run and raw output saved as an artifact | HIGH at most |
| `EXTERNAL_API_RESULT` | Credentialed integration (Search Console, provider API) | Endpoint, response excerpt | CONFIRMED |

### 7.3 Redaction and sensitivity

Redaction runs inside the probe before anything is written.

| Data | Stored as |
| --- | --- |
| Cookie and storage values | Value shape plus a SHA-256 hash with a per-run salt. JWTs: header `alg` and claim *names* only. |
| `Authorization`, `Cookie`, `Set-Cookie` values, API keys, tokens in URLs | `«redacted:<kind>:<hash8>»` |
| Request bodies to third parties | Field names, value shapes, canary matches. Raw values only for fields matching a canary (which are synthetic) or explicitly non-personal allowlisted keys (event names). |
| Secret findings in code | First 4 and last 2 characters, length, and a detector id. Never the full value. |
| `.env` files | Variable **names** and whether a value is set. Values are never read into evidence. |
| Screenshots | Captured only with synthetic personas. Production screenshots of authenticated areas are not taken. |
| HTML snapshots of production | Stored; forms are never auto-filled with non-synthetic data. |

Every evidence record has a `sensitivity` label: `PUBLIC` (public HTML or headers), `INTERNAL` (source excerpts, configuration), or `RESTRICTED` (anything that could contain personal data even after redaction). Shareable report exports (§30.7) exclude `RESTRICTED` artifacts and inline only `PUBLIC` ones.

Runs are pruned by default after 30 days or when more than 10 runs exist, whichever comes first, configurable. The baseline keeps fingerprints, not evidence.

### 7.4 Schema

```ts
interface Evidence {
  id: EvidenceId;                    // "ev_" + hash of (type, locator, artifact hash)
  type: EvidenceType;
  collector: { kind: "ENGINE_PROBE" | "STATIC_ANALYZER" | "ADAPTER" | "AGENT" | "OWNER" | "EXTERNAL_API"; name: string; version: string };
  source: {                          // where it came from
    environment?: EnvironmentId;
    persona?: PersonaId;
    url?: string;
    file?: string;
    lines?: [number, number];
    selector?: string;
    commit: string;
  };
  observedAt: string;                // ISO-8601 UTC
  observedValue: unknown;            // redacted, type-specific structure
  expectedValue?: unknown;           // set when evidence is produced in service of a check
  artifact?: { sha256: string; mediaType: string; bytes: number };
  sensitivity: "PUBLIC" | "INTERNAL" | "RESTRICTED";
  confidence: Confidence;            // bounded by the type's max (table in §7.2)
  reproduce: { command: string; args: Record<string, unknown> } | null; // null for owner statements
  derivedFrom?: EvidenceId[];        // e.g., a CANARY_MATCH derived from a NETWORK_LOG
  attempts?: { at: string; result: "SAME" | "DIFFERENT" }[]; // flakiness record, §29.5
}
```

### 7.5 From evidence to confidence

A fact's confidence is the maximum supported by its strongest evidence item, reduced by:

- **Staleness:** runtime evidence from a different commit than the sealed model is at most `MEDIUM`.
- **Environment mismatch:** a local-only observation used for a production claim is at most `HIGH`, and the finding records the environment.
- **Flakiness:** an observation that did not reproduce in all attempts is at most `MEDIUM` and marked flaky.
- **Degraded collection:** `AGENT_OBSERVATION` is at most `HIGH`.

### 7.6 Canary personas (Decision D-10)

Detecting personal data leaking into analytics, error monitoring, session replay, URLs, or third-party requests is unreliable with regular-expression guesses. Instead, verification personas carry **synthetic canary values** that are unique per run:

```yaml
canaries:
  email: "rv-<runid8>-canary@example.test"      # RFC 2606 reserved domain
  name: "Zyxqorin Canarywell-<runid4>"
  phone: "+1-555-01<2 random digits>"             # fictional-range style
  freeText: "rvcanary-<runid8>-freetext"
  search: "rvcanary-<runid8>-query"
```

The egress analyzer searches every outbound request (URL, query, headers, body, WebSocket frames where captured, and beacon payloads) for each canary in raw, URL-encoded, base64, lower-cased, and SHA-256 or MD5 hashed (normalized) forms. Hashed matches matter because advertising pixels commonly hash emails. A match is `CONFIRMED` evidence of transmission, with the exact destination and location.

Canaries are used only in synthetic sessions. They are typed into forms only on environments whose probe classes allow interaction (§29.3). In production they are limited to non-submitting interactions (typing into a field without submitting) unless the owner allows submission.

### 7.7 Anchoring LLM output (Decision D-09)

Any agent-produced fact that interprets content (a policy claim, a route intent, a data purpose, an audience signal) MUST be submitted through `readyvibe model amend` with:

- `evidence`: existing evidence IDs, and for document interpretations a `DOCUMENT_QUOTE` with `{artifactSha256, start, end, quote}`;
- `rationale`: a short explanation (stored, not trusted).

The engine rejects the amendment if any cited evidence ID does not exist, if a quote is not an exact substring at the stated offsets (after Unicode NFC normalization and whitespace collapsing), or if the confidence exceeds the cap in §6.4. Rejections are returned to the agent with the reason. The agent may retry once. After that, the predicate is left `UNKNOWN`.

This single mechanism removes the most dangerous LLM failure in this domain: confidently citing a policy sentence that does not exist.

### 7.8 Negative evidence

Some findings rest on things not happening (no unsubscribe link in the email template, no `noindex`, no requests to vendor X after rejection). Negative evidence is represented as the evidence of the search, not the absence: the complete `NETWORK_LOG` for the post-reject phase, or the full `HTML_SNAPSHOT`, together with the `CoverageRecord`. The finding states the searched-for pattern as `expectedValue`.
