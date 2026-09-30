---
name: failure-resilience
description: "Use when a UI loads data, calls APIs, or performs actions that can be slow, empty, or fail, and you need to check loading, empty, success, error, and recovery states: no infinite spinners, no blank screens, no swallowed errors, no lost input. It exercises failure paths and fixes states in the existing design. Do not use it to add spinners everywhere, to hide failures behind fake success, or for static pages with no data fetching."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "24,35"
  helpers: "observe-runtime"
  references: "companion-methods"
---

# failure-resilience

Demo data and a fast laptop hide the states real users meet on day one: slow networks, empty accounts, failed requests, expired sessions. AI-built UIs usually implement only the happy path.

## Activate when

- The UI fetches data, submits actions, uses auth, uploads files, or renders lists/results that can be empty.
- Reviewing before launch or after users report blank screens or "stuck" pages.
- Not for fully static sites with no interactive data (say so).

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `design-system-reconnaissance`.

## Inspect

**1. Enumerate the data-dependent views and actions** from routes and components: lists, dashboards, detail pages, search, forms, uploads, payments, auth transitions.

**2. For each, the five states:**

| State | What good looks like |
|---|---|
| **Loading** | Immediate, proportionate feedback (skeleton/spinner) with layout that does not jump; slow (>~3s) loading tells the user something; never a spinner that can outlive a failed request |
| **Empty** | Explains what would be here and offers the next action ("No invoices yet. Create your first."); not a blank area or a raw `[]` or `undefined` |
| **Success** | Confirms what happened; next step; state updated |
| **Error** | Human-readable message, what happened, what to do; retry; input preserved; no raw stack/JSON/HTTP codes; no red-screen crash |
| **Recovery** | Retry works; expired session prompts sign-in and returns the user; offline/timeout handled; double-click does not double-act |

**3. Force the failures** (local/staging only). The runtime helper can fail, slow, and cut the network (paths relative to this skill's folder):

   ```bash
   node scripts/observe-runtime.mjs --url <site> --fail "**/api/items=500"            # server error
   node scripts/observe-runtime.mjs --url <site> --fail "**/api/items=abort"          # network failure
   node scripts/observe-runtime.mjs --url <site> --fail "**/api/items=401" --steps s.json   # expired session
   node scripts/observe-runtime.mjs --url <site> --delay "**/api/items=6000" --screenshots ./shots --steps s.json
   ```
   Steps can `click`, `reload`, `screenshot`, and `{"do":"offline","on":true}` to lose the network mid-flow. Screenshots let you *see* the loading, empty, and error states; `REQUEST_FAILURES` and `CONSOLE_ERRORS` show what the page logged. Also try an empty list (serve `[]`) by pointing at a staging backend or a stub. Watch for: spinner forever; blank white screen; console errors with no UI; success toast after a failed request; data disappearing; infinite retry loops.

**4. Code patterns:** `try/catch` that only `console.log`s; `.catch(() => {})`; loading flags never reset in `finally`; missing error boundaries (React) or `error.tsx`/`+error.svelte`; optional chaining hiding `undefined` renders; `Suspense` without fallback; unhandled promise rejections; lists rendering `.map` on possibly-undefined data.

**5. Auth and session transitions:** expired token mid-action; logged-out user hits a private URL (redirect vs error); post-login return path.

**6. Error copy honesty:** no fake success, no "Something went wrong" with no route forward when a retry or support link is available.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A state forced at runtime and seen: OBSERVED. A state handler in code: SOURCE-INDICATED.
- If a backend cannot be failed safely, mark those paths UNVERIFIED with what would be needed.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components. Never impose a ReadyVibe look on the user's site.

Add or fix loading, empty, error, and success states in the existing design system; add `finally` resets; add error boundaries and route-level error pages; preserve form input on failure; add retry affordances; add timeouts where the pattern exists. Do not add global fake success, hide errors, or over-engineer retry/backoff frameworks.

## Must not claim

"Resilient", "handles all failures", or "production-ready error handling". State which failure classes you forced.

## Verify

Repeat each forced failure after changes: the UI shows a clear message, offers recovery, recovers when the failure ends, and nothing logs uncaught errors. Confirm the happy path still works.

## Escalate

Payment or auth flows whose failure states you cannot test safely; data-loss risks (unsaved work on error); offline-first expectations (a product decision).

## No change is valid when

Views already handle the five states, or the site has no data-dependent UI. Do not add skeletons to a static page.
