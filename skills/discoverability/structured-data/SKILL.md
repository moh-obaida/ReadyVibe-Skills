---
name: structured-data
description: "Use when a page is genuinely an article, product, organization, local business, event, FAQ, or breadcrumb and JSON-LD structured data exists or would truthfully describe visible content. It validates that markup parses and matches what visitors see. Do not use it to invent ratings, reviews, prices, or FAQs, to add schema for its own sake, or to chase rich results the content does not merit."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "18"
  helpers: "inspect-metadata"
---

# structured-data

Structured data is a **claim to search engines about visible content**. False or invisible claims (fake ratings, prices that are not shown) are worse than none: they invite penalties and destroy trust.

## Activate when

- JSON-LD/microdata already exists (validate it), or a page is a real article, product, organization, local business, event, or breadcrumb trail where accurate markup helps.
- Not on pages that fit none of those, and not to "add schema" generically.

## Inspect

1. **Find markup:** `<script type="application/ld+json">` blocks, microdata (`itemscope`), RDFa; `node scripts/inspect-metadata.mjs --url <site> --render` reports JSON-LD types and parse failures per page (paths relative to this skill's folder).
2. **Parse and shape:** valid JSON; correct `@context`/`@type`; required and recommended properties for the type present; URLs absolute and on the production host (no localhost); dates ISO 8601; images resolve.
3. **Match visible content:** every marked-up fact appears on the page. Product price and availability equal the displayed values; `Organization` name/logo/`sameAs` match the real brand and profiles; `Article` headline/author/date match the page; `FAQPage` questions and answers are visible on the page; `BreadcrumbList` matches actual navigation.
4. **Fake or unearned properties:** `aggregateRating`/`review` with no real, visible, collected reviews; `Offer` prices not on the page; `LocalBusiness` address for a business with no premises; `FAQPage` on marketing filler.
5. **Duplication and conflicts:** several conflicting `Organization` blocks; markup on every page that describes only the home page.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Parseable markup is OBSERVED; being *eligible* for a rich result is UNKNOWN (search engines decide, and eligibility rules change).
- Visible-content match is OBSERVED against the rendered page.

## May change

Fix syntax and URLs; remove unsupported or fabricated properties; add minimal, accurate `Organization`/`WebSite`/`Article`/`Product`/`BreadcrumbList` markup **where the page's visible content supports every property you add** and the owner has supplied real values (logo, `sameAs`, author). Never add ratings, reviews, prices, or business details you cannot see on the page.

## Must not claim

"Rich-result eligible", "will show stars/FAQ snippets", "Google-validated". Do not cite validator results you did not run.

## Verify

Re-run the metadata helper; confirm no `JSONLD_INVALID`; compare each property with the rendered page. Suggest the owner check the deployed URL with a rich-results validator; do not claim its outcome.

## Escalate

Ratings/reviews/prices/medical or financial content in schema; multi-location businesses; e-commerce feeds: REVIEW REQUIRED by the owner and, for ratings, `content-trust`.

## No change is valid when

No page fits a schema type, or existing markup is valid and truthful. Skip the work; do not add schema to a site that does not need it.
