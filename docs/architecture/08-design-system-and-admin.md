# Part VIII — Design System and Admin

## 51. Design-System Integration

### 51.1 Why a foundation skill

Without a shared design-system model, every visual specialist guesses at styling on its own. The consent banner then looks like one product, the 404 like another, and the admin panel like a third. `design-system-reconnaissance` discovers the design language once, and every visual skill consumes the same `DesignSystemModel` (D-22).

```text
                          design-system-reconnaissance
            ┌──────────┬──────────┬───────┴───────┬──────────┬────────────┐
            ▼          ▼          ▼               ▼          ▼            ▼
      admin-dashboard consent  error-pages  privacy-policy data-rights legal-navigation …
        tables, forms modal,    404, 500,    prose, TOC,    delete      footer group
        dialogs, nav  settings  maintenance  anchors        confirm,
                                                            export UI
```

### 51.2 Model

```ts
interface DesignSystemModel {
  confidence: Confidence;
  componentLibrary: Tracked<{ kind: "SHADCN" | "RADIX" | "MUI" | "CHAKRA" | "MANTINE" | "ANT" | "HEADLESS_UI" | "BOOTSTRAP" | "DAISYUI" | "CUSTOM" | "NONE"; version?: string; configFile?: string }>;
  cssStrategy: Tracked<("TAILWIND" | "CSS_MODULES" | "CSS_IN_JS" | "SASS" | "VANILLA_CSS" | "UNO" | "PANDA" | "STYLED_COMPONENTS" | "EMOTION")[]>;
  tokens: {
    source: ("TAILWIND_THEME" | "CSS_VARIABLES" | "THEME_OBJECT" | "DESIGN_TOKENS_JSON" | "INFERRED_FROM_COMPUTED")[];
    colors: TokenSet<string>;                 // name → value (per theme)
    semanticColors: Record<"primary" | "secondary" | "accent" | "destructive" | "warning" | "success" | "muted" | "background" | "foreground" | "border" | "ring" | string, TokenRef>;
    typography: { families: TokenSet<string>; scale: TokenSet<string>; weights: TokenSet<number>; lineHeights: TokenSet<string> };
    spacing: TokenSet<string>;
    radii: TokenSet<string>;
    shadows: TokenSet<string>;
    zIndex?: TokenSet<number>;
    motion: { durations: TokenSet<string>; easings: TokenSet<string>; reducedMotionHandled: Tracked<boolean> };
    breakpoints: TokenSet<string>;
  };
  themes: { names: string[]; mechanism: Tracked<"CLASS" | "DATA_ATTRIBUTE" | "MEDIA_QUERY" | "NONE">; darkMode: Tracked<boolean> };
  rtlSupport: Tracked<"LOGICAL_PROPERTIES" | "RTL_PLUGIN" | "PARTIAL" | "NONE">;
  icons: Tracked<{ library: string | null; sizeConvention: string | null; component: string | null }>;
  components: ComponentEntry[];               // inventory, below
  patterns: {
    pageLayouts: { name: string; file: string; usedBy: RouteId[] }[];   // app shell, marketing layout, docs layout
    navigation: { header: string | null; footer: string | null; sidebar: string | null };
    forms: { fieldWrapper: string | null; errorDisplay: string | null; validationLibrary: string | null };
    feedback: { toast: string | null; alert: string | null; inlineError: string | null };
    loading: { spinner: string | null; skeleton: string | null };
    emptyState: string | null;
    prose: { component: string | null; typographyPlugin: boolean };
    adminPatterns: { table: string | null; filters: string | null; pagination: string | null; detailView: string | null };
  };
  conventions: { fileNaming: string; componentDir: string; styleColocation: string; exportStyle: "NAMED" | "DEFAULT" | "MIXED" };
  a11yDefects: FindingRef[];                  // e.g., focus ring removed globally, low-contrast muted text token
}

interface ComponentEntry {
  name: string;                               // "Button"
  file: string;
  kind: "BUTTON" | "INPUT" | "SELECT" | "CHECKBOX" | "SWITCH" | "RADIO" | "TEXTAREA" | "DIALOG" | "SHEET" | "DROPDOWN" | "TABS" | "ACCORDION" | "TABLE" | "CARD" | "BADGE" | "TOAST" | "ALERT" | "TOOLTIP" | "AVATAR" | "PAGINATION" | "BREADCRUMB" | "SKELETON" | "SPINNER" | "LAYOUT" | "OTHER";
  variants: string[];                         // "default", "destructive", "outline", "ghost", …
  sizes: string[];
  usageCount: number;                         // imports across the codebase
  canonical: boolean;                         // the preferred one when duplicates exist
  a11y: { nativeElement: string | null; knownIssues: FindingRef[] };
}

type TokenSet<T> = Record<string, T | Record<string /* theme */, T>>;
```

### 51.3 Discovery methods

1. **Static:** Tailwind config and CSS-first theme blocks, CSS custom properties on `:root` and theme selectors, theme objects (MUI, Chakra, Mantine), component library configuration (for example a `components.json` for shadcn-style setups), component directories (`components/ui/**`), import frequency analysis (which `Button` is actually used), layout files, and icon imports.
2. **Runtime:** computed-style sampling on representative pages (buttons, inputs, headings, body text, links, cards, dialogs, focus states), screenshots at breakpoints, in each theme and direction. Runtime sampling catches the real design when tokens are inconsistent or absent. Values used in the product but missing from the token source are recorded as "de facto tokens".
3. **Reconciliation:** static tokens versus computed values. Divergences are recorded, and the de facto palette is what new UI must match.
4. **Duplicates:** two button implementations mean the most-used one is `canonical`. The skill never creates a third.

### 51.4 "No design system" handling

- If the project has visible pages but no formal system, the model is **inferred from computed styles** (de facto tokens and components). New UI matches the existing pages.
- If the project has essentially no styled UI (a bare prototype), visual skills use semantic HTML with minimal CSS based on system font stacks and neutral, contrast-safe colors, and raise an owner question. They do not invent a brand.
- A redesign happens only when the owner explicitly requests it.

### 51.5 Visual skill contract

Any change set with `visualChanges: true` MUST follow:

```text
1. DESIGN SYSTEM DISCOVERY   consume model.designSystem (run design-system-reconnaissance if stale)
2. COMPONENT REUSE PLAN      artifact: ui-need → chosen component → reuse level → justification
3. IMPLEMENTATION            using the chosen components, tokens, layout, conventions
4. VISUAL VERIFICATION       token conformance + layout consistency + screenshots (§51.7)
5. ACCESSIBILITY VERIFICATION wcag-readiness controls scoped to the new/changed surfaces
```

```ts
interface ComponentReusePlan {
  changeSetId: string;
  needs: {
    need: string;                           // "primary action button", "confirmation dialog", "data table with pagination"
    decision: "REUSE" | "COMPOSE" | "EXTEND" | "CREATE_SHARED" | "NEW_TOKEN" | "ISOLATED_STYLE";
    component?: string;                     // existing component used or extended
    newComponentPath?: string;
    tokensUsed: string[];
    justification?: string;                 // REQUIRED for EXTEND and above
  }[];
}
```

### 51.6 Change ladder

The priority order (from the brief), enforced by review of the reuse plan:

1. **Reuse** the existing component unchanged.
2. **Compose** existing components.
3. **Extend** an existing primitive (a new variant added in the component's own variant system, following its conventions).
4. **Create a shared component** consistent with existing tokens, placed in the project's component directory, following its conventions.
5. **Introduce a new token** only when genuinely necessary (for example an accessible text color variant). This is a `Decision` for the owner when it touches brand colors.
6. **Isolated custom styling** as a last resort, with justification. The token-conformance check still applies.

`DS.LADDER_SKIPPED` fires when a plan chooses level ≥ 4 while a suitable component at a lower level exists (a component inventory match by kind and variants).

### 51.7 Visual verification

| Check | Method | Control |
| --- | --- | --- |
| Token conformance | Collect computed `color`, `background-color`, `border-color`, `font-family`, `font-size`, `font-weight`, `border-radius`, `box-shadow`, and spacing values on every element of the new or changed surfaces; each must map to a token or de facto token (tolerance for color ΔE and px rounding) | `DS.OFF_SYSTEM_VALUE` |
| Layout consistency | New pages render inside the same layout shell (header and footer present and identical DOM signatures) unless the plan justifies a minimal variant | `DS.LAYOUT_DIVERGENCE` |
| Component identity | New UI imports the canonical components listed in the reuse plan (static import check) | `DS.NONCANONICAL_COMPONENT` |
| Themes and directions | Screenshots in each theme and in RTL where applicable; no unreadable text (contrast re-check per theme) | `DS.THEME_BREAKAGE` |
| Responsiveness | Screenshots at the project's breakpoints; overflow and overlap detection | `DS.RESPONSIVE_BREAKAGE` |
| Perceptual similarity (optional) | Compare typography and spacing rhythm to a reference page with a structural similarity metric; informational only | — |

Screenshots of new surfaces are embedded in the report so the owner can judge the result.

### 51.8 Accessibility precedence

Accessibility outranks preserving inaccessible design choices. If the existing design system has defects (focus rings removed globally, low-contrast muted text, tiny tap targets), visual skills:

- do not reproduce the defect in new UI (for example, they add a visible focus style using the `ring` token or an accessible derivative);
- report the existing defect to `wcag-readiness` for a system-level fix proposal (`DS.EXISTING_TOKEN_CONTRAST_FAIL` and similar);
- never "match" a failing contrast value to preserve consistency.

---

## 52. Admin System

### 52.1 Skills

| Skill | Owns |
| --- | --- |
| `admin-dashboard` | Admin capability discovery, the capability model, information architecture, the admin shell, modules for core entities, tables and forms, dangerous-action UX, overview attention queue, admin empty and failure states |
| `admin-authorization` | The authorization model (capabilities → roles), server-side enforcement points, BaaS policies for admin operations, and the verification matrix |
| `admin-audit-log` | The audit event model, recording at enforcement points, retention, and the audit viewer module |

`admin-dashboard` depends on `site-reconnaissance`, `data-flow-mapping` (for field sensitivity), `design-system-reconnaissance`, and `admin-authorization`. It can improve an existing admin, not only create a new one.

### 52.2 Discovery

Inputs: database schema and migrations, ORM models, API endpoints and server actions, auth providers and roles, content types (CMS collections, MDX), existing admin pages, moderation tables (reports, flags), subscriptions and payments objects, support systems (tickets, contact messages), privacy requests (`rights.matrix`), audit logs, feature-flag configuration, operational data (jobs, queues, webhooks, errors), and analytics used internally.

The discovery output is an **Admin Capability Model**. Every capability must be backed by evidence that the underlying data and operation exist, or by an explicit owner request.

### 52.3 Admin Capability Model

```ts
interface AdminCapabilityModel {
  capabilities: AdminCapability[];
  roles: { name: string; source: "EXISTING" | "PROPOSED"; capabilities: AdminCapabilityId[] }[];
  informationArchitecture: { section: string; capabilities: AdminCapabilityId[]; route: string }[];
  unresolvedDecisions: QuestionId[];
}

interface AdminCapability {
  id: AdminCapabilityId;                   // e.g., "USERS.SUSPEND"
  kind: "VIEW_USERS" | "SEARCH_USERS" | "MANAGE_USERS" | "SUSPEND_USER" | "DELETE_USER" | "VIEW_CONTENT" | "MODERATE_CONTENT"
      | "MANAGE_REPORTS" | "VIEW_PAYMENTS" | "VIEW_SUBSCRIPTIONS" | "PROCESS_REFUNDS" | "VIEW_PRIVACY_REQUESTS" | "PROCESS_PRIVACY_REQUESTS"
      | "VIEW_AUDIT_LOGS" | "MANAGE_FEATURE_FLAGS" | "VIEW_SYSTEM_HEALTH" | "MANAGE_SITE_CONTENT" | "MANAGE_EMAILS" | "MANAGE_ROLES"
      | "MANAGE_SUPPORT_REQUESTS" | string;
  entity: { store: ServerStoreId; name: string } | null;
  operation: "READ" | "LIST" | "SEARCH" | "CREATE" | "UPDATE" | "STATE_CHANGE" | "DELETE" | "EXTERNAL_ACTION";
  backing: {                               // why this capability exists
    kind: "EXISTING_OPERATION" | "DATA_WITHOUT_UI" | "DOMAIN_REQUIREMENT" | "OWNER_REQUEST";
    evidence: EvidenceRef[];               // endpoint, table, status column, rights obligation, owner answer
  };
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";   // CRITICAL: irreversible or affects money/identity/children
  destructive: boolean;
  reversible: boolean;
  fieldExposure: {                         // least-privilege field allowlist
    visible: string[];
    maskedByDefault: string[];             // revealed on explicit action, audited
    neverShown: string[];                  // password hashes, tokens, secrets, MFA secrets
  };
  searchableFields: string[];              // subset of visible, only operationally needed
  requiresReason: boolean;
  confirmation: "NONE" | "CONFIRM" | "TYPED_CONFIRM" | "STEP_UP_AUTH";
  auditEvent: string | null;               // e.g., "USER_SUSPENDED"
  involvesChildData: boolean;
  ownerSkill: SkillName;                   // "admin-dashboard" or a domain skill via the module contract
}
```

Derivation heuristics (each produces a candidate with evidence, then the owner confirms the list):

| Evidence | Candidate capability |
| --- | --- |
| A `users` table plus auth provider | `VIEW_USERS`, `SEARCH_USERS` |
| A status column (`banned`, `suspended_at`, `status`) or provider ban API | `SUSPEND_USER` |
| An existing deletion executor (`data-rights`) | `DELETE_USER` (via the rights workflow, not a raw delete) |
| `posts` or `comments` with `published` or visibility columns | `VIEW_CONTENT`, `MODERATE_CONTENT` |
| A `reports` or `flags` table | `MANAGE_REPORTS` |
| Payment provider plus orders or customers | `VIEW_PAYMENTS`; `PROCESS_REFUNDS` only if refunds are promised or owner-requested |
| Rights requests exist | `VIEW_PRIVACY_REQUESTS`, `PROCESS_PRIVACY_REQUESTS` (module owned by `data-rights`) |
| Feature-flag config in the DB | `MANAGE_FEATURE_FLAGS` |
| CMS collections or MDX content with a publish state | `MANAGE_SITE_CONTENT` |
| Contact messages stored | `MANAGE_SUPPORT_REQUESTS` |
| Role column or provider roles | `MANAGE_ROLES` (CRITICAL; super-admin only by default) |
| Job or queue tables, webhook logs | `VIEW_SYSTEM_HEALTH` |

### 52.4 Scaling to the product

| Product | Typical admin |
| --- | --- |
| Small blog | Authenticated content editing, publish and unpublish, media management. No overview page, no user management if there is one author. |
| SaaS | Users (view, search, suspend), subscriptions (view, link to provider portal), support requests, privacy requests, audit log, feature flags if present, system health if job data exists |
| Marketplace | Listings, sellers, orders, disputes, reports and moderation, payouts view (read-only by default), audit log |

Sections exist only when capabilities exist. An empty "Analytics" section is never added because other dashboards have one.

### 52.5 Information architecture

Navigation is generated from the capability model. Sections are ordered by operational frequency (attention-queue sources first) and grouped by entity. Candidate sections: Overview, Users, Content, Moderation, Reports, Orders, Payments, Subscriptions, Privacy Requests, Support, Analytics (only real internal analytics), Audit Log, Settings, System. The shell reuses the product's layout primitives (sidebar or top navigation per the design system's `patterns.navigation`), not a template sidebar.

### 52.6 Overview: an attention queue, not KPI cards

The overview answers "what requires administrator attention?" Each item is an **attention signal** bound to a real query:

```ts
interface AttentionSignal {
  id: string;                               // "pending-reports"
  label: string;                            // "Reports awaiting review"
  query: DataBinding;                       // the real data source
  threshold?: { gt: number };               // show only when relevant
  severity: "INFO" | "ATTENTION" | "URGENT";
  link: string;                             // filtered list view
}

interface DataBinding {
  source: { kind: "DB_QUERY" | "API_ENDPOINT" | "PROVIDER_API" | "BAAS_QUERY"; ref: string; code?: CodeLocation };
  fields: string[];
  permission: AdminCapabilityId;            // the viewer must hold this capability
}
```

Real signals include pending reports, unresolved support requests, privacy requests approaching deadlines (the earliest pack deadline), failed jobs or webhooks, payment disputes, content awaiting review, appeals, and pending approvals.

**No fabricated data rule:** `ADMIN.UNBOUND_METRIC` fires on any rendered number, chart, or trend in admin UI that has no `DataBinding`. This is checked statically (numeric literals and mock arrays in admin components; imports of faker or mock data in non-test admin code) and at runtime (with an empty seeded database, overview numbers must be zero or show empty states, not plausible values). With no signals available, the overview is a short landing page with navigation. It is never filled with charts.

### 52.7 Authentication versus authorization

Being logged in is not being an administrator. `admin-authorization` implements:

- **Capability-based authorization.** Roles (existing ones reused; proposed ones only as needed) map to capabilities in one policy module (`admin.authzPolicy`). Deny by default.
- **A server-side enforcement point** for every admin read and mutation, for example `requireCapability(session, "USERS.SUSPEND")` in route handlers, server actions, RPCs, and BaaS policies. The adapter generates the idiomatic form.
- **BaaS:** admin operations run server-side with service credentials after the capability check, or through RLS policies and security-definer functions that check role claims. Client-side role checks are UI hints only.
- **Admin routes** are protected at the route level (middleware or layout guard) **and** at every data operation. The route guard alone is not sufficient.
- **Role changes** are a CRITICAL capability. Roles cannot be self-assigned or escalated beyond the actor's own level, and changes are audited.

Hiding navigation links is **not** authorization. `ADMINAUTHZ.UI_ONLY_GUARD` fires when an admin operation's server path lacks an enforcement point (static call-graph check) or when the verification matrix shows a direct request succeeding.

### 52.8 Dangerous actions

| Risk | UX requirements |
| --- | --- |
| MEDIUM (reversible state changes: unpublish, suspend) | Confirmation dialog naming the target and consequence; undo where feasible; audit event |
| HIGH (delete content, refund, revoke access) | Confirmation with target, consequence, and irreversibility statement; **reason capture**; audit event; no bulk variant without an extra confirmation |
| CRITICAL (delete user, change roles, process privacy deletion, actions on child accounts) | Typed confirmation (target identifier) or **step-up authentication** (re-auth within N minutes) per owner policy; reason required; audit event; rate limiting on the operation |

Dialogs use the design system's dialog primitive and are verified by the dialog accessibility probe (§18.4). Destructive buttons use the design system's destructive variant, and the safe option receives initial focus.

### 52.9 Privacy and minors in admin

- **Least privilege:** field exposure allowlists per capability (§52.3). Personal fields not needed for the task are not shown. Sensitive fields are masked by default, with an audited "reveal" action that requires a reason.
- **No browsing unrelated personal data:** list views show operational fields only. Detail views are reached from a task context (a report, request, or ticket) where possible.
- **Privacy requests module** (owned by `data-rights` via §52.12): request type, verification state, submission date, deadlines per pack, workflow state, completion evidence. Processing uses the rights executors, never ad-hoc deletes.
- **Children's data:** capabilities touching child accounts require a dedicated capability (`involvesChildData: true`), are hidden from general support roles by default, and show minimized fields. Their activation triggers `LEGAL_REVIEW_REQUIRED` where children's packs are active.

### 52.10 Search, tables, and bulk actions

- **Search** only across `searchableFields` (operationally needed, for example email and display name for support). Never passwords, tokens, secrets, free-text sensitive fields, or special-category data. Search terms are not logged in plaintext analytics.
- **Tables:** server-side pagination (cursor-based for large sets), sorting and filtering on indexed columns, status filters from enumerated columns, accessible markup (`<table>`, `<th scope>`, caption or labelled region, sortable header buttons with `aria-sort`), responsive handling (column priority or stacked rows at small widths), and loading, empty, and error states. Unbounded client-side loading of records is never used (`ADMIN.UNBOUNDED_QUERY`).
- **Bulk actions** only where operationally useful (for example bulk-resolving spam reports). Destructive bulk actions require a count-confirmed typed confirmation, run as a background job with per-item audit events, and support partial-failure reporting.

### 52.11 Admin states, accessibility, and responsiveness

- States: no results, no records (with the next action), loading, permission denied (a 403 surface), failed fetch with retry, stale data indicator where data is cached, network failure, and partial failure (bulk).
- Accessibility: same target as the product (§18). "Only employees use it" is not an exemption. Keyboard operation of tables, dialogs, menus, and forms; toast announcements; focus management after actions.
- Responsiveness: desktop-first is acceptable when the owner states it, but the admin must remain usable (navigation reachable, tables scrollable in labelled regions, dialogs fit) at small widths unless the owner explicitly records a desktop-only constraint.

### 52.12 Admin module contract

Domain skills contribute admin modules without owning the shell:

```ts
interface AdminModule {
  id: string;                               // "privacy-requests"
  ownerSkill: SkillName;                    // "data-rights"
  capabilities: AdminCapabilityId[];
  navEntry: { section: string; label: string; order: number; badgeSignal?: string };
  routes: { path: string; component: string }[];
  attentionSignals: AttentionSignal[];
  auditEvents: string[];
}
```

`admin-dashboard` renders registered modules in its IA, and `admin-authorization` enforces their capabilities. Modules use the same design-system and state requirements.

### 52.13 Audit log (`admin-audit-log`)

```ts
interface AdminAuditEvent {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;                            // USER_SUSPENDED, USER_RESTORED, ROLE_CHANGED, CONTENT_REMOVED,
                                             // REPORT_RESOLVED, REFUND_INITIATED, PRIVACY_REQUEST_COMPLETED, FIELD_REVEALED …
  targetType: string;
  targetId: string;
  reason?: string;
  metadata?: Record<string, string | number | boolean>;  // allowlisted keys only; no secrets, no PII copies
  requestId?: string;
  timestamp: string;
}
```

- Written at the enforcement point in the same transaction as the action where possible. Otherwise an outbox pattern is used so actions cannot succeed without their audit record.
- Append-only for application roles. Viewing requires `VIEW_AUDIT_LOGS`. Retention is an owner decision (question) and appears in the privacy notice if it contains personal data.
- The viewer module: filter by actor, action, target, and date; an export for authorized roles.

### 52.14 Admin security scrutiny

Elevated checks for admin surfaces: authorization matrix (§52.15), CSRF on admin mutations, IDOR in admin APIs (an admin of org A cannot act on org B in multi-tenant apps), session lifetime and idle timeout appropriate to risk, role-escalation paths, sensitive data in admin logs, open redirects in admin login flows, dangerous uploads (import features), command-like operations (arbitrary query or script consoles are flagged CRITICAL and never generated), and admin API exposure (admin endpoints reachable without the admin guard). MFA for admin roles is recommended in proportion to risk (strongly for CRITICAL capabilities or children's or financial data) and implemented only if the auth provider supports it and the owner agrees. It is not universally forced.

### 52.15 Admin verification

A matrix generated from the capability model and roles:

| Persona | Expected |
| --- | --- |
| Anonymous | Every admin route and API: 401 or redirect; no data in responses |
| Normal user | Every admin route: 403 or redirect; **direct API calls** to each admin operation denied (for example `GET /api/admin/users` → 403) |
| Each admin role | Allowed capabilities succeed; each disallowed capability denied server-side (for example a moderator cannot `PROCESS_REFUNDS` or `MANAGE_ROLES`) |
| Lower-privileged admin | Cannot escalate their own role or assign roles above their level |
| Destructive action | Requires the declared confirmation (dialog present; API rejects requests missing the confirmation token or step-up where designed) |
| Any action | Produces the expected state change (verified by read-back) |
| Auditable action | Produces the expected audit event with correct actor, target, and reason, and no disallowed metadata |
| Field exposure | Masked fields are absent from API responses until revealed, and reveal produces an audit event |
| Empty database | Overview shows zeros or empty states; no fabricated numbers |

### 52.16 Outputs

`admin-dashboard` reports: (1) discovered capabilities with evidence; (2) proposed information architecture; (3) authorization model; (4) reused design-system primitives (the reuse plan); (5) implementation summary; (6) security findings; (7) accessibility verification; (8) runtime verification matrix results; (9) unresolved business decisions (for example "Who may issue refunds?", "Retention for audit logs?").
