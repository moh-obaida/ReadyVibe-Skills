# Part VI — Experience and Discoverability Domains

## 18. Accessibility (WCAG 2.2 AA)

### 18.1 Target and claims

- The default target is **WCAG 2.2 Level AA** (`config.accessibility.target`). Projects may choose 2.1 AA (for example when a contract references it) or add AAA criteria.
- The system produces an **evaluation**, not a conformance claim. It follows the spirit of W3C's WCAG-EM methodology: define scope, sample representative pages *and complete processes*, evaluate, and report.
- The report never states "WCAG AA passed". It states per-criterion results with the method used and lists criteria that require manual evaluation.
- Automated scanners (axe-core via the engine) find a subset of issues, and a clean scan is only one piece of evidence. `A11Y.*` findings based only on automated results are `HIGH` confidence (tools have false positives), and absence of automated violations never yields `PASS` for criteria that need human judgment.

### 18.2 Sampling

| Sample set | Contents |
| --- | --- |
| Structured sample | One route per route template, per locale direction (LTR and RTL), at mobile and desktop widths |
| Complete processes | Signup, login, password reset, checkout, consent (first layer and preferences), unsubscribe, account deletion, export, contact, rights request, and admin critical flows. Each is walked end to end in a test environment. |
| Trust and compliance surfaces | Privacy, Terms, cookie preferences, 404, 500, maintenance, support |
| Random sample | N additional crawled URLs (default 5) to catch template exceptions |
| New surfaces | Every surface created or modified by a change set in this run |

### 18.3 Criterion coverage matrix

Every success criterion in the target has a coverage class in `rules/packs/wcag-2.2/coverage.yaml`:

| Class | Meaning | Examples |
| --- | --- | --- |
| `AUTOMATED_FULL` | The engine can determine pass or fail reliably for the sampled pages | 3.1.1 Language of Page (`html[lang]` valid), 2.4.2 Page Titled (presence; descriptiveness is semantic) |
| `AUTOMATED_PARTIAL` | Automation finds failures but cannot prove passing | 1.4.3 Contrast (text over images and gradients), 1.1.1 Non-text Content (alt presence yes, alt quality no), 4.1.2 Name, Role, Value |
| `GUIDED_MANUAL` | The engine performs the interaction and captures evidence; a human or agent judges it with anchored reasoning | 2.4.3 Focus Order, 2.4.7 Focus Visible, 3.3.1 Error Identification, 1.3.1 Info and Relationships, 2.1.1 Keyboard |
| `MANUAL_ONLY` | Requires human judgment or content knowledge | 1.2.x captions accuracy, 2.4.6 Headings and Labels (descriptiveness), 3.1.2 Language of Parts in mixed content, 1.4.5 Images of Text intent |

Results per criterion: `PASS` (only for `AUTOMATED_FULL`, or `GUIDED_MANUAL` with human-recorded review), `FAIL`, `WARNING`, `NOT_APPLICABLE` (for example no media, so 1.2.x does not apply, with coverage), or `UNKNOWN(reason = MANUAL_REVIEW_REQUIRED)`. For `MANUAL_ONLY` criteria, the report includes step-by-step manual test instructions generated for this site's actual components.

### 18.4 Test layers

| Layer | Probe | What it checks |
| --- | --- | --- |
| Automated scan | `a11y.axe` per sampled page and state (menus open, dialogs open, errors shown) | Rule violations mapped to criteria |
| Keyboard walk | `keyboard.walk`: Tab and Shift+Tab through the page; records the focused element sequence, accessible name, bounding box, and a focus-indicator screenshot crop | 2.1.1, 2.1.2 (no trap: focus returns to the document within N tabs or reaches an escape route), 2.4.3 (sequence compared with visual order heuristics), 2.4.7 (indicator pixel difference versus unfocused state), 2.4.11 (focused element not fully covered by sticky headers or footers, using bounding-box intersection) |
| Widget interaction | `keyboard.widget`: Enter, Space, Escape, and arrow keys on detected widgets (menus, tabs, accordions, listboxes, dialogs) | Expected keyboard patterns per widget role |
| Dialog probe | `a11y.dialog`: open, check that focus moves inside, labeled by the title, background inert or `aria-modal`, Escape closes (unless intentionally blocking with an alternative), focus restored to the trigger | Consent, confirmation dialogs, admin dialogs |
| Form errors | `a11y.formErrors`: submit empty and invalid values | 3.3.1, 3.3.3, error association (`aria-describedby` or `aria-errormessage`), `aria-invalid`, live announcement (live region or focus to an error summary), required indication not by color alone |
| Authentication | `a11y.auth` | 3.3.8: paste allowed in credential fields (no `onpaste` prevention), password managers not blocked (`autocomplete` tokens), no cognitive puzzle without an alternative; CAPTCHA alternatives |
| Redundant entry | Process walk | 3.3.7: previously entered information is auto-populated or selectable within a process |
| Consistent help | Cross-page comparison | 3.2.6: help mechanisms appear in the same relative order |
| Reflow and zoom | `a11y.reflow`: 320 CSS px width viewport; 200% text zoom; text-spacing override injection (1.4.12) | Horizontal scrolling for normal content, clipped text, overlapping content (screenshot diff and overflow detection) |
| Viewport | Head extraction | `user-scalable=no` or `maximum-scale<2` is a `FAIL` (owned by `wcag-readiness`) |
| Target size | `a11y.targets`: bounding boxes of interactive elements | 2.5.8: at least 24×24 CSS px, or the spacing exception (a 24 px circle test); inline links excluded |
| Dragging | Static detection of drag handlers plus manual review | 2.5.7: single-pointer alternative exists |
| Motion | Emulate `prefers-reduced-motion: reduce` | Animations reduced (computed `animation`/`transition` durations, autoplay), 2.3.1 flashing heuristics on video and animation |
| Contrast | Computed foreground and background, including hover, focus, disabled, and placeholder states and dark mode | 1.4.3, 1.4.11 (UI component and focus indicator contrast) |
| Color-only | Semantic check of status indicators (errors in red only, links distinguished only by color within text) | 1.4.1 (guided manual) |
| Media | Detect `<video>`, `<audio>`, and embeds | 1.2.x applicability; captions track presence (`AUTOMATED_PARTIAL`); transcript link presence |
| Language | `html[lang]` validity and match to content language (text language detection); `lang` on parts for mixed-language content | 3.1.1, 3.1.2 |
| Screen-reader semantics | Accessibility tree snapshot (the browser's computed accessibility tree) | Landmarks, heading outline, names, roles, states, live regions. This is semantic inspection, not a screen-reader emulation claim. |

### 18.5 Dynamic UI states

The sampler drives each page into its significant states before scanning: menus open, dialogs open, toasts displayed, loading and empty states (via network interception), form error states, and expanded accordions. Toasts and alerts are checked for announcement (`role="status"` or `role="alert"`, or a live region), for sufficient display time or persistence, and for not stealing focus.

### 18.6 Compliance surfaces are not exempt

Consent banners, preference centers, legal pages, unsubscribe pages, deletion confirmations, error pages, and admin interfaces are always in the sample. A consent dialog that traps focus is both an accessibility `FAIL` and a consent `FAIL` (`CONSENT.DIALOG_SEMANTICS`), because an inaccessible choice is not a free choice for keyboard and screen-reader users.

### 18.7 Remediation principles

1. **Native HTML first:** `<button>` instead of `div role="button"`, `<label for>` instead of `aria-label` on inputs with visible text, `<dialog>` or an established accessible dialog primitive already in the design system, `<nav>`, `<main>`, and heading levels.
2. **ARIA lint:** `A11Y.ARIA_REDUNDANT` (for example `role="button"` on `<button>`), `A11Y.ARIA_INVALID_REFERENCE`, `A11Y.ARIA_HIDDEN_FOCUSABLE`, `A11Y.ARIA_OVERRIDES_NATIVE`.
3. **Fix in the shared component** when the defect comes from a design-system primitive, so that the fix propagates. The change ladder (§51.6) applies.
4. **Token-level issues** (a brand color failing contrast) produce a `Decision` with options (adjust token, add a darker variant for text, change usage), because changing brand tokens is an owner decision. Accessibility takes priority: the system refuses to mark such findings suppressed "for brand reasons" without an owner-recorded accepted risk.
5. **No overlays:** accessibility overlay widgets are never proposed as remediation, and their presence produces `A11Y.OVERLAY_NOT_REMEDIATION` (`WARNING`).

### 18.8 Web standards quality pass

Owned by `wcag-readiness`, category `LAUNCH_QUALITY` unless mapped to a criterion:

- HTML validity via a bundled HTML checker, run locally where available (the rendered DOM serialization and the raw HTML). Parsing errors are quality issues. WCAG 2.2 marks 4.1.1 Parsing obsolete, so they are not reported as a WCAG failure.
- Valid element relationships (no interactive content nested in interactive content, list items inside lists, table structure), and duplicate IDs referenced by ARIA.
- Viewport meta present and standards-compatible.
- `lang` and `dir` present and valid (with `multilingual-readiness` and `rtl-readiness`).
- Progressive enhancement where appropriate: core content and navigation available without JavaScript for content pages (checked through the raw-HTML snapshot, §20.4). Reported as `WARNING` for content sites, and informational for app-shell pages behind login.

### 18.9 Accessibility statement

Generated only on owner request or pack requirement, from evaluation results: target, scope, known limitations (from open findings), contact for accessibility issues (owner input), date, and method. It never claims conformance unless the owner records their own conformance decision in `reviews.yaml`.

---

## 19. Internationalization

### 19.1 Locale inventory

`multilingual-readiness` builds `model.locales` from i18n libraries and config (next-intl, next-i18next, react-i18next, vue-i18n, Astro i18n, Paraglide, Lingui, FormatJS), locale directories and message catalogs, routing configuration, served URLs (crawl), the `<html lang>` of each route, and the language selector.

### 19.2 Completeness matrix

Rows are surfaces, columns are locales. Each cell is `COMPLETE`, `PARTIAL`, `MISSING`, or `MACHINE_TRANSLATED_UNREVIEWED`, with evidence (a missing key list, fallback-rendered text detection, or a document translation status).

Surfaces always included:

- Navigation and core product pages.
- **Trust surfaces:** Privacy Policy, Terms, cookie notice, consent UI, cookie preferences, unsubscribe and preference pages, account deletion and export, rights request form.
- **Error surfaces:** 404, 500, maintenance, form validation messages, API error messages, toasts, empty states.
- Emails: transactional and marketing templates per locale.
- Metadata: titles, descriptions, OG, structured data.
- Admin (reported separately, because admin languages may intentionally differ, as an owner decision).

**Rule:** `I18N.FULLY_BILINGUAL_CLAIM_UNSUPPORTED` fires when the site declares multiple languages (a selector, "English | العربية", or a claim like "fully available in Arabic") while any trust or error surface is `MISSING` or `PARTIAL` for a served locale. Machine-translated, unreviewed legal text adds `LEGAL_REVIEW_REQUIRED(reason = TRANSLATION_REVIEW)`.

### 19.3 Checks

| Check | Control | Method |
| --- | --- | --- |
| `lang` matches the locale on every route | `I18N.HTML_LANG_MISMATCH` | Head extraction versus the route locale and detected content language |
| Language of parts | `I18N.LANG_OF_PARTS` | Mixed-script detection in text nodes lacking `lang` (shared with 3.1.2) |
| Untranslated strings | `I18N.UNTRANSLATED_STRING` | Detection of raw message keys (`auth.signup.title`), source-language strings on target-locale pages (language detection per text node), and hardcoded strings in components (static) |
| Fallback behavior | `I18N.SILENT_FALLBACK` | A missing translation silently shows another language without disclosure on trust surfaces |
| Formatting | `I18N.FORMATTING` | Dates, numbers, and currencies through `Intl` or the i18n library rather than string concatenation (static); rendered values checked for the locale's conventions |
| Pluralization | `I18N.PLURALIZATION` | ICU plural or select usage for counts; languages with many plural categories (Arabic has six) need full forms |
| Locale persistence | `I18N.LOCALE_PERSISTENCE` | The selection persists across navigation. The storage item is classified by `cookie-and-storage-audit` (a user-requested preference; consent treatment decided by packs). |
| Locale negotiation | `I18N.NEGOTIATION` | `Accept-Language` redirects must not trap crawlers or users: every locale URL must be reachable directly, with no forced redirect based on IP or headers without an escape |
| Form validation messages | `I18N.VALIDATION_MESSAGES` | Client and server validation messages localized |
| Input handling | `I18N.INPUT_SCRIPTS` | Names and addresses accept non-Latin scripts; no ASCII-only validation on name fields |

### 19.4 SEO interaction

`multilingual-readiness` provides the locale model. `seo-readiness` owns emission:

- Dedicated URLs per locale (path prefix, subdomain, or domain) for public multilingual content. `COOKIE_ONLY` or `QUERY` locale strategies on indexable content produce `SEO.LOCALE_NOT_URL_ADDRESSABLE` (`WARNING`).
- `hreflang` clusters: each locale URL lists every alternate, including itself; all links are reciprocal; codes are valid BCP 47; `x-default` points to a language-selection or default page where appropriate.
- Canonical is self-referential per locale. It never points to another language's URL.
- Localized titles, descriptions, OG tags, and structured data (via `ChangeRequest`s to the owning skills).
- Sitemaps include locale alternates when the architecture uses sitemap-based hreflang.

### 19.5 RTL (owned by `rtl-readiness`)

Activated by any served RTL locale (Arabic, Hebrew, Persian, Urdu, …).

| Area | Check | Remedy |
| --- | --- | --- |
| Direction | `dir="rtl"` on `<html>` for RTL locales (not per component); `dir="auto"` on user-generated text inputs and displays | Adapter sets `html:dir` per locale |
| Layout | Physical CSS properties in components rendered in RTL (`margin-left`, `padding-right`, `left:`, `text-align: left`, `float`, Tailwind `ml-*` and `pl-*` and `left-*`) | Convert to logical properties (`margin-inline-start`, `ms-*`, `ps-*`, `start-*`, `text-start`) |
| Visual verification | Screenshot per sampled route in LTR and RTL; detect overlaps, clipping, and misaligned icons | Evidence for findings |
| Icons | Directional icons (arrows, chevrons, "back", progress) mirrored; non-directional icons (clock, check, media play) **not** mirrored | Mirroring list in skill assets; CSS transform or icon variants |
| Bidi | Mixed LTR content inside RTL (numbers, emails, URLs, user names, code) isolated with `<bdi>` or `unicode-bidi: isolate` | Component fixes |
| Typography | Arabic-capable font present (no fallback to a font lacking glyphs); line-height adequate for diacritics; no letter-spacing on Arabic (breaks joining); no uppercase transforms | Design-token extension via the change ladder |
| Numerals | Western versus Arabic-Indic digits: an owner decision, applied consistently via `Intl` numbering systems | Owner question |
| Forms | Labels, errors, and icons positioned correctly; phone and email inputs `dir="ltr"` where appropriate | Component fixes |
| Charts and tables | Axis and column order direction | Guided manual |

---

## 20. SEO and Indexability

### 20.1 Concepts kept distinct

| Concept | Question | Determined by | ReadyVibe can verify |
| --- | --- | --- | --- |
| Crawlability | Can a crawler fetch it? | robots.txt, status, auth, reachability, links | Yes |
| Indexability | May it be indexed if crawled? | robots meta, `X-Robots-Tag`, status, canonical target, soft-404 signals | Yes |
| Canonicalization | Which URL represents duplicates? | `rel=canonical`, redirects, internal links, sitemaps (canonical is a hint to search engines) | The site's signals, yes; the search engine's choice, only via Search Console |
| Discoverability | Can a crawler find it? | Internal links, sitemaps, external links | Internal links and sitemaps |
| Search appearance | How it looks in results | Title, description, structured data eligibility, favicon | Signals, yes; actual appearance, no |
| Ranking | Position in results | Search-engine algorithms | **Out of scope.** Never promised. |

### 20.2 Route intent

`site-reconnaissance` classifies every route (`RouteIntent` in §6.6):

1. **Deterministic:** unauthenticated probe returns 401/403 or redirects to login → `PRIVATE_AUTH`. `/api/*`, OAuth callbacks, and webhooks → `UTILITY`. Framework error routes → `ERROR`. Checkout steps, thank-you pages, unsubscribe confirmations → `TRANSACTIONAL`. Admin patterns plus role checks → `ADMIN`.
2. **Heuristic** (MEDIUM): search result pages, filters, and paginated duplicates → `PUBLIC_NOINDEX` candidates; `/staging`, `/test`, `/preview`, `/_dev`, `/playground` → `STAGING_OR_INTERNAL` candidates.
3. **Anchored LLM** for the remainder (MEDIUM), using page content.
4. **Owner overrides** in `config.yaml: seo.routes` win for intent.

### 20.3 Per-route checks

| Check | Control |
| --- | --- |
| HTTP status of public routes is 200 (or an intentional 301/308 to a canonical) | `SEO.PUBLIC_ROUTE_NOT_200` |
| Private routes not indexable: auth-gated **and** not in the sitemap; `noindex` recommended in addition for app shells | `SEO.PRIVATE_ROUTE_IN_SITEMAP`, `SEO.PRIVATE_CONTENT_PUBLICLY_REACHABLE` (a `web-security` handoff when content is served without auth) |
| Intended public routes indexable (no `noindex`, not disallowed in robots, canonical self or to an indexable URL) | `SEO.PUBLIC_ROUTE_NOINDEX`, `SEO.PUBLIC_ROUTE_DISALLOWED` |
| Production-wide `noindex` (a common copied staging leftover) | `SEO.PRODUCTION_NOINDEX` (blocking) |
| Title present, unique across routes, specific (not the product name alone, not "Home", not a framework default) | `SEO.TITLE_MISSING`, `SEO.TITLE_DUPLICATE`, `SEO.TITLE_GENERIC` |
| Description present, route-specific | `SEO.DESCRIPTION_MISSING`, `SEO.DESCRIPTION_DUPLICATE` (WARNING) |
| One meaningful H1 (not required by search engines; reported as a quality and accessibility signal) | `SEO.H1_MISSING` (WARNING) |
| Canonical present, absolute, single, on the production host, not localhost or staging, not pointing everything to the homepage | `SEO.CANONICAL_*` |
| Language and hreflang consistent | `SEO.HREFLANG_*` |
| Internal links: public pages reachable through crawlable `<a href>` links (not only JS click handlers) | `SEO.ORPHAN_ROUTE`, `SEO.NON_CRAWLABLE_LINKS` |
| Raw HTML contains meaningful content and metadata (§20.4) | `SEO.CONTENT_REQUIRES_JS`, `SEO.METADATA_REQUIRES_JS` |
| Soft 404s | `ERRORS.SOFT_404` (owned by `error-pages`) |

`meta keywords` is intentionally **not** a control. The engine lists it under "legacy tags ignored by major search engines" (informational) so that users are not pushed toward cargo-cult work, and it is never added.

### 20.4 Two renders per route

Many vibe-coded sites are client-rendered SPAs. Search engines may render JavaScript, but social crawlers, many other bots, and preview generators do not. The engine therefore captures, per route:

- **Raw:** the HTTP response HTML as returned (no JS execution), with a crawler user agent.
- **Rendered:** the DOM after JS execution and network idle.

Differences are first-class facts. If the title, description, canonical, OG tags, or main content exist only in the rendered DOM, the adapter reports the implementation options for this framework: SSR or SSG of metadata (native in Next.js, Astro, SvelteKit, Nuxt, and Remix), prerendering for Vite SPAs (a prerender plugin or a static generation step), or at minimum correct defaults in `index.html`. Migrating rendering architecture is `MANUAL_ENGINEERING_REQUIRED`. Correct `index.html` defaults are `AUTOMATIC_SAFE_FIX`.

### 20.5 robots.txt

- Parsed with RFC 9309 semantics (longest-match, group selection by user agent).
- Detects accidental blocking (`Disallow: /` on production; blocking CSS and JS needed for rendering; blocking pages that carry `noindex`, which prevents crawlers from seeing it).
- Detects staging rules copied into production.
- Declares the sitemap location (`Sitemap:` with an absolute URL).
- **Not a privacy or security control.** `SEO.ROBOTS_LISTS_SENSITIVE_PATHS` fires when robots.txt enumerates private or admin paths, because listing them advertises them. Those paths must be protected by authorization, and `noindex` can be used where needed.
- **Not an index-removal mechanism.** The guidance explains that `noindex` (crawlable) or authentication removes pages, and that robots.txt only controls crawling.

### 20.6 Indexability verdict

```ts
type IndexabilityVerdict = {
  crawlable: boolean | null;         // robots allows, reachable, status not blocked
  indexable: boolean | null;         // no noindex (meta or header), status 200, not soft-404
  canonicalTarget: string | null;
  canonicalSelf: boolean | null;
  inSitemap: boolean | null;
  intentMatch: "MATCH" | "PUBLIC_BUT_NOT_INDEXABLE" | "PRIVATE_BUT_INDEXABLE" | "UNKNOWN";
  searchReady: boolean | null;       // §20.10
};
```

### 20.7 Sitemaps

- **Included:** only canonical URLs with intent `PUBLIC_INDEXABLE` that return 200, are indexable, and are self-canonical.
- **Excluded:** auth-only routes, account and settings pages, checkout states, dashboards, temporary and preview URLs, duplicates and parameter variants, callbacks, internal tooling, staging, error pages.
- **Dynamic content:** the adapter generates sitemaps from real data sources (the framework's sitemap API, or a build step enumerating content collections or CMS entries). It never hardcodes URLs that will go stale. Large sites use a sitemap index.
- `lastmod` only when truthful (derived from content modification data). Otherwise omitted.
- Validation: XML well-formed, URL count limits, absolute production URLs, no localhost or preview hosts, every entry passes the indexability verdict (`SEO.SITEMAP_ENTRY_NOT_INDEXABLE`).
- Idempotency: one sitemap mechanism per project (`sitemap:*` semantic key). Existing generators are configured, not duplicated.
- Submitting a sitemap does not guarantee indexing, and the report says so.

### 20.8 Canonical strategy

| Variant | Strategy |
| --- | --- |
| HTTP vs HTTPS | 301/308 to HTTPS (`security-headers` owns the redirect); canonical uses HTTPS |
| www vs apex | Owner chooses (question) or the existing production configuration decides; the other redirects |
| Trailing slash | The framework's configured policy; the other form redirects; canonical matches |
| Query parameters | Tracking parameters (`utm_*`, `gclid`, `fbclid`, …) and sort or filter parameters with no unique content point canonical to the clean URL; parameters that change content stay self-canonical |
| Pagination | Each page self-canonical (never canonical to page 1) |
| Locales | Self-canonical per locale plus hreflang |
| Duplicate content paths | The owner chooses the primary; the others redirect or set canonical |

Canonicalizing every page to the homepage is detected (`SEO.CANONICAL_ALL_TO_HOME`) and is a `FAIL`.

### 20.9 Titles and descriptions

- The pattern is derived from the site's identity: `{Page-specific title} — {Brand}` (a separator consistent with any existing convention), with the homepage led by the brand plus its value proposition.
- Content comes from real page content (H1, first meaningful paragraph, product data) via anchored drafting. The owner reviews titles and descriptions for the top-level routes, and the rest are generated from templates bound to content fields.
- Lengths are reported as `WARNING`s only ("may be truncated"). There is no hard rule, because truncation depends on rendering.

### 20.10 Search-ready versus actually indexed

- **`SEARCH_READY`** (verifiable by ReadyVibe): 200 status, crawlable, indexable, self-canonical or intentionally canonicalized, linked internally, in the sitemap, meaningful raw-HTML content, title and description present.
- **`ACTUALLY_INDEXED`** (not verifiable without external data): requires Search Console URL Inspection or equivalent. It is shown as `UNKNOWN(reason = EXTERNAL_DATA_REQUIRED)` unless `search-console-readiness` has authorized API access.

### 20.11 Search Console readiness

| Step | Automatable by ReadyVibe | Requires owner |
| --- | --- | --- |
| Choose the property type (domain versus URL prefix) | Explain options | Decision |
| Verification via HTML meta tag | Insert `meta:google-site-verification` with the owner-supplied token (the token is not secret, but it is project-specific and stored in config) | Obtain the token |
| Verification via DNS TXT | Instructions; verify the record exists (DNS query) | Add the DNS record |
| Sitemap submission | Via the Search Console API with OAuth granted by the owner, or instructions | Authorization |
| URL inspection and index status | Via the API with authorization, within quota; results stored as `EXTERNAL_API_RESULT` evidence | Authorization |
| Request indexing | Instructions only (manual, and appropriate only for important new or changed pages) | Action |
| Monitor coverage, Core Web Vitals report, and manual actions | Instructions; optional periodic pull with authorization | Authorization |
| Bing Webmaster Tools | Same pattern (meta `msvalidate.01` or DNS) | Same |

Credentials are never stored in the repository. The OAuth refresh token (if used) lives in the owner's environment or keychain, referenced by name in `config.yaml`.

---

## 21. Social Metadata, Structured Data, and Launch Identity

### 21.1 Head ownership

The head is a shared surface with per-key owners (§10.6). Adapters implement "upsert tag by semantic key", which is how multiple skills cooperate without duplicate tags.

### 21.2 Open Graph and platform cards (`social-sharing`)

| Tag | Rule |
| --- | --- |
| `og:title`, `og:description` | Route-specific; may differ from the SEO title for shareability; localized |
| `og:url` | The canonical absolute URL |
| `og:image` | Absolute HTTPS URL on a public host; an image content type; 200 without auth; sized for large cards (1200×630 is the widely supported target, with a roughly 1.91:1 aspect); file size within platform limits; `og:image:alt` provided |
| `og:type` | `website` by default; `article` for articles with real publication data |
| `og:site_name` | `model.identity.productName` |
| `og:locale`, `og:locale:alternate` | From the locale model |
| `twitter:card` | `summary_large_image` when a suitable image exists |

Verification:

- Fetch each sampled route **as social crawlers do** (raw HTML, no JS, crawler user agents) and confirm the final tags are present. Client-only tags produce `SOCIAL.TAGS_REQUIRE_JS` (`FAIL` for public routes).
- Fetch the image URL with a crawler user agent: status, content type, dimensions, and bytes.
- Detect `localhost`, `127.0.0.1`, preview hosts, relative URLs, placeholder images (a hash catalog of framework and starter defaults), duplicate tags, and missing tags on nested routes (inheritance failures).
- Produce **preview renders** in the report (simulated large and small card layouts from the fetched data) so the owner sees what a share looks like.

OG images are generated only from real brand assets and design tokens (logo, colors, typography from `model.designSystem`), for example via a framework-native OG image route. Stock imagery and fabricated screenshots are never used. When no brand asset exists, the finding is `OWNER_INPUT_REQUIRED`.

### 21.3 Crawler-visible metadata is a general rule

Titles, descriptions, canonical, OG and card tags, hreflang, and JSON-LD are all checked in the **raw** render. Presence only after JS is reported with the framework-specific options from §20.4.

### 21.4 Structured data (`structured-data`)

- Types are proposed only when the content genuinely exists and the type is eligible under the current search guidance pack: `Organization` or `LocalBusiness` (owner facts only), `WebSite`, `BreadcrumbList` (from real navigation hierarchy), `Article` or `BlogPosting` (real author, date, headline), `Product` (real price, currency, and availability from the data source), `SoftwareApplication`, `Event` (real events).
- **Never invented:** ratings, reviews, `aggregateRating`, prices, availability, authors, business addresses, opening hours, events. Controls `SD.FABRICATED_PROPERTY` (review of generated JSON-LD: every property must bind to a data source or owner fact) and `SD.INCONSISTENT_WITH_VISIBLE` (JSON-LD values must match visible content, compared in the rendered DOM).
- Validity: JSON parse, schema.org vocabulary check, required and recommended properties per the guidance pack.
- Eligibility changes over time (for example, search engines have narrowed which sites get FAQ and HowTo rich results). The guidance pack encodes eligibility, and the skill does not add types that no longer produce results merely because old checklists mention them.
- JSON-LD is emitted in the raw HTML and localized per locale where content is localized.

### 21.5 Launch identity (`launch-identity`)

```ts
interface IdentityModel {
  productName: Tracked<string | null>;           // the name users see
  operatorName: Tracked<string | null>;          // legal entity (owner input)
  shortName: Tracked<string | null>;
  tagline: Tracked<string | null>;
  logo: { src: string; kind: "SVG" | "RASTER"; evidence: EvidenceRef[] }[];
  brandColors: Tracked<string[]>;                // from design tokens
  surfaces: { surface: IdentitySurface; observedName: string | null; evidence: EvidenceRef }[];
  residue: { surface: IdentitySurface; pattern: string; evidence: EvidenceRef }[];
}
type IdentitySurface =
  | "HOMEPAGE_TITLE" | "ROUTE_TITLES" | "MANIFEST_NAME" | "MANIFEST_SHORT_NAME" | "OG_SITE_NAME"
  | "FAVICON" | "APPLE_TOUCH_ICON" | "FOOTER" | "PRIVACY_POLICY" | "TERMS" | "EMAIL_FROM_NAME"
  | "ERROR_404" | "ERROR_500" | "SUPPORT_PAGE" | "JSONLD_ORGANIZATION" | "APPLICATION_NAME_META";
```

Consistency check: every surface's observed name must equal `productName` (or `operatorName` where the operator is meant), after normalization. Mismatches produce `IDENTITY.INCONSISTENT_NAME`.

Residue detection uses a versioned catalog (`vendor-catalog/residue.yaml`):

| Residue | Detection |
| --- | --- |
| Framework and starter titles | "Vite + React", "Vite + Vue", "Create Next App", "React App", "SvelteKit app", "Astro", "My App", "Untitled" |
| Default favicons and icons | Perceptual and exact hash catalog of framework, starter, and builder-platform default icons (Vite, Next.js, Vercel triangle, React logo, …) |
| Placeholder copy | "Lorem ipsum", "Your Company Name", "Company Inc.", "123 Main Street", "hello@example.com", `example.com` links |
| Builder-platform leftovers | Default meta descriptions and OG images of AI site builders and starter templates (hash catalog; community-maintained) |
| Host default error pages | The hosting provider's default 404 (detected by fingerprints in `error-pages`) |

### 21.6 Favicon, icons, and manifest

- A favicon is always expected (`IDENTITY.FAVICON_MISSING`, `IDENTITY.FAVICON_DEFAULT`). The target set: an SVG icon (scalable, supports dark-mode media queries if the brand needs it), a PNG or ICO fallback (e.g., 32×32 or 48×48), and an `apple-touch-icon` (180×180). Icons are generated from the real logo asset. If only a raster logo exists, sizes are derived. If none exists, the finding is `OWNER_INPUT_REQUIRED`.
- **Web app manifest** only when useful: the project is a PWA (service worker, install intent), or the owner wants installability, or platform requirements exist. Otherwise `IDENTITY.MANIFEST` controls are `NOT_APPLICABLE`, and no manifest is created because "every site should have one". An existing manifest is validated (name, short name, icons 192 and 512 including maskable if declared, `start_url`, `display`, theme and background colors from tokens).
- `theme-color` from design tokens, with light and dark variants via media queries if the site themes.

### 21.7 Contact and support (`public-support`)

Surfaces considered: support email, contact form, help center, privacy contact (required by many privacy packs), abuse report (UGC), security contact, legal contact, and accessibility contact.

- **Never invented.** Missing contacts are `OWNER_INPUT_REQUIRED` questions, and packs mark which ones are mandatory for which obligations.
- Contact forms are checked by the general form controls (labels, validation, CSRF, rate limit, CAPTCHA accessibility, privacy disclosure at collection point, success state).
- `security.txt` (RFC 9116) at `/.well-known/security.txt` with `Contact` and `Expires`, plus `Policy` or `Preferred-Languages` if provided. Contact details come from the owner.
- Mailto-only support is legitimate. The system checks that the address is on the product's domain or an owner-confirmed address, and that it is consistent across surfaces (policy, footer, emails).

### 21.8 Footer and legal navigation (`legal-navigation`)

The footer's legal group is **derived** from existing surfaces:

| Link | Included when |
| --- | --- |
| Privacy | The privacy policy route exists and returns 200 |
| Terms | The terms route exists |
| Cookie preferences | The consent module exists (opens preferences; a button, not a link to a page, if it opens a dialog) |
| Do Not Sell or Share / Limit Sensitive PI | The California pack is confirmed and the facts require them |
| Accessibility | An accessibility statement exists |
| Contact / Help | Support surfaces exist |
| Security | `security.txt` or a security page exists |
| Legal notice / Imprint | Pack-required and it exists |
| Refunds / Subscription terms | Commerce documents exist |
| Status | An owner-provided status page URL exists |
| Language | A selector is present when multiple locales exist (owned by `multilingual-readiness`; placed here if the design puts it in the footer) |

Controls: `LEGALNAV.LINK_TO_MISSING_PAGE` (a link returns non-200), `LEGALNAV.REQUIRED_LINK_MISSING` (a pack or consent requires reachability from every page), `LEGALNAV.DUPLICATE_LINKS`, `LEGALNAV.UNLOCALIZED`. The group is upserted by semantic key `footer:legal-links`, preserving existing footer design and non-legal links.

---

## 22. Error and Failure Surfaces

### 22.1 Surface catalog

| Surface | Correct semantics | Owner |
| --- | --- | --- |
| 404 Not Found | HTTP 404 (or 410 for intentionally removed content) for unknown URLs | `error-pages` |
| 500 / server error | HTTP 5xx; no stack traces in production | `error-pages` |
| 403 Forbidden | HTTP 403 for authenticated users lacking permission | `error-pages` (UI); `web-security` (enforcement) |
| 401 / login required | Redirect to login with a safe return path, or 401 for APIs | `error-pages` (UI); `web-security` (redirect safety) |
| Maintenance / degraded | HTTP 503 with `Retry-After`; `noindex` | `error-pages` |
| Offline | Only when a service worker exists | `error-pages` |
| Rate limited | HTTP 429 with `Retry-After`; UI explains the wait | `failure-resilience` (UI); `web-security` (limits) |
| API failure, timeout, malformed response | Visible, recoverable UI state | `failure-resilience` |
| Empty and loading states | Informative, accessible | `failure-resilience` |
| Payment failure | Clear state and retry path | `payments-readiness` (flow), `failure-resilience` (generic states) |
| Auth failure | Clear, non-enumerating messages | `web-security` (enumeration), `failure-resilience` (UI) |
| Form failure | Preserved input, accessible errors, retry | `failure-resilience`, `wcag-readiness` |

### 22.2 HTTP semantics are tested, not assumed

The probe `errors.unknownRoute` requests `/rv-probe-<nonce>` and nested variants (`/blog/rv-probe-<nonce>`, `/<locale>/rv-probe-<nonce>`, `/api/rv-probe-<nonce>`) on each environment and records status, headers, raw HTML, and rendered DOM.

| Observation | Finding |
| --- | --- |
| 200 with a "not found" page | `ERRORS.SOFT_404` (`FAIL` for public sites) |
| 200 rendering the homepage or app shell (SPA fallback) | `ERRORS.SPA_FALLBACK_200` |
| 404 with the host's default page | `ERRORS.HOST_DEFAULT_404` (`LAUNCH_QUALITY`) |
| 404 with a custom page | `PASS`, then design and a11y checks |
| Dynamic routes (`/blog/[slug]`) with an unknown slug return 200 with empty content | `ERRORS.DYNAMIC_ROUTE_MISSING_ENTITY_200` |

Framework and hosting knowledge comes from adapters:

| Setup | Typical cause | Remedy options |
| --- | --- | --- |
| Next.js App Router | Missing `not-found` handling for dynamic segments (`notFound()` not called when the entity is missing) | Add `notFound()` calls and a `not-found` route |
| Vite/React SPA on static hosting with a rewrite-all rule | Every path returns `index.html` with 200 | (a) Edge or host function returning 404 for paths not in a generated route manifest; (b) prerendering with a real `404.html` and scoped rewrites; (c) if neither is possible: client-side 404 with `noindex` meta, reported as `WARNING` with a residual soft-404 risk |
| Astro, SvelteKit, Nuxt, Remix | Framework conventions for error pages; SSG `404.html` | Adapter-generated |
| Plain HTML on static hosting | Host serves its default 404 | Custom `404.html` plus host configuration |

### 22.3 Design and content requirements

A branded error page:

- inherits the real layout (header and footer) or a deliberately minimal variant of it, and uses design tokens and components (§51);
- has a clear title ("Page not found — Brand"), an explanation in plain language, and useful navigation (home, search if one exists, main sections, support contact if available);
- is localized in each served locale;
- is accessible (headings, focus, contrast, reflow);
- carries no fake technical details, no humorous copy that obscures meaning, and no stack traces;
- has `noindex` where appropriate. A 404 status suffices for search engines, and `noindex` is kept for maintenance and error content served with 200 in degraded setups.

### 22.4 500 and error boundaries

- Test environment: the probe triggers server errors through a test-only fault route (created only in test builds by the adapter, never shipped to production) or through network interception of API calls to simulate 500s.
- Checks: status 5xx; no stack trace, framework debug page, SQL error, file path, or environment variable in the body (`SEC.ERROR_DISCLOSURE`); the page is branded; client error boundaries catch render errors instead of a blank screen.

### 22.5 Maintenance mode

Only when the owner wants it, or when the hosting setup supports it. A 503 with `Retry-After`, a branded page, and an optional status page link. Maintenance mode must never be left on (the unknown-route and homepage probes would catch 503s).

### 22.6 Failure resilience (`failure-resilience`)

A failure-injection matrix is run on key flows with Playwright request interception in non-production environments:

| Injection | Expected behavior |
| --- | --- |
| API offline (connection refused) | A visible error state with a retry; no infinite spinner (loading state resolves within a timeout, default 15 s); no blank page |
| Slow network (3G profile, 10 s API delay) | Loading state visible and accessible (`aria-busy` or a status message); no layout collapse; no double submission on repeated clicks |
| 401 on an API call | Session-expired handling: redirect to login with a return path; unsaved input preserved where feasible |
| 403 | Permission message, not a generic crash |
| 404 on an API resource | Not-found state for the entity |
| 429 | Explains the wait; honors `Retry-After` |
| 500 | Error state with a retry and a support path |
| Malformed JSON or unexpected shape | Error boundary; no raw error dump |
| Missing image | Alt text shown; layout reserved (no CLS explosion) |
| Missing environment variable at build or start | Fails fast with a clear message at build or start, not at runtime in the user's browser (static check for env validation, e.g., schema-validated env) |
| Third party unavailable (fonts, analytics, chat, maps, CAPTCHA) | The page still works. Critical flows must not depend on non-essential third parties. A blocked CAPTCHA has an accessible fallback or clear message. |
| Consent manager script blocked | The site remains usable, and non-essential scripts stay blocked (**fail closed**) |
| Payment provider failure | A clear message and retry; no duplicate charge on retry (idempotency, §25) |

Each result is evidence: screenshots, DOM text length, error text, focus position, and announcement presence.
