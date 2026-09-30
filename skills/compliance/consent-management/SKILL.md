---
name: consent-management
description: "Use when a site has analytics, advertising, session replay, or other optional trackers and a consent control exists or may be needed. It determines whether gating is applicable by looking up the current rule at an official source, then verifies the behavior of reject, accept, and withdraw, not the appearance of the banner. Do not use it to add a cookie banner to a site with nothing to gate, to decide legal applicability from memory, or to design a dark-pattern consent flow."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "4"
  compliance-domains: "3"
  helpers: "observe-runtime"
  references: "official-sources,companion-methods"
---

# consent-management

Do not default to "add a cookie banner". Ask, in order: **what loads, is a choice applicable, and does the choice actually change behavior?**

## Activate when

- `cookie-and-storage-audit` (or your own pass) found non-essential storage or trackers, or a consent control already exists.
- Someone asks for a banner, a preference center, or "fix consent".
- Not when the inventory shows no non-essential storage or trackers (say so and stop), or for deciding which laws apply (`jurisdiction-applicability`).

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `cookie-and-storage-audit`, `design-system-reconnaissance`, `jurisdiction-applicability`.

## Inspect

1. **Inventory and timing.** Use the inventory from `cookie-and-storage-audit`; if none exists, run `node scripts/observe-runtime.mjs --url <site>` and read the `initial` snapshot (paths relative to this skill's folder).
2. **Applicability.** Read `.readyvibe/context.md` if present. If a rule decides whether gating is needed, look up the current requirement at an official source while you run (`references/official-sources.md`), cite it with the access date, and treat whether it applies to this business as REVIEW REQUIRED. Record: markets (DECLARED/INFERRED/UNKNOWN), the source you read and what it says about these technologies. **If you could not consult a source, applicability stays UNKNOWN / REVIEW REQUIRED**; do not supply it from memory. You can still verify behavior.
3. **The control, if one exists.** Read the implementation: where the choice is stored, what reads it, which scripts are gated and how (conditional loading vs. only hiding UI), whether default state is "off" for optional technologies, whether reject is as easy as accept (same screen, similar prominence, no pre-ticked boxes), whether the choice can be revisited.
4. **Behavior, in a fresh browser context per path** (see `cookie-and-storage-audit` for step files):
   - **Before choice:** what fired at load? (`initial` snapshot)
   - **Reject:** click reject; `snapshot` with `"expect":"no-new-nonessential"`; `reload`; snapshot again. The choice must persist and stay effective.
   - **Accept:** click accept; `snapshot` with `"expect":"some-tracking"`. Accepting should actually enable the intended behavior. A broken Accept is also a defect.
   - **Withdraw/change:** after accept, use the preferences/withdraw control; snapshot; reload; snapshot. Subsequent behavior must stop and any cookies set for the withdrawn purpose should be removed or expire as disclosed.
   - Include the `CHOICE_NOT_HONORED`, `CHOICE_HAD_NO_EFFECT`, and `TRACKING_*` findings the helper prints.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- OBSERVED requires a runtime step you ran. A gate that exists in source is SOURCE-INDICATED; do not say it works.
- "Banner hides after click" proves UI, not behavior. Only requests, cookies, and storage prove behavior.
- The consent record itself (a cookie/key storing the choice) is normally not a tracker; confirm it stores only the choice.
- If runtime proof is unavailable (no Playwright, staging inaccessible), say "reject/accept/withdraw behavior not verified" and list it under UNVERIFIED.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Only when **requirements are sufficiently known** (an official source you read this run, or the owner's stated rule) or the defect is behavioral regardless of rule (Reject that does nothing; a choice that is forgotten on reload; optional scripts loaded unconditionally while a control claims to gate them):

- Move initialization of optional scripts behind the recorded choice (load-on-consent), not merely behind a hidden overlay.
- Fix persistence and reload behavior of an existing choice.
- Fix parity of reject vs accept in an existing control's markup/styles, in the project's design system (`design-system-reconnaissance`).
- Add a control **only if** gating is applicable or the owner requires it, using the project's components, with reject as prominent as accept, and a way to change the choice later.

Never invent categories or purposes you did not verify; never pre-tick optional categories.

## Must not claim

"Compliant", "consent is required/not required" (without a source-backed rule), "GDPR/ePrivacy/CCPA compliant", "we respect your choice" (copy) unless reject, reload, and withdraw were verified. Do not add banner copy asserting facts about purposes or retention you cannot support.

## Verify

Re-run the full timeline after any change, on desktop and 375px: load → reject → reload → accept → withdraw → reload. Expected: nothing optional before a choice (where gating applies); nothing optional after reject or withdraw; the intended technology after accept; the choice persists. A fix is verified only when the `CHOICE_NOT_HONORED` / `TRACKING_BEFORE_INTERACTION` findings clear or are explained.

## Escalate

- Applicability, lawful basis, consent wording, granularity, or age thresholds: REVIEW REQUIRED.
- Vendors you cannot gate (a tag manager whose container fires everything): the owner must change the container; report exactly what you observed.
- Server-side tracking (server events, CAPI) is not visible in the browser: UNKNOWN; say so.

## No change is valid when

No non-essential storage or trackers are observed and none are planned: "consent gating not currently applicable based on observed behavior; recheck if analytics, ads, or embeds are added." Adding a banner with nothing behind it is compliance theater and makes the site worse.
