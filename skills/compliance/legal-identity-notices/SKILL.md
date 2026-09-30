---
name: legal-identity-notices
description: "Use when a public product needs to show who operates it and carry the notices its assets require: business or operator identity, copyright and trademark statements, open-source and image or font licenses, attribution, and takedown or contact routes for content. It finds missing or inconsistent identity and license notices and marks owner-only facts. Do not use it to invent a company name, address, registration number, or license text, or to give IP legal advice."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "12"
  launch-checks: "8,25"
  references: "official-sources,companion-methods"
---

# legal-identity-notices

Visitors and regulators both expect a real operator behind a site, and asset licenses (fonts, images, icons, libraries) come with conditions. AI-built sites routinely ship with "© 2023 Your Company", stock images of unknown origin, and dropped attribution.

## Activate when

- Any public product, and especially: commerce, user accounts, user content, or third-party assets (images, fonts, icons, code, datasets, templates).
- The footer or legal pages show placeholders, an outdated year, or a name that differs from the product.
- Not to draft trademark or copyright legal strategy.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `dependency-security`, `policy-consistency`, `user-content-safety`.

## Inspect

1. **Operator identity.** Footer, about, contact, terms, invoices/receipts: legal or trading name; whether it matches across all of them; registered address or contact where the business type expects it (commerce, B2C services); registration or tax numbers where the owner has them. Missing facts are **owner-only**: list them.
2. **Copyright line.** Present, correct owner, sensible year or range, not "Your Company", not a template's author.
3. **Trademarks.** Product name used consistently; ™/® only if the owner asserts a mark. Third-party logos or names used (customer logos, "works with" strips, integrations) and whether the owner has permission (ask; do not assume).
4. **Asset licenses.**
   - **Code and dependencies:** run `licenses`/manifest inspection; copyleft or attribution-required licenses in shipped client code; missing `LICENSE`/`NOTICE` where required. (`dependency-security` for vulnerabilities.)
   - **Images, illustrations, icons, fonts, video, music:** provenance for shipped assets (stock, AI-generated, downloaded from a search); license terms and required attribution; template/theme licenses (a paid theme may require a per-site license).
   - Ask for the source if unknown. "No provenance found" is UNKNOWN, not a violation.
5. **Attribution pages.** If licenses require credit, is there a visible acknowledgements/credits page or footer link?
6. **User content and takedown.** If users upload content: is there a contact/route for reporting infringement or abuse (`user-content-safety`)?
7. **Consistency.** The operator named in terms, privacy notice, checkout, emails, and footer must be the same entity (`policy-consistency`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Identity facts are DECLARED by the owner; look them up in project files, not on the web for a guessed entity.
- A license file found in a package is SOURCE-INDICATED; whether usage complies is REVIEW REQUIRED.
- Image reverse-search is not proof of license status; report as UNKNOWN unless the owner has documentation.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Replace placeholder copyright text with **owner-supplied** identity; make the name consistent everywhere the owner confirms; add an acknowledgements/credits page listing licenses that the packages themselves declare; add visible contact/report routes that exist; add alt/credit text where an asset's license requires it and the owner supplies it. Do not invent entities, addresses, numbers, or ® marks; never swap in stock images without the owner deciding.

## Must not claim

"Fully licensed", "no IP issues", "trademarked", "registered", or any statement about ownership or infringement. Do not fabricate license text; only reproduce what the package declares.

## Verify

Search rendered pages and legal pages for placeholder patterns ("Your Company", "Lorem", "© 20XX", template author names) and confirm zero; confirm operator name and contact are identical in footer, terms, privacy, and checkout; confirm credit/license pages resolve (`check-links`).

## Escalate

Unknown provenance of significant assets, copyleft in a proprietary product, use of third-party brands/logos, or user content with infringement risk: REVIEW REQUIRED; name the specific asset or obligation that is unresolved. Keep the recommendation proportional: name the specific unresolved fact or risk that warrants it (minors, sensitive data, a regulated domain, cross-border sale, unclear markets, contested wording), and do not tell an ordinary low-risk site to hire a lawyer.

## No change is valid when

Operator identity and notices are complete and consistent, and asset licenses are documented. Or (personal project) the owner chooses minimal identity; record that choice as DECLARED.
