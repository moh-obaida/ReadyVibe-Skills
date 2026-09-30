# Launch report format

Short, honest, actionable. Lead with the answer. Do not dump every check.

```
LAUNCH READINESS: <one-line verdict in plain words, scoped>
  e.g. "Not ready: 2 blockers. Everything else verified in the areas listed is fine."

READY            what was verified and is fine (group by area, one line each)
FIXED            what ReadyVibe changed (file + one line each)
BLOCKERS         material launch blockers, most severe first
REVIEW REQUIRED  facts or judgments only a human can supply (legal, security, business)
UNVERIFIED       what could not be proven here, and what would prove it
NEXT ACTION      the single highest-value next step
```

## Finding shape

```
HIGH  Analytics disclosure mismatch
  Observed:     analytics requests occur before any consent interaction (home, /pricing).
  Declared:     privacy page says analytics loads only after consent.
  Action:       initialize the tag only after the consent state allows it.
  Verification: reject/accept/withdraw re-run; no analytics requests after reject.  [status: fixed / open]
```

Use only the lines that carry information. A LOW finding is often one line.

## Severity

| Severity | Meaning | Examples |
|---|---|---|
| HIGH | Blocks launch, or causes real harm or exposure | exposed credential; private/admin route discoverable; privacy behavior contradicting disclosure; broken payment or auth flow; account deletion that does not do what it claims; marketing unsubscribe that does nothing; production canonical pointing at localhost; launch-blocking form failure; sitewide `noindex` on a site meant to be found |
| MEDIUM | Materially hurts trust, discoverability, or usability; fix soon | starter title on the home page; private route in sitemap without exposure; no reject option where one is implemented; mobile horizontal overflow on key pages; missing form labels |
| LOW | Polish, low risk | missing favicon; weak social preview; minor metadata quality; small accessibility issue |

Do not make everything critical. Severity is about consequence to a visitor or the owner, not about how easy the fix is. Raising severity requires evidence (observed contradiction, confirmed exposure); an unproven suspicion stays at most MEDIUM and is labeled.

## Language rules

- Say what was observed and how. Say what is unknown. Never convert unknown into pass or fail.
- Use "requirement detected", "implementation appears inconsistent", "behavior verified", "disclosure mismatch", "provisional rule", "review required", "legal review recommended".
- Never use "compliant", "fully compliant", "legally compliant", "GDPR ✅", "guaranteed", "secure", or "accessible" as unqualified results.
- Not-applicable items get one line with the reason and the recheck trigger, or are omitted if the user did not ask.

## Example

```
LAUNCH READINESS: Not ready. 2 blockers; 5 items fixed.

READY
  Legal navigation resolves (privacy, terms, contact). Custom 404 returns 404 in the site's design.
  No secrets or source maps in the build.

FIXED
  index.html: canonical pointed at localhost:5173, now https://ledgerly.app/
  sitemap.xml: removed /dashboard and /admin/users (private, one noindex)
  public/favicon.svg added and linked; 3 form fields labeled; hero image alt derived from visible copy

BLOCKERS
  HIGH  Analytics fires before any consent interaction and Reject does not stop it (observed, 2 pages).
        The privacy page says analytics only runs after consent. Fix the gate, then re-run reject/accept.
  HIGH  "Unsubscribe" in the newsletter footer links to "#" (observed). Future marketing cannot be suppressed.

REVIEW REQUIRED
  Whether consent is required for your audience and markets (no reviewed rule context; markets unstated).
  Privacy notice needs your legal entity name, contact address, and retention periods. Left as marked gaps.

UNVERIFIED
  Checkout and password reset were not exercised (need test credentials on a staging build).
  Production headers and CSP (only a local build was available).

NEXT ACTION
  Gate the analytics tag on consent, then re-run the reject/accept/withdraw check.
```
