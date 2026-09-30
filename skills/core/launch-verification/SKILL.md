---
name: launch-verification
description: "Use when a fix or a finding needs proof: re-checking behavior after a change, confirming a blocker is really gone, or turning collected evidence into a scoped launch verdict. It re-runs the original evidence, records what changed, and separates verified, unverified, and review-required items. Do not use it to declare a site legally compliant, or as a substitute for the specialist that found the problem."
license: Apache-2.0
metadata:
  kind: auditor
  helpers: "inspect-metadata,check-links,audit-markup,scan-secrets,observe-runtime,audit-assets"
---

# launch-verification

"I edited the file" is not verification. Verification means: **the same evidence that exposed the problem now shows it gone, and nothing adjacent broke.**

## Activate when

- A specialist (or you) changed something and it needs proving.
- `launch-all` reaches its verify step.
- The user asks "did that actually fix it?" or "is this ready now?"
- Not as a first pass; find problems with the owning specialist first.

## Inspect

For each finding or fix, identify:

1. **The original evidence**: which helper, command, page, viewport, and state exposed it (e.g. `observe-runtime` after a Reject click at 375px).
2. **The claim being verified**: one sentence ("Reject stops analytics requests, including after reload").
3. **The smallest reliable re-check** that could disprove the claim.

Re-run it in the same conditions (same viewport, same starting state, same origin). Then run one adjacent check for regressions in what the change touches:

| Changed | Re-check | Adjacent |
|---|---|---|
| canonical / sitemap / robots | `inspect-metadata` | `check-links` (targets still resolve) |
| links, routes, 404 | `check-links` | unknown URL returns 404 status |
| consent gating / analytics | `observe-runtime` reject → accept → reload | privacy disclosure still matches |
| forms | `observe-runtime` with `--canary` and a submit step (local/staging only) | error path and required-field path |
| labels, alt, semantics | `audit-markup` | keyboard `tab` pass |
| layout | `observe-runtime --viewport 375x812` | 768px and desktop |
| secrets/env | `scan-secrets` | build output rebuilt, not the old `dist/` |
| assets/performance | `audit-assets` | page still renders correctly |

Helpers live in this skill's `scripts/` folder. If a needed helper cannot run (no server, no Playwright) or reports `SITE_NOT_READ`, the item is UNVERIFIED, not passed.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- **Verified** requires an OBSERVED re-check after the change.
- Reading the diff and finding it plausible is INFERRED. It does not close a HIGH finding.
- Rebuild before re-checking build-output findings (stale `dist/` proves nothing).
- A re-check that cannot distinguish "fixed" from "not exercised" is inconclusive. Make the check able to fail (e.g. confirm the tracker *does* fire after Accept, so its silence after Reject means something).

## May change

Nothing in the product. It may write `.readyvibe/verification.md` (a brief log: claim, evidence command, before/after, status). If a re-check fails, hand back to the owning specialist with the observed difference.

## Must not claim

That a site is "launch-ready", "compliant", "secure", or "accessible" as unqualified statements. A launch state is a **scoped** verdict:

- **NOT READY**: at least one HIGH finding is open.
- **READY WITH CAVEATS**: no open HIGH; listed MEDIUM/UNVERIFIED/REVIEW REQUIRED items remain.
- **NO BLOCKERS FOUND**: no open HIGH in the areas verified. The verified areas are named, and the unverified are named.

Never the bare word "ready".

## Verify

Self-check before reporting: every HIGH has a status of *verified fixed*, *still open*, *unverified (why)*, or *review required (who)*. No finding disappears from the report without a stated reason.

## Escalate

A fix that changes behavior the owner may not have intended (removing a tracker, deleting data, changing copy about legal terms); a re-check that shows a *new* problem in a HIGH area; facts that need the owner ("is `/status` meant to be public?").

## No change is valid when

The original evidence already shows the issue absent, the finding was a false positive explained by context, or the area does not apply. Record it with the reason instead of "fixing" it.
