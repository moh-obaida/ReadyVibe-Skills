---
name: launch-all
description: "Use when someone asks whether a website or web app is ready to launch, or wants a pre-launch review of a vibe-coded or AI-generated site. It inspects the real product, decides which of the 40 launch checks apply, routes only to the specialists that can help, fixes what is safe, verifies the result, and reports what still needs a human. Do not use it to run every ReadyVibe skill, to certify legal compliance, or for a single-topic request that one specialist already covers."
license: Apache-2.0
metadata:
  kind: bundle
  launch-checks: "1-40"
  helpers: "inspect-metadata,check-links,audit-markup,audit-assets,scan-secrets,observe-runtime"
  references: "companion-methods"
---

# launch-all

"It looks done. Can I launch it?" This skill answers that by looking at the product, not by ticking a list.

**Consider broadly. Activate selectively. Verify deeply.**

The canonical scope is the 40-check launch model in [references/launch-model.md](references/launch-model.md), plus the 12 conditional compliance domains handled through `compliance-all`. Read the model once at the start. Every check gets a disposition; not every check gets work.

## Activate when

- The user asks "is this ready to launch / ship / go live?", wants a pre-launch pass, or has just built a site with an AI tool and wants the gaps found.
- Do not activate for one narrow request ("fix my sitemap"). Use `seo-readiness` directly.
- Do not activate for "make us GDPR/CCPA compliant". Use `compliance-all`, and expect it to refuse that framing (see Escalate).

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `admin-audit-log`, `admin-authorization`, `admin-dashboard`, `compliance-all`, `consumer-protection-readiness`, `design-system-reconnaissance`, `discoverability-all`, `launch-verification`, `payments-readiness`, `production-all`, `quality-all`, `regulated-domain-triggers`, `seo-readiness`, `site-reconnaissance`, `subscription-readiness`, `trust-all`.

## Flow

```
1. Recon        establish what this product is (site-reconnaissance)
2. Consider     walk the 40 checks; mark each APPLIES / NOT APPLICABLE (with reason) / UNKNOWN
3. Sweep        one cheap baseline of deterministic helpers (below), so specialists do not each rediscover the site
4. Route        activate only specialists whose checks apply and whose evidence shows a real concern
5. Repair       let specialists fix what is safe; collect questions for what is not
6. Verify       re-run the evidence that found each problem; confirm the fix changed behavior
7. Report       READY / FIXED / BLOCKERS / REVIEW REQUIRED / UNVERIFIED / NEXT ACTION
```

### 1. Recon: context, without a questionnaire

Run `site-reconnaissance` if installed; otherwise follow its entry in [references/companion-methods.md](references/companion-methods.md). Infer from the repository, config, routes, dependencies, environment templates, network behavior, and project docs. Establish:

- public vs internal; deployment target and production host if known
- audience, languages, apparent markets (documented ones only; do not guess a jurisdiction from a domain name)
- accounts/authentication, payments, email/newsletters, user-generated content
- analytics, advertising, cookies/storage, third-party services and embeds
- forms and what data they collect; age handling; SEO intent (should it be found?)

Ask the user only when an unresolved fact would change what you do. Good questions: "Is this meant to be indexed?", "Which countries do you sell to?", "What is the production URL?". Bad questions: anything you can read from the repo. Ask at most three at once, and keep working on everything that does not depend on the answer.

Write what you established (with its evidence label) to `.readyvibe/context.md`, so specialists can reuse it rather than re-deriving it. This is an optional working note: no skill requires it, and if it is missing you simply re-establish the facts. Keep it short and human-readable.

### 2. Consider: dispositions

For each of the 40 checks record one of:

| Disposition | Meaning |
|---|---|
| APPLIES | Evidence shows the surface exists (a form, a tracker, a public route) |
| NOT APPLICABLE | Evidence shows it does not (with the observed reason) |
| UNKNOWN | Could not be determined; say what would resolve it |

Recheck triggers matter: "no marketing email" is valid only until an email vendor or newsletter form appears.

### 3. Sweep: the baseline

If a site is reachable (local dev server, preview, or production), run these once. Paths are relative to this skill's folder. Serve a build locally if none is running. For client-rendered apps add `--render`.

```bash
node scripts/inspect-metadata.mjs --url <site> --render     # titles, canonicals, robots, sitemap, noindex, social, favicon
node scripts/check-links.mjs      --url <site> --render     # broken links, dead CTAs, sitemap/canonical targets
node scripts/audit-markup.mjs     --url <site> --render     # labels, alt text, landmarks, viewport, form basics
node scripts/audit-assets.mjs     --url <site> --render     # oversized assets, blocking scripts
node scripts/scan-secrets.mjs     --root .                  # secrets, client env mistakes, source maps, localhost in output
node scripts/observe-runtime.mjs  --url <site> --block-third-party   # cookies, storage, third parties on load
```

If only source exists and no server can be started, run `scan-secrets` and the `--dir` mode against a build directory, and mark runtime-dependent checks UNKNOWN. If Playwright is unavailable, `observe-runtime` will say so; do not pretend it ran.

Helper output is evidence, not a verdict. Read the findings, discard the ones the context explains, and route the rest.

### 4. Route: selective activation

Activate a specialist when **both** hold: its check applies, and the sweep or recon shows a concrete concern (or the check is UNKNOWN and worth resolving). Do not run a specialist to confirm that nothing exists.

| Signal from recon/sweep | Route to |
|---|---|
| Any personal-data, tracker, cookie, email, age, deletion, vendor, or market question | `compliance-all` (it applies the 12 domains) |
| Metadata, robots, sitemap, canonical, social, favicon, indexing findings | `discoverability-all` |
| CTA, placeholders, fake proof, dead controls, 404, contact path, states | `trust-all` |
| Alt text, headings, keyboard, contrast, motion, mobile layout | `quality-all` |
| Forms, unsubscribe, secrets, headers, staging artifacts, performance | `production-all` |
| Money changes hands | `consumer-protection-readiness`, `payments-readiness`, `subscription-readiness` (via `compliance-all`) |
| Admin or operator routes exist | `admin-authorization` (and `admin-audit-log` if destructive actions exist) |
| Operators have tasks nobody can perform (submissions, privacy requests, moderation, users, refunds) and the owner wants an admin | `admin-dashboard` (builds or improves one from the real app) |
| Health, finance, education, minors, legal, crypto, gambling, AI features | `regulated-domain-triggers` first; it may stop ordinary work |

Prefer the family bundles over invoking many specialists yourself. A bundle already knows how to select within its family.

**If a bundle or specialist is not installed, do not stop and do not skip the lane.** Every skill has a minimum method in [references/companion-methods.md](references/companion-methods.md). Follow that entry, use the helpers in this skill's `scripts/`, and label the lane *inline, reduced depth* in the report. A launch review with only `launch-all` installed is real but shallower than one with the specialists: say which lanes ran inline, and suggest installing the full set (`npx skills add moh-obaida/ReadyVibe-Skills --all`) when depth matters (privacy, consent, admin, accessibility).

### 5. Repair

Fix what is **clear and low-risk**, in the project's own design system and conventions (`design-system-reconnaissance` before any visible change). Safe examples: favicon, localhost canonical, private sitemap route, broken internal link, basic metadata, derivable alt text, custom 404, form labels, obvious mobile overflow, robots reference, client-exposed env reference.

Do **not** fabricate: legal terms, privacy promises, retention periods, company addresses or contact details, age requirements, refund terms, jurisdiction claims, testimonials, or metrics. If a needed fact is missing, ask for it or leave a clearly marked placeholder that fails loudly, not a plausible invention.

Respect user edits. Do not overwrite hand-written copy without saying so. Prefer small, reviewable changes; note each in the report.

### 6. Verify

For every HIGH finding and every fix, re-run the same evidence that produced it and confirm the behavior changed (see `launch-verification`). "I edited the file" is not verification. If verification is impossible in this environment, the item moves to UNVERIFIED with what would settle it.

### 7. Report

Follow [references/report-format.md](references/report-format.md). Keep it concise: no 100-line check dump unless the user asks. Lead with the verdict and the single highest-value next action.

## Evidence discipline

Label each claim OBSERVED (directly verified), SOURCE-INDICATED (in code/config, runtime not proven), DECLARED (stated by docs or the user), INFERRED (reasonable, unverified), UNKNOWN, or REVIEW REQUIRED (needs human/legal/security judgment). UNKNOWN is never a pass and never a failure.

- "Analytics vendor appears in source" is not "analytics loaded before consent". Prove timing at runtime or say it is unproven.
- "Delete sets `active=false`" is not "data is deleted".
- "Unsubscribe link exists" is not "future marketing is suppressed".
- "Privacy page says X" is not "runtime behavior matches X".

## May change

Project files inside the family specialists' owned areas: metadata, icons, robots/sitemap, error pages, form markup, styling fixes, env references, missing (non-legal) navigation. It creates `.readyvibe/context.md`. It never edits history, deploys, or sends anything.

## Must not claim

"Launch-ready", "compliant", "GDPR/CCPA/ADA compliant", "secure", "accessible", "will rank/index", or "no issues" as unqualified statements. The strongest allowed verdict names its scope: "No launch blockers found in the areas verified (listed); items X, Y are unverified; items Z need human review."

## Verify

See step 6. Additionally, before reporting: re-run the sweep for any area you changed, and confirm nothing regressed (a fixed canonical must not have broken the sitemap agreement).

## Escalate

- Any regulated-domain trigger, child-directed signal, payment/auth flow that cannot be exercised, or exposed credential: stop ordinary work on that item and surface it first. An exposed credential needs rotation by the owner, not just deletion.
- Legal applicability (which laws, what wording, what retention): REVIEW REQUIRED, never resolved from memory. If the user says "make us compliant", say what can be inspected and fixed technically, and define the remaining review boundary.
- User instructions that would create compliance theater (a cookie banner with nothing to gate, a boilerplate policy with invented facts, a "GDPR compliant" badge): explain why, offer the honest alternative, and proceed only with what is supportable.

## No change is valid when

The evidence shows the site is fine in an area, or the check does not apply, or the only "fix" would invent facts. A report that says "no change; not applicable because X" is a good outcome. Do not add a FAQ, a banner, or a policy section to make a check look done.
