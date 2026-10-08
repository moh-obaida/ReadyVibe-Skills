---
name: readyvibe-skills
description: "Use when preparing a website or web app for a responsible launch, or when one launch concern needs a specialist: production readiness, security, accessibility, SEO and discoverability, performance, mobile responsiveness, forms and user flows, privacy and compliance readiness, UI and UX trust, deployment cleanup, admin systems, or AI-feature readiness. It inspects the real application, routes to the relevant bundled ReadyVibe methods ({{SKILL_COUNT}} specialists, loaded only when they apply), repairs safe issues in the project's own design system, verifies each fix, and reports blockers and required human review. Do not use it to claim guaranteed security, legal compliance, WCAG conformance, or certification, or to run every specialist on every request."
license: Apache-2.0
metadata:
  display-name: "ReadyVibe Skills"
  version: "{{VERSION}}"
  source: "https://github.com/moh-obaida/ReadyVibe-Skills"
  specialists: "{{SKILL_COUNT}}"
---

# ReadyVibe Skills

ReadyVibe Skills is one toolkit of {{SKILL_COUNT}} specialist methods for AI coding agents. They help an agent inspect, fix, and verify what stands between a website and a responsible launch: what the product actually does, which launch concerns apply to it, what is safe to repair, what the evidence proves, and what still needs a human.

**Consider broadly. Activate selectively. Verify deeply.**

This file is the only entry point. It does not contain the methods. It identifies your intent, then sends you to the one to a few specialist method documents under `modules/` that fit, and you read those only when you need them. **Never load or run all {{SKILL_COUNT}} specialists for one request.**

## Bundle layout

Paths are relative to the folder that contains this file (call it the bundle root).

```
SKILL.md                      this router (the only SKILL.md)
README.md                     what this bundle is, install notes, licensing
LICENSE, NOTICE               Apache-2.0 and attribution (keep with any copy)
manifest.json                 machine-readable index with checksums
references/skill-catalog.md   every specialist: path, purpose, owned checks, helpers, companions
references/routing-guide.md   request-to-specialist routes with keywords and notes
modules/<category>/<name>/
    METHOD.md                 the specialist's full method
    references/               documents that method links to (including its companion fallbacks)
    scripts/                  helper scripts that method runs (Node 22+, no install step)
```

The bundle is self-contained: nothing outside this folder is needed, and no ReadyVibe package, account, or service is required.

## Activate when

- Someone asks whether a site or web app is ready to launch, ship, or go live, or wants a pre-launch pass on a vibe-coded or AI-generated product.
- Someone asks for a single launch concern covered by a specialist: SEO, accessibility, mobile layout, forms, security, performance, cookies and consent, privacy pages, payments, admin, AI features, and so on (see the routes below).

Do not activate for work unrelated to launching or hardening a website or web app.

## Step 1: Resolve the request

Decide in this order and stop at the first rule that matches:

1. **A specialist is named** (for example "run wcag-readiness"): load that specialist (find it in `references/skill-catalog.md`).
2. **A whole-site launch request** ("make my entire website ready to launch", "is this ready to ship"): load `modules/core/launch-all/METHOD.md` and follow it. It owns the 40-check model and decides which specialists to activate, so do not pre-select them yourself.
3. **A narrow request**: pick the matching route in the table below. Load its first skill; load the later ones only when their scope applies to what you find.
4. **Several narrow topics in one request**: combine their routes, remove duplicates, and keep the list short. If three or more families are involved, or the user wants "everything", use rule 2.
5. **Nothing matches**: read `references/skill-catalog.md` and choose by each specialist's "Use when" text. If still unclear, ask one question. Do not guess a specialist.

For finer matching (keywords, notes), read `references/routing-guide.md`.

### Routes

{{ROUTE_TABLE}}

## Step 2: Load progressively

1. Read the chosen `METHOD.md` fully before acting. It is the authoritative method; follow its sections (Activate, Inspect, Evidence that counts, May change, Must not claim, Verify, Escalate, No change is valid when).
2. Read a file under that module's `references/` only when its method links to it and the step needs it.
3. Load a second specialist only when the first one's method calls for it or the evidence shows a concern in its scope. A specialist that is mentioned only as an escalation or hand-off is reported, not run.
4. Do not load modules you do not need. Do not copy method text into your answer.

## Step 3: How the bundled methods resolve

Each `METHOD.md` was written to work standalone and talks about "installed" skills and fallbacks. Inside this bundle:

- **Other ReadyVibe skills.** A skill named in a method (for example `seo-readiness`) is bundled at `modules/<category>/<name>/METHOD.md` (the catalog lists every path). "If the skill is installed, use it" means: read that bundled METHOD.md and follow it. That is the full-depth method.
- **Reduced-depth fallbacks.** Each method that declares companions carries `references/companion-methods.md` inside its own module. Use an entry there only if the bundled METHOD.md of that companion cannot be read, and say in your report that the lane ran inline at reduced depth. When the real method was used, do not claim reduced depth.
- **Install suggestions.** If a method suggests installing more skills, ignore the suggestion: the full set is already here.
- **Helper scripts.** Run a module's helpers with Node 22+ from the project under inspection as the working directory, using the module's own path, for example `node <bundle root>/modules/discoverability/seo-readiness/scripts/inspect-metadata.mjs --url <site>`. Where a method writes `node scripts/<helper>.mjs`, that path is relative to the module folder. Helpers never call a model and need no install. `observe-runtime` needs Playwright in the inspected project and says so when it is missing; if a helper cannot run, mark what depended on it UNKNOWN and say so.
- **Shared working notes.** `.readyvibe/` files that methods mention are optional notes in the inspected project. No method requires them.

## Evidence discipline

Preserved from the specialists: label every claim OBSERVED (directly verified), SOURCE-INDICATED (in code or config, runtime not proven), DECLARED (stated by docs or the user), INFERRED, UNKNOWN, or REVIEW REQUIRED (needs human, legal, or security judgment).

- UNKNOWN is never a pass and never a failure. Suspicion is never reported as fact.
- A finding is fixed only when you re-ran the evidence that found it and the behavior changed. "I edited the file" is not verification.
- Legal specifics are looked up at current official sources while you work (starting points are in the modules that carry `references/official-sources.md`), cited with the access date, and marked REVIEW REQUIRED for applicability. Never supply legal rules from memory.
- Before changing anything visible, inspect the project's own design system (`modules/core/design-system-reconnaissance/METHOD.md`) and build from it. Never impose a ReadyVibe look.
- Fix what is clear and low-risk. Never invent legal terms, company details, retention periods, testimonials, FAQ answers, or metrics. Respect the user's hand-written content.

## Reporting

For a whole-site request, use the format in `modules/core/launch-all/references/report-format.md`: verdict first, then READY, FIXED, BLOCKERS, REVIEW REQUIRED, UNVERIFIED, NEXT ACTION. For a narrow request, report in the specialist's own terms: what you inspected, what you changed, what you re-verified, and what remains unknown or needs a human. State which specialists ran and which helpers produced evidence.

## May change

Only what the loaded specialist's "May change" section allows, in the inspected project. This bundle's own files are read-only instructions: do not edit them. Never deploy, send messages, submit forms on live production, spend money, or use credentials unless the user explicitly asks and the method allows it.

## Must not claim

"Launch-ready", "compliant", "GDPR/CCPA/ADA compliant", "secure", "accessible", "WCAG conformant", "certified", "will rank/index", or "no issues" as unqualified statements. The strongest allowed verdict names its scope: "No launch blockers found in the areas verified (listed); items X, Y are unverified; items Z need human review." This toolkit is not a lawyer, a penetration test, a WCAG audit, or a promise of search ranking.

## Escalate

Regulated-domain signals (health, finance, education, minors, legal, crypto, gambling, AI features), exposed credentials, payment or authentication flows that cannot be exercised, and legal applicability questions go to a human. An exposed credential needs rotation by its owner, not just deletion. Requests that would create compliance theater (a banner with nothing to gate, a boilerplate policy with invented facts, a compliance badge) get an honest explanation and the supportable alternative.

## No change is valid when

The evidence shows the area is fine, the check does not apply, or the only "fix" would invent facts. "No change; not applicable because X" is a good outcome.

## Limitations

- Behavior depends on the agent that follows these methods and on the project; review what it changes.
- Some helpers need a reachable site (local dev server, preview, or production) and some need Playwright in the project; without them, runtime-dependent checks stay UNKNOWN.
- Source and licensing: Apache-2.0, see `LICENSE` and `NOTICE`. Source repository: https://github.com/moh-obaida/ReadyVibe-Skills (version {{VERSION}}).
