---
name: faq-readiness
description: "Use when a site needs an FAQ or help section, or when visitors predictably have questions about pricing, billing, cancellation, data, delivery, or how the product works that the site does not answer at the point of decision. It works out the real questions from the product, its support traffic, and its own policies, writes answers only from facts it can verify, and builds the FAQ in the project's existing design. Do not use it to invent questions or answers, to pad a self-explanatory site with a generic FAQ, or to write legal, refund, or privacy wording the owner has not published."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "20"
  helpers: "check-links"
---

# faq-readiness

A good FAQ removes the doubt that stops someone from signing up, buying, or trusting the site. A bad one is filler: made-up questions, vague answers, and promises nobody approved. This skill builds the first kind, from real questions and verified answers, and says so when a site does not need one.

## Activate when

- The user asks for an FAQ, help center, or "common questions" section.
- A launch review (`launch-all`, `trust-all`, `content-trust`) found predictable questions left unanswered at the point of decision: what does it cost, what happens when the trial ends, how do I cancel, what do you do with my data, when will it arrive, does it work with X.
- Support messages or the contact inbox keep asking the same things.
- Not when the product is self-explanatory and low-friction. Then say so; a clearer headline or call to action is usually the better fix (`content-trust`).

## Inspect

**1. Find the real questions.** Sources, best first:

- The owner's support inbox, contact-form submissions, DMs, and reviews, if they share them (do not read private inboxes without being given access; ask for a sample).
- The product itself: what a first-time visitor must decide before acting (price, plan differences, trial and renewal, delivery, compatibility, account, data, cancellation, security).
- Existing copy: pricing page, checkout, terms, privacy notice, README, docs, changelog, issue tracker, onboarding emails. Questions that these already raise but do not answer are candidates.
- The product type's usual friction: a store (shipping, returns, sizing, payment methods), SaaS (pricing, limits, integrations, data export, cancellation, security), a newsletter (frequency, unsubscribe, privacy), a marketplace (fees, disputes, safety), a service business (scope, timelines, pricing, booking).

Do not fabricate "frequently asked" questions. If there is no evidence a question is asked, it is a candidate, not a fact, and the page must not claim otherwise.

**2. Classify each candidate question by how it can be answered.**

| Class | Meaning | Action |
|---|---|---|
| **Answerable from the product** | the answer is a verifiable fact in code, config, pricing, or shipped behavior | write it, cite the source to yourself, verify it |
| **Answerable from published policy** | the answer is what an existing terms, refund, or privacy page says | link to that page and summarize it faithfully; never introduce a new promise |
| **Needs the owner** | a business fact only they know (turnaround time, coverage area, warranty) | ask; until answered, do not publish the question |
| **Legal or regulated** | refunds, cancellation rights, privacy rights, health, finance, safety | use only published policy text; otherwise REVIEW REQUIRED and leave it out |

**3. Design it for this site.** Read the existing site with `design-system-reconnaissance` first, and decide from the product where the FAQ belongs: a dedicated page, a section on the pricing page, inline near the checkout button, or a few answers beside the signup form. Group by the visitor's decision stage rather than a generic list, order by likelihood of the doubt, and write in the site's own voice. A large support-heavy product may want categories and search; a small one wants ten crisp answers.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- An answer about behavior is OBSERVED only when you verified it in the product ("free plan allows 3 projects" from the plan config or by trying it). From code alone it is SOURCE-INDICATED.
- An owner-supplied fact is DECLARED. Cite where it came from in your reply so it can be re-checked.
- A question with no evidence it is actually asked is INFERRED. Do not call the page "frequently asked" on inference alone; title it "Questions" or "Good to know".
- Policy content (refunds, privacy, terms) must match the published page word for word in substance. If the policy does not exist or is silent, the answer is UNKNOWN and the question is not published.

## May change

- Create the FAQ page or section with the project's own components and design tokens (an accordion or `<details>` if that is what the site already uses; plain headings and text if not), with a stable anchor per question so answers can be linked.
- Link it from the navigation or footer, the pricing page, the checkout or signup context, the contact page, and the 404 recovery links, where it helps visitors find it.
- Write concise, specific answers from verified facts. Put the answer first, add a link to the deeper page when one exists, and state limits honestly ("available in the US and Canada").
- Add `FAQPage` structured data only when the questions and answers are visible on the page and it is a true FAQ, through `structured-data`. Do not promise a rich result; search engines decide.
- Leave unanswered questions out and list them in your reply as "owner to answer".
- Never invent questions, statistics ("most customers ask…"), answers, policies, response times, or guarantees.

## Must not claim

That the FAQ is complete or that visitors ask these questions, unless real support data shows it. Do not write legal, refund, cancellation, privacy, or security assurances that no published policy or verified behavior supports.

## Verify

- Every answer traces to a source (code, config, the owner, or a published policy page), and you can name it.
- Links resolve and each question's anchor works (`node scripts/check-links.mjs --url <site> --render`, path relative to this skill's folder).
- The section matches the site: same fonts, colors, components, spacing, and voice at laptop and 375px width.
- Accessibility: real headings, keyboard-operable expand and collapse, visible focus, and no content hidden from screen readers when collapsed incorrectly (`wcag-readiness`).
- Answers about policy, price, or data agree with the pricing page, terms, and privacy notice (`policy-consistency`).
- Every published question is one visitors plausibly ask; nothing is filler.

## Escalate

Answers that touch refunds, cancellation rights, privacy rights, medical, financial, or safety claims, or security assurances ("your data is encrypted"): use only owner-approved published text, look up any legal specifics at official sources through the relevant skill (`privacy-policy`, `consumer-protection-readiness`), and mark REVIEW REQUIRED where it is not settled. Never resolve them from memory.

## No change is valid when

The site is self-explanatory, the key decisions are already answered where visitors make them, and there is no evidence of repeated questions. Report "no FAQ needed" and name what to watch (support messages, pricing confusion). Do not add a generic FAQ to complete a checklist.
