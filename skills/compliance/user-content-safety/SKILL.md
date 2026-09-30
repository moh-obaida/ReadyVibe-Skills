---
name: user-content-safety
description: "Use when users can publish, upload, comment, message, or share content that others can see, and you need to check reporting routes, moderation hooks, abuse controls, and stored-content risks such as XSS and unsafe uploads. Do not use it to add a moderation queue or reporting flow to a product with no user-visible user content, or to provide legal advice about platform liability."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "12"
  launch-checks: "38"
  companions: "design-system-reconnaissance"
---

# user-content-safety

The moment strangers can put content in front of other strangers, the site needs a way to hear about abuse and a way to act on it, and its rendering must not let content attack visitors.

## Activate when

- Posts, comments, reviews, profiles with bios/avatars, uploads, messages, public galleries, or shared links exist.
- Not when users only see their own private data, or when content is admin-authored only.

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `design-system-reconnaissance`.

## Inspect

1. **Where content appears and to whom** (public, logged-in, group, private link). Anonymous posting? Signup friction?
2. **Reporting:** a visible way to report content or a user; the report goes somewhere real (email inbox, queue) and is monitored; confirmation is shown.
3. **Moderation hooks:** can the owner remove content and suspend users (`admin-authorization`, `admin-dashboard` only if none exists and it is needed)? Are actions logged (`admin-audit-log`)? Any automated filtering the copy claims?
4. **Abuse controls:** rate limits on posting, signup, and uploads; spam prevention (captcha with privacy trade-offs noted); link/URL handling (`rel="ugc nofollow"`); blocking.
5. **Rendering safety:** user text rendered as text or sanitized (XSS: `dangerouslySetInnerHTML`, `innerHTML`, markdown renderers without sanitization); user-supplied URLs in `href`/`src` (javascript: URLs); uploads validated by type/size, served from a separate origin or with safe headers, not executable; image metadata (EXIF location) stripped where relevant.
6. **Privacy of contributors:** public display of email/full name by default; deletion of authored content (`data-rights`).
7. **Rules and enforcement:** community rules or acceptable-use text exist and match what moderation can do (`terms-of-service`).
8. **Takedown/IP contact** for infringement reports (`legal-identity-notices`).
9. **Children:** if minors may post, escalate (`minors-readiness`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Unsafe rendering is SOURCE-INDICATED until you prove it on staging with an inert test payload (e.g. text containing `<b>x</b>` renders as text).
- A "Report" button that goes nowhere is a finding; test that the report arrives.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components, by the component ladder: reuse, compose, extend, and only then create a matching component. Never impose a ReadyVibe look on the user's site.

Add/repair a report link to an existing inbox or form; sanitize or escape rendering; add `rel="ugc nofollow noopener"`; add basic rate limits where the project has a pattern; tighten upload validation. Do not build a moderation platform, invent an inbox, or claim moderation exists.

## Must not claim

"Safe", "moderated", "abuse-free", "we review all content", or anything about legal immunity or liability.

## Verify

On staging: post inert HTML/script-like text and confirm it is inert; submit a report and confirm delivery; hit the posting endpoint repeatedly to confirm limits; upload a disallowed type and confirm rejection.

## Escalate

Public posting by minors, adult content, harassment risk, legal-content categories (hate, exploitation), and any real report of harm: human review and, for serious cases, legal counsel.

## No change is valid when

The product has no user-visible user content. Record the routes and forms checked.
