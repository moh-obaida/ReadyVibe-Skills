# The ReadyVibe launch model: 40 checks

ReadyVibe *considers* all 40 checks for every launch review, decides which ones apply to this specific product, verifies what it can, fixes what is safe, and flags the rest. "Considered" is not "run": a check that does not apply is recorded as **not applicable, with the reason**, not skipped silently and not forced.

Compliance adds a second, conditional layer of 12 domains (see the `compliance-all` skill). Checks 1–8 are the launch-facing edge of that layer.

**Owner** is the specialist that carries the method. **Also** lists skills that contribute evidence. If the owner is not installed, do that lane yourself using the method in this table's "Real question" column, and say in the report that no specialist ran.

## Family A: Compliance and privacy (bundle: `compliance-all`)

| # | Check | Real question | Owner | Also | Not applicable when |
|---|---|---|---|---|---|
| 1 | Privacy policy | Does a policy exist that describes what this product actually collects, uses, and shares? | privacy-policy | policy-consistency, data-flow-mapping | Nothing personal is collected, stored, or sent anywhere (rare; verify, do not assume) |
| 2 | Terms of service | Do terms exist that match the accounts, content, payments, and rules the product really has? | terms-of-service | legal-navigation | A pure brochure page with no accounts, content, purchases, or commitments |
| 3 | Cookie / tracker disclosure | Is every cookie, storage key, and third-party tracker that actually loads described? | cookie-and-storage-audit | policy-consistency, third-party-privacy | Runtime shows no cookies, storage, or third-party requests |
| 4 | Consent behavior | When consent is required, do reject, accept, and withdraw really change behavior? | consent-management | jurisdiction-applicability | No non-essential storage or trackers observed, or rule context says consent is not the basis |
| 5 | Analytics / tracker inventory and behavior | What analytics, ads, replay, and pixels exist, when do they fire, and what do they receive? | analytics-privacy | cookie-and-storage-audit, third-party-privacy | No analytics, advertising, replay, or tag manager in source or runtime |
| 6 | Age / audience handling | Who is this for, is age collected or implied, and does behavior contradict the stated audience? | minors-readiness | regulated-domain-triggers | Clearly adult/B2B audience, no age or child signals, and nothing appealing to minors |
| 7 | Account / data deletion | Does deleting an account or data actually delete or anonymize what it claims? | data-rights | privacy-readiness | No accounts and no stored personal data |
| 8 | Business / contact / privacy contact | Can a visitor tell who runs this and how to reach them about privacy and support? | public-support | legal-identity-notices | Never fully N/A on a public site; scope shrinks for hobby projects |

## Family B: Discoverability (bundle: `discoverability-all`)

| # | Check | Real question | Owner | Also | Not applicable when |
|---|---|---|---|---|---|
| 9 | Page titles | Is every public page's title unique, specific, and not a framework default? | seo-readiness | launch-identity | Product is internal/private and intentionally not indexed |
| 10 | Meta descriptions | Does each public page have a real, page-specific description? | seo-readiness | social-sharing | Same as 9 |
| 11 | Canonical URLs | Do canonicals point at the correct production URL of each page? | seo-readiness | check-links helper | Same as 9 |
| 12 | robots.txt | Does robots.txt allow what should be found and stay honest about what is private? | seo-readiness | search-console-readiness | Same as 9 |
| 13 | sitemap.xml | Does the sitemap list exactly the canonical, public, live URLs? | seo-readiness | search-console-readiness | Same as 9, or a single-page site |
| 14 | Open Graph / social share | Does a shared link show a correct title, description, and working image? | social-sharing | seo-readiness | The product will never be shared publicly |
| 15 | Favicon / app icons | Are tab icon, touch icon, and manifest icons real, present, and not starter assets? | launch-identity | social-sharing | Never N/A on a public site |
| 16 | Indexing sanity | Are public pages indexable, private pages not, and do signals agree? | seo-readiness | web-security | Product is intentionally not indexed (then verify it is consistently `noindex`) |
| 17 | Staging / localhost / test references | Does any shipped page, config, or link still point at a dev or staging host? | production-readiness | seo-readiness, link-integrity | Never N/A |
| 18 | Public URL consistency | Do canonical, sitemap, metadata, redirects, and links agree on one host, scheme, and path form? | seo-readiness | discoverability-all | Single-page site with one URL |

## Family C: Trust and product readiness (bundle: `trust-all`)

| # | Check | Real question | Owner | Also | Not applicable when |
|---|---|---|---|---|---|
| 19 | Clear primary CTA | Can a first-time visitor tell what to do next, and does that action work? | content-trust | link-integrity | Pure reference/content site with no intended action |
| 20 | FAQ / help content | Are the questions this product predictably raises answered somewhere findable? | faq-readiness | content-trust, public-support | Product is self-evident and support volume risk is low. Do not manufacture an FAQ |
| 21 | Custom 404 with recovery | Does an unknown URL return a real 404 in the product's design, with a way back? | error-pages | design-system-reconnaissance | Never N/A on a routed site |
| 22 | Broken internal / external links | Does every nav, footer, CTA, and content link resolve? | link-integrity | seo-readiness | Single page with no links |
| 23 | Dead buttons, fake controls, placeholders | Does every control do something real, and is unfinished UI gone? | content-trust | link-integrity, forms-readiness | Never N/A |
| 24 | Loading, empty, success, failure, recovery states | Does the UI behave sensibly when data is slow, empty, or failing? | failure-resilience | forms-readiness | Fully static site with no data fetching or forms |
| 25 | Contact / support path | Is there a working way to reach a human, matching what the site promises? | public-support | content-trust | Never N/A on a public product |
| 26 | Claims, metrics, testimonials, social proof | Is every number, logo, quote, and badge real, sourced, and not misleading? | content-trust | policy-consistency | No claims, metrics, testimonials, or badges are made |

## Family D: Accessibility and responsive quality (bundle: `quality-all`)

| # | Check | Real question | Owner | Also | Not applicable when |
|---|---|---|---|---|---|
| 27 | Image alt text / non-text alternatives | Does every meaningful image, icon, chart, and media item have a useful alternative? | wcag-readiness | | No images, icons, or media |
| 28 | Semantic structure / headings | Do landmarks, headings, lists, and buttons use the right elements? | wcag-readiness | | Never N/A |
| 29 | Keyboard navigation / visible focus | Can everything be used with a keyboard, with a visible focus indicator? | wcag-readiness | mobile-readiness | Never N/A |
| 30 | Form labels, instructions, accessible errors | Are fields labeled, instructions clear, and errors announced and associated? | forms-readiness | wcag-readiness | No forms or inputs |
| 31 | Contrast / readability | Is text legible against its background, at sensible size and line length? | wcag-readiness | | Never N/A |
| 32 | Reduced motion | Does motion respect `prefers-reduced-motion` and avoid seizure-risk patterns? | wcag-readiness | | No animation, parallax, autoplay, or motion |
| 33 | Mobile / responsive behavior | Does the real site work at phone and tablet sizes, not just avoid a scrollbar? | mobile-readiness | design-system-reconnaissance | Never N/A on a public web product |
| 34 | Mobile overflow, tables, dialogs, touch targets, sticky UI | Do wide content, modals, tap targets, and fixed bars behave on small screens? | mobile-readiness | wcag-readiness | Never N/A |

## Family E: Forms, communications, security, and performance (bundle: `production-all`)

| # | Check | Real question | Owner | Also | Not applicable when |
|---|---|---|---|---|---|
| 35 | Forms actually submit and handle outcomes | Does each form deliver data to a working endpoint and handle success and failure? | forms-readiness | failure-resilience | No forms |
| 36 | Unsubscribe works where marketing email exists | Does the unsubscribe link/route/header resolve and complete? | email-compliance | | The product sends no marketing email |
| 37 | Unsubscribe results in suppression | After unsubscribing, is the address actually excluded from future marketing sends? | email-compliance | data-rights | The product sends no marketing email |
| 38 | Exposed secrets, client env mistakes, debug artifacts | Is any credential, private key, debug route, or source map exposed to visitors? | web-security | production-readiness, ai-features-readiness | Never N/A |
| 39 | HTTPS / security headers / CSP / production sanity | Is transport secure and are headers and CSP sensible for what this site loads? | security-headers | web-security, dependency-security | Never N/A once deployed; when only a local build exists, mark UNKNOWN |
| 40 | Performance | Are there oversized assets, blocking resources, font/image waste, or obvious bloat? | performance-readiness | mobile-readiness | Never N/A |

## Selection rules

1. Decide applicability from evidence (repository, config, routes, runtime), not from the table alone.
2. "Not applicable" needs a reason a reviewer can check ("no `<form>` found in 12 crawled pages and none in `src/`").
3. "Unknown" is a valid result. Do not round it to pass or fail.
4. Some rows are conditional by design: no marketing email means 36–37 do not apply; no observed non-essential trackers means do not add a cookie banner; no accounts means 7 may not apply; no FAQ need means do not manufacture one; no motion means 32 is irrelevant.
5. Recheck triggers: adding analytics, ads, email, accounts, payments, user content, a new market, or a new audience re-opens the checks that were marked not applicable.
