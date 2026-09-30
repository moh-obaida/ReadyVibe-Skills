---
name: forms-readiness
description: "Use when a site has forms (contact, signup, login, waitlist, checkout, search, feedback) and you need to verify that they are labeled, validated, submit to a working endpoint, and handle loading, success, error, and duplicate submission. It exercises forms safely against local or staging with planted test data and checks where the data goes. Do not use it to submit forms on a live production site without authorization, to send real messages, or to invent form endpoints or backends."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "30,35,23"
  helpers: "audit-markup,observe-runtime"
  references: "companion-methods"
---

# forms-readiness

A form that looks fine and silently drops messages is a launch-day disaster: you never learn about the lost leads. "Form exists" tells you nothing; you have to **submit it and see where the data lands**.

## Activate when

- The site has any `<form>` or form-like flow, including signup/login, waitlist, contact, newsletter, checkout, feedback, or search.
- Not on production without the owner's explicit authorization (submitting creates real records, sends real email, or triggers real payments). Not to build backends the owner did not ask for.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `design-system-reconnaissance`, `email-compliance`, `privacy-policy`, `third-party-privacy`, `wcag-readiness`.

## Inspect

**Safety gate first.** Identify the origin. Exercise submissions on **localhost or a staging/test backend** only. If only production exists, do a read-only review (markup, endpoints, validation code) and mark submission behavior UNVERIFIED unless the owner authorizes a specific test with data they can delete. Never enter real payment details; use a provider's test mode and published test values on local/staging only.

1. **Static pass:** `node scripts/audit-markup.mjs --url <site> --render` (paths relative to this skill's folder). Read: `CONTROL_NO_LABEL`, `PLACEHOLDER_ONLY_LABEL`, `FORM_NO_SUBMIT`, `FORM_GET_WITH_PASSWORD` (HIGH), `FORM_EMAIL_TYPE`, `FORM_TEL_TYPE`, `FORM_PASSWORD_AUTOCOMPLETE`, `FORM_ACTION_HTTP`, and `check-links` results for placeholder/dev form actions.
2. **Where does it go?** Read the submit handler: endpoint/action (own API route, server action, Formspree/Getform/Netlify Forms, email service), placeholders like `YOUR_FORM_ID`, env-var-driven endpoints that are unset in production, CORS-blocked endpoints, `localhost` targets.
3. **Runtime exercise** with a planted identity (paths relative to this skill's folder):

   ```json
   [
     {"do":"fill","selector":"input[name=email]","value":"$CANARY_EMAIL"},
     {"do":"fill","selector":"textarea[name=message]","value":"$CANARY_TEXT"},
     {"do":"submit","selector":"form"},
     {"do":"snapshot","label":"after-submit"}
   ]
   ```
   ```bash
   node scripts/observe-runtime.mjs --url http://localhost:3000 --canary --steps form.json
   ```
   Read the step log (`afterSubmit.visibleStatusText`, URL change), request failures, `CANARY_SENT_TO_THIRD_PARTY`, `CANARY_IN_URL`. Then confirm on the backend that the record or message **arrived** (DB row, provider sandbox log, local mail catcher).
4. **Behavior matrix** (exercise each that applies): valid submit; each required field empty; invalid formats (email, phone, URL); overlong input; double-click submit (duplicates?); slow/failed network (offline or blocked endpoint: is an error shown, is input preserved, can the user retry?); success state (clear message, next step, form reset or replaced); server-side validation (bypass the client checks); spam protection present and working (honeypot/captcha/rate limit) without blocking legitimate users.
5. **Accessibility of forms (with `wcag-readiness`):** visible labels, instructions before the field, errors associated with fields and announced, focus moves to the first error or the success message, no placeholder-only labels, input types and `autocomplete` correct, keyboard-only completion.
6. **Data hygiene:** no personal data in URLs (GET forms), no console logging of values, no leakage to analytics; consent/notice near the form where data is collected (`privacy-policy`, `email-compliance` for newsletter signup wording).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- "Submits" is OBSERVED only when the record or message is seen at the destination. A 200 from the endpoint or a success toast alone is SOURCE-INDICATED delivery.
- A success message shown after a failed request is a finding in itself (silent data loss).
- A form you could not exercise is UNVERIFIED, with the reason.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components. Never impose a ReadyVibe look on the user's site.

Add labels and associations, correct input types/autocomplete, add required/format validation client- and server-side where the project has a pattern, add loading/disabled-while-submitting state, add success and error messages in the existing design, preserve input on failure, replace placeholder endpoints with **owner-provided** ones, fix env var wiring. Do not stand up a new backend, choose a third-party form vendor, or route submissions to an invented email address.

## Must not claim

"Forms work" without the destination check; "spam-proof"; "accessible". Do not report that messages are delivered to an inbox you did not verify.

## Verify

Repeat the matrix after changes; confirm the planted record arrives exactly once on double-submit; confirm the error path shows a message and preserves input; re-run `audit-markup` for the form findings.

## Escalate

Forms collecting sensitive/regulated data (health, finance, children's, government IDs), payment forms, or auth flows that cannot be exercised safely; unclear ownership of the destination inbox or vendor account; forms that appear to send to third parties (`third-party-privacy`).

## No change is valid when

The site has no forms, or every form is labeled, validated, delivers to a verified destination, and handles failure. Say what you exercised.
