# ReadyVibe Skills v1.1 — Conditional Legal Document Templates

**Scope:** Four original Markdown drafting templates for the existing ReadyVibe Skills repository. This is **not** a standalone generator, CLI, SaaS, law library, or a guarantee of legal compliance. The supplied third-party example texts were treated as topic checklists; this pack does **not** republish their boilerplate wording.

## Included templates

| File | Purpose | When to use |
|---|---|---|
| `01-terms-of-service.md` | Practical use, accounts, content, purchases, restrictions and legal decisions | When enforceable rules/terms are appropriate to the product |
| `02-privacy-policy.md` | Actual personal-data collection, purposes, vendors, retention and rights | When privacy transparency is relevant or legally required |
| `03-cookie-policy.md` | Actual cookies, storage, pixels and choices | When a separate policy is appropriate for detected practices or required disclosures |
| `04-returns-refunds-cancellations.md` | Returns, refunds, subscriptions, cancellations and statutory remedies | When goods/services/paid access are sold, and in the appropriate form |

The ToS template is carried forward from the already edited v1.1 Terms draft. The other three are original adaptations of the general categories represented in the supplied examples.

## Key approach: customize only what truly needs to be custom

- **AUTO:** public product name and verified URL; actual routes/features; configured providers; client/server data pathways; storage/network activity; published links; tested cancellation or request controls.
- **AUTO → OWNER CONFIRM:** interpretation of product promises; business purposes for processing; provider roles; retention/deletion commitments; pricing and purchase promises; delivery procedures.
- **OWNER REQUIRED:** actual legal operator (which might be an individual), verified business/privacy/support contact, effective date, intended audience, voluntary refund/return choices, real operational promises. Never infer the legal operator from a domain, username, repository owner, or product branding.
- **LEGAL REVIEW IF RELEVANT:** jurisdiction and regulatory applicability, privacy lawful bases and transfers, minors' data rules, mandatory consumer rights, arbitration/forum/indemnity/limitations, specialized sectors.
- **CONDITIONAL:** keep a paragraph/entire policy only when it matches verified behavior and applies to the intended website. “Not applicable” means omit it, not cross it out in a public policy.

### Evidence and report states

Every claim should carry an internal evidence label: **OBSERVED**, **SOURCE-INDICATED**, **DECLARED**, **INFERRED**, **UNKNOWN** or **REVIEW REQUIRED**. Only publish verified/appropriately confirmed claims; retain review notes separately. "We don't know" cannot become "we don't collect" or "we comply".

## ReadyVibe workflow (without a new engine)

1. **Inspect:** Website routes, copy, frontend/backend integrations, infrastructure, consent and storage behavior, accounts, orders, checkout, deletion and refund controls. Prefer inspecting deployed behavior when available and authorized.
2. **Inventory:** Build an internal matrix of known data flows, vendors, product categories, real user controls, owner/legal unknowns and potential legal geography. Avoid collecting secrets or actual customers' sensitive data.
3. **Select:** Generate only the policies and conditional clauses that fit the site. A static site doesn't automatically need a refund policy or a cookie banner; a paid subscription does need accurate cancellation/billing terms.
4. **Draft:** Assemble human-readable, original language using actual established facts. Never publish bracketed alternatives, unresolved template controls, fictional legal entities, invented cookie names, boilerplate data collections or false legal assurances.
5. **Review:** Ask the few remaining high-impact owner questions. Identify legal matters for qualified review; don't force the owner to manually supply facts already discoverable from the project.
6. **Implement:** Add pages and links consistent with the website's design system, navigation and accessibility. The presence of a page doesn't establish that consent, deletion, refund or cancellation functionality works.
7. **Verify:** Audit the final public text against live behavior and test the relevant controls. Report **READY**, **FIXED**, **BLOCKERS**, **REVIEW REQUIRED**, **UNVERIFIED**, and **NEXT ACTION** as applicable. Do not call a legally unresolved policy “complete”.

## Minimum quality gates

- Every included clause has an evidenced feature, an owner-confirmed commitment, or reviewed legal justification.
- No irrelevant sections about mobile apps, social media, advertising, payments, physical shipments, or subscriptions.
- No copyright-derived Termly attribution, outdated Flash-cookie/Privacy Shield clauses, placeholder third-party providers, assumed cookie managers, or assumed legal geography.
- No unsupported collection, retention, transfer, security, user age, refund, cancellation or legal basis statements.
- The four policies and site flows agree with one another; privacy/cookies, service terms, checkout and refunds don't contradict each other.
- Every cited vendor/link works. Owner/operator names and contact channels are confirmed.
- All `{{...}}`, `[[IF ...]]`, `[[END IF]]` and `[[REVIEW REQUIRED: ...]]` markers are gone from **published** pages. For unresolved material, keep the output **DRAFT — REVIEW REQUIRED** in a private review artifact.
- Human/legal review is flagged proportional to risk; this pack does not imply legal approval.

## Suggested repository integration

Keep this pack as companion references to existing ReadyVibe compliance/privacy/commerce skills, not an app. Update relevant skill instructions to route to these Markdown templates when needed and respect existing companion dependency contracts. Add fixture-based tests for static brochure, account-based SaaS, subscription SaaS, physical commerce, and analytics-driven sites. Check that the generated policy set is appropriately selective and that no fabricated claims or unresolved placeholders are published.

**Publishing note:** These practical drafting templates and inspection workflows are not a guarantee of legal compliance or a substitute for jurisdiction-specific legal advice. Confirm current law and obtain qualified review for materially consequential or uncertain clauses.
