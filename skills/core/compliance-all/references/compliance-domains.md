# The ReadyVibe compliance model: 12 conditional domains

These 12 domains sit on top of the 40 launch checks. They are **applicability-driven**: a domain only becomes an active workstream when evidence says it applies to this product. Every domain starts as *considered*, and ends as one of: **not currently applicable** (with the observed reason), **applicable, behavior verified**, **applicable, review required**, or **unknown**.

No domain ever ends as "GDPR ✅", "CCPA ✅", or "ADA ✅". The strongest allowed outputs are narrow, evidence-bound statements, such as "no non-essential trackers were observed before interaction on the pages exercised".

**Owner** carries the method. **Also** contributes evidence.

| # | Domain | What it asks | Owner | Also | Applies when (evidence) | Escalates to a human when |
|---|---|---|---|---|---|---|
| 1 | Jurisdiction / market applicability | Where do users and the business operate, and which rule sets *may* matter? | jurisdiction-applicability | site-reconnaissance, multilingual-readiness | Always considered; it feeds every other domain | Markets are unclear, or several regimes may apply. Rules are never supplied from memory |
| 2 | Privacy disclosure vs actual data behavior | What is collected, why, where does it go, and does the notice match? | policy-consistency | privacy-policy, data-flow-mapping, privacy-readiness | Any personal data is collected, stored, or transmitted | A required fact is missing (controller identity, retention, legal basis) or a disclosure contradicts behavior |
| 3 | Cookies / trackers / consent | What stores or loads, and do reject / accept / withdraw work where consent is applicable? | consent-management | cookie-and-storage-audit, analytics-privacy | Any cookie, storage key, or third-party tracker is observed or source-indicated | Applicability of consent depends on a rule not yet looked up at an official source, or runtime proof is unavailable |
| 4 | Marketing communications | Consent, sender identity, unsubscribe, suppression, preferences | email-compliance | data-rights | The product sends or plans to send marketing or newsletter email | Consent basis or jurisdiction-specific sender rules are unclear |
| 5 | Age / children / minors | Audience, age collection, parental handling | minors-readiness | regulated-domain-triggers | The audience may include minors, or age/DOB is collected, or content targets young users | Any child-directed signal. A decorative age gate is not a control |
| 6 | User privacy rights | Access, correction, deletion, export, objection / opt-out | data-rights | privacy-readiness | Accounts exist, or personal data is stored, or the notice promises rights | Legal timelines, identity verification, or retention duties are unspecified |
| 7 | E-commerce / consumer protection | Pricing, subscriptions, cancellation, refunds, recurring billing, merchant identity | consumer-protection-readiness | subscription-readiness, payments-readiness | Money changes hands, or an offer/price/subscription is shown | Refund, withdrawal, auto-renewal, or tax wording is jurisdiction-specific and not source-backed |
| 8 | Accessibility obligations | Where accessibility may carry legal weight, beyond good UX | wcag-readiness | mobile-readiness, forms-readiness | Public-facing product, commerce, public-sector, or education audience | Always as REVIEW REQUIRED for legal significance. A scan cannot establish conformance |
| 9 | Third-party vendors / data sharing | Analytics, payment processors, embeds, external services, transfers | third-party-privacy | analytics-privacy, data-flow-mapping | Any third-party host is contacted or a vendor SDK is present | Cross-border transfer, processor terms, or sensitive data reach a vendor |
| 10 | Security / production obligations | Exposed secrets, account handling, disclosures, applicable security requirements | web-security | security-headers, deployment-cleanup, dependency-security | Always considered for a deployed product | A credential leaked, a breach is suspected, or a sector security standard may apply |
| 11 | Regulated-domain triggers | Health, finance, education, children, legal, crypto, gambling, and similar | regulated-domain-triggers | ai-features-readiness, minors-readiness | Product language, data fields, or features touch a regulated domain | Always. These stop being "ordinary web rules" and need specialist review |
| 12 | Legal identity / IP / required notices | Company and contact disclosures, copyright, trademark, licensing, attribution | legal-identity-notices | public-support, legal-navigation, launch-identity | Any public product; deeper if commerce, user content, or third-party assets exist | Operator identity, registered address, or license obligations are unknown |

## Output shape per domain

```
Cookies / trackers / consent: review required
  Observed: analytics request to a Google Analytics host before any interaction (3 pages exercised).
  Unknown: whether consent is required for this audience and market (markets unstated; no official source consulted).
  Next: confirm markets; if consent applies, gate the tag and re-run reject/accept/withdraw.
```

```
Marketing communications: not currently applicable
  Observed: no email provider SDK, no newsletter form, no send route.
  Recheck if: a signup form or email vendor is added.
```

```
Consumer subscription rules: applicable concern
  Observed: recurring billing exists in checkout.
  Unknown: cancellation and refund terms could not be found in the product or terms.
```

## Rule sources

ReadyVibe carries no legal database. Jurisdiction-specific obligations are looked up at an official source **while the skill runs** (starting points: `references/official-sources.md`), cited with the access date, and never supplied from memory. If a source cannot be consulted, the domain is **UNKNOWN / review required**, and the skill still reports the technical facts it can verify. Nothing in this model is legal advice.
