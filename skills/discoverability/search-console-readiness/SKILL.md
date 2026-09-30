---
name: search-console-readiness
description: "Use when a site is publicly live or about to be, and the owner wants search engine verification and sitemap submission prepared. It checks that the property and sitemap can be verified, prepares the exact steps and files an owner must authorize, and states what only Search Console data can show. Do not use it to claim a page is indexed, to submit or verify on the owner's behalf without permission, or before the production URL is final."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "12,13"
---

# search-console-readiness

Search engines tell you what they indexed. Nothing in the repository can. This skill prepares everything on your side and gives the owner a short, accurate checklist for the parts only they can do.

## Activate when

- The production URL is decided and live, or launch is imminent, and the owner wants to be findable.
- `seo-readiness` is clean (or nearly), so submitting a broken sitemap is not the outcome.
- Not before the canonical host is final, and not on staging.

## Inspect

1. **Preconditions:** `seo-readiness` results (no HIGH); the production origin is final; the canonical host, HTTPS, and `www`/apex redirect policy are settled; the sitemap lists canonical live URLs and is declared in `robots.txt`.
2. **Verification method available:** DNS TXT (preferred, covers all subdomains), HTML file upload, meta tag, or existing analytics/tag-manager ownership. Check what the project already has (a leftover `google-site-verification` file or meta tag from a template/previous owner may belong to someone else).
3. **Bing / other engines** (Webmaster Tools import, IndexNow) if relevant.
4. **What the owner must do themselves** and cannot be done by the agent: sign in, claim the property, add DNS records, submit the sitemap, request indexing for key URLs.
5. **What only Search Console shows:** indexed vs. not, coverage reasons, crawl errors, mobile usability, structured-data errors, manual actions.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Everything about indexing status is UNKNOWN without console data supplied by the owner (DECLARED).
- A verification tag in the repo proves nothing about ownership.

## May change

Add a verification meta tag or file **only when the owner provides the token** (never invent tokens); ensure `robots.txt` declares the sitemap; add IndexNow key files if requested. Prepare a short written checklist in the reply. Do not sign in to accounts, add DNS records, or click submit on the owner's behalf.

## Must not claim

"Indexed", "submitted", "verified", "will appear in Google within X days", or any ranking outcome.

## Verify

Confirm the verification file or tag is reachable at the production URL and matches the owner's token; confirm the sitemap URL to submit returns 200 XML with the expected host. After the owner submits, ask them to paste coverage results and interpret those as DECLARED evidence.

## Escalate

Domain ownership questions, migrations, penalties, or mass "Crawled, not indexed" statuses: technical SEO review beyond this pass.

## No change is valid when

The site is intentionally private, still on staging, or already verified with a submitted sitemap. Say so and stop.
