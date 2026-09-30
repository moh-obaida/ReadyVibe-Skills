---
name: public-support
description: "Use when a public product needs a working way for visitors to reach a human: support, privacy, and business contact paths that exist, work, and match what pages promise. It checks addresses, forms, and consistency, and repairs broken or placeholder contact routes with owner-provided details. Do not use it to invent an email address, phone number, or physical address, to promise response times the owner has not set, or to add live chat nobody will staff."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "8,25"
  compliance-domains: "12"
---

# public-support

Visitors need a way to say "this is broken", "delete my data", or "I was charged twice". A contact path that bounces or never gets read is worse than an honest "email us at…".

## Activate when

- Any public product; especially commerce, accounts, forms, or a launch with press attention.
- Legal pages reference a contact route; footer says "Contact" but goes nowhere.
- Not to set up a helpdesk or staff support.

## Inspect

1. **What paths exist:** contact page/form, `mailto:` links, support/privacy addresses (`support@`, `privacy@`, `legal@`), help center link, social DMs, in-app chat, phone/address where the business type expects it.
2. **Do they work?** Links resolve (`check-links`); mailto addresses are on a domain that has mail (the owner confirms the mailbox exists and is monitored; you cannot verify a mailbox from here: UNKNOWN unless they say); contact forms submit to a verified destination (`forms-readiness`); no placeholder domains (`hello@example.com`, `yourcompany.com`).
3. **Consistency:** the same contact details in footer, contact page, privacy notice, terms, checkout, emails' footers, 404 page. Mismatched or stale addresses are findings.
4. **Fit to promises:** the privacy notice's rights-request route (`data-rights`), refund/cancellation contact (`consumer-protection-readiness`), abuse reporting (`user-content-safety`), accessibility feedback route where stated. Each promised route must exist and work.
5. **Findability:** contact reachable from every page (footer/nav) and from failure states (error pages, checkout errors).
6. **Expectations set:** any stated response time is real (owner-provided); no "24/7 support" claims for a solo project.
7. **Business info expected of this type of site** (owner-supplied): who runs it and, for commerce or services, the contact details customers can use (`legal-identity-notices`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Link resolves: OBSERVED. Mailbox monitored: DECLARED by the owner or UNKNOWN. A `mailto:` link does not prove a working inbox.
- Phone/address details are DECLARED; never verify by searching for a guess.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components. Never impose a ReadyVibe look on the user's site.

Fix placeholder or dead contact links; unify contact details across pages **using owner-supplied values**; add a contact link to the footer and error pages; wire the contact form to a verified destination the owner names; add the privacy-contact line to legal pages where the owner provides the address. Ask for anything missing. Do not invent addresses, numbers, response times, or team names.

## Must not claim

"Support is available 24/7", "we respond within X", or "we're a real company at Y". Do not invent phone numbers, physical addresses, or registration numbers.

## Verify

Click every contact route from a page footer and from a 404; confirm the same details appear in legal pages; for forms, follow `forms-readiness` (planted test message arrives at the owner's inbox on staging); ask the owner to send a test email to each address and confirm receipt.

## Escalate

Regulated or commerce sites where identification details are mandatory in some places: REVIEW REQUIRED (`legal-identity-notices`). Any privacy or data-rights request route that lacks an owner.

## No change is valid when

Contact paths exist, work, agree everywhere, and match promises. A personal project may reasonably offer one email address; that is fine if it works.
