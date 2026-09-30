---
name: content-trust
description: "Use when a site should make its purpose and next step clear and its content should be real: primary call to action, dead-end pages, placeholder or lorem text, fake or unverifiable metrics, testimonials and logos, misleading claims, unfinished UI, and whether an FAQ would help. It removes or flags fakes and verifies controls work. Do not use it to invent testimonials, metrics, or customers, to force an FAQ or a giant CTA onto every page, or to write marketing copy the owner has not approved."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "19,23,26"
  helpers: "check-links,audit-markup"
  companions: "design-system-reconnaissance"
---

# content-trust

A launch-ready site does what it visibly promises, and tells the truth about itself. This skill covers the product-readiness half that is not legal: purpose, action, help, and honesty of content.

## Activate when

- Reviewing any public page before launch, or a site "feels unfinished/fake".
- Placeholder text, template leftovers, stat counters, testimonial carousels, logo strips, or "as seen in" sections exist.
- Not for legal claims analysis (`policy-consistency`) or visual redesign.

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `design-system-reconnaissance`.

## Inspect

**1. Purpose and primary action (check 19).** Land as a first-time visitor. Within a screen: can you tell what this is, who it is for, and what to do next? Identify the **one primary action** (sign up, buy, book, download, contact). Verify it works: click it. Find dead-end pages (no next step, no navigation back). This is not "add a big button everywhere"; a documentation page's next step is the next doc.

**2. FAQ need.** Does the product predictably raise questions that are unanswered where visitors decide (pricing and billing, what happens to my data, cancellation, delivery, how it works)? Note it and hand the work to `faq-readiness`, which finds the real questions, verifies the answers, and builds the FAQ in the site's design. Do not write an FAQ here, and never manufacture one.

**3. Dead and fake controls (check 23).** Search rendered pages and source for: `href="#"`, buttons without handlers or with `onClick={() => {}}`/`console.log`, forms without a working submit, disabled "Coming soon" controls presented as live, toggles that do not persist, search boxes that do nothing, social icons linking to `#` or the platform homepage, "Book a demo" that opens nothing. Use `node scripts/check-links.mjs --url <site> --render` for hrefs (paths relative to this skill's folder), and exercise interactive controls in a browser.

**4. Placeholder and starter content.** Run `node scripts/audit-markup.mjs --url <site> --render`; its `PLACEHOLDER_TEXT` findings list lorem ipsum, template wording ("Your Company", "insert text here"), sample names and phone numbers, `TODO`/`TBD`/`{{ }}` markers, and "coming soon" in visible text. It only catches what it has patterns for, so also read the pages. "Lorem ipsum", "Your Company", "Acme", "John Doe", "example.com", template author names, default framework pages, stock 'Team member' cards, empty sections, unfinished pricing rows, "Coming soon" with no plan, `TODO`, default images, wrong product name on inner pages.

**5. Claims, metrics, testimonials, social proof (check 26).** Build a list of every number, superlative, logo, quote, rating, badge, and "featured in". For each ask: what is the source? Who said it? Is it current? Signals of fakeness: identical wording or avatars from stock sets, round numbers and counters that animate up on load, "10,000+ users" on a pre-launch product, logos of companies with no relationship, badges for certifications the owner cannot show (SOC 2, "GDPR compliant", "PCI"), "as seen in" without links, countdown timers that reset on reload, "3 people are viewing this" widgets with random numbers.

**6. Consistency.** Product name, descriptions, prices, and features agree across pages, meta, emails, and legal pages (`launch-identity`, `policy-consistency`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A control that does nothing on click, proven by clicking it: OBSERVED. A handler you read but did not run: SOURCE-INDICATED.
- A claim you cannot verify is **unverified**, not **false**. It is *false* only when evidence shows it (a random-number generator behind the counter; a timer that resets; a template's stock quote).
- Owner-supplied proof (a study link, customer permission, a real testimonial) is DECLARED and should be cited on the page where appropriate.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components. Never impose a ReadyVibe look on the user's site.

- Remove or hide clearly fake elements (timers, random viewer counts, template testimonials, logo strips with no owner confirmation) or replace with an honest neutral element.
- Replace placeholders with **owner-supplied** content; where none exists, remove the empty section rather than shipping filler.
- Wire a dead control to its evident intended target, or remove/disable it with honest copy.
- Improve the primary CTA's clarity (label, prominence, placement) within the existing design system, using wording that describes what actually happens.
- Hand any FAQ or help-content work to `faq-readiness`.
- Never invent testimonials, customer names, user counts, ratings, press, awards, or partnerships. Never write claims you cannot back.

## Must not claim

"Trustworthy", "verified", "trusted by X", or any endorsement. Never state an outcome ("increases conversion 40%") without a source. Do not call content "real" because it is plausible.

## Verify

Re-walk as a first-time visitor on desktop and 375px: primary action obvious and working, no dead controls in nav/footer/hero, no placeholder strings (search the rendered site for a list of patterns), each remaining claim has a source or was removed. Re-run `check-links`.

## Escalate

Financial, health, security, or performance claims (revenue, "guaranteed", medical outcomes, "unhackable", "GDPR compliant") that the owner cannot substantiate: REVIEW REQUIRED, and recommend removing or softening them. Testimonials about a product that has not launched: stop and ask.

## No change is valid when

The primary action is clear and works, no placeholders remain, claims are sourced or absent, and no high-friction questions go unanswered. Do not add an FAQ or extra CTAs to fill a checklist.
