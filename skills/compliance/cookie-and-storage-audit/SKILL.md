---
name: cookie-and-storage-audit
description: "Use when you need to know what a site actually stores in the browser and which third parties it contacts, and whether the cookie or tracker disclosure matches: cookies, localStorage, sessionStorage, IndexedDB, third-party requests, at load and after interactions. It separates observed runtime behavior from source suspicion. Do not use it to add a cookie banner, to write the privacy policy, or to decide that consent is legally required."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "3,4,5"
  compliance-domains: "3"
  helpers: "observe-runtime"
  references: "official-sources,companion-methods"
---

# cookie-and-storage-audit

"Cookie banner exists" and "cookie behavior is correct" are different claims. This skill produces the **inventory and the timeline** that every consent, analytics, and disclosure judgment depends on.

## Activate when

- Any cookie, storage key, tracker, embed, or third-party script is present in source, or the user asks what the site stores/loads.
- Before adding, changing, or removing a consent control (`consent-management`), or writing a cookie/privacy disclosure (`privacy-policy`, `policy-consistency`).
- Not to decide whether consent is required (that needs a rule looked up at an official source; see `jurisdiction-applicability`).

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `analytics-privacy`, `consent-management`, `jurisdiction-applicability`, `policy-consistency`, `privacy-policy`, `privacy-readiness`.

## Inspect

**1. Source inventory** (SOURCE-INDICATED). Search for tag managers, analytics/ads/replay snippets, vendor SDK imports, `document.cookie`, `localStorage`/`sessionStorage`/`indexedDB` writes, `Set-Cookie` in server code and middleware, auth libraries (session cookies), i18n/theme persistence, consent libraries. Also look for **fingerprinting-like behavior**: canvas/WebGL/AudioContext readouts, font or plugin enumeration, `navigator.getBattery`, screen/hardware probes bundled into an ID, FingerprintJS/ClientJS-style libraries, and device IDs persisted across sessions. Storage-free identification is still identification; disclose and review it as such (`analytics-privacy`). List each item with file and apparent purpose.

**2. Runtime timeline** (OBSERVED). Run the runtime helper in a fresh browser context (no prior storage). Paths relative to this skill's folder:

```bash
node scripts/observe-runtime.mjs --url <site> --settle 2000
```

The first snapshot, `initial`, is the state **before any interaction**. It lists cookies (name, domain, first/third-party, lifetime, flags), web-storage keys, and every request group by vendor class (analytics, advertising, session replay, tag manager, fonts, maps, video embeds, captcha, payments...), plus any consent-like UI it detected and the button labels to use next.

Build a timeline with a steps file. Use the labels the helper printed:

```json
[
  {"do":"click","text":"Reject"},
  {"do":"snapshot","label":"after-reject","expect":"no-new-nonessential"},
  {"do":"reload"},
  {"do":"snapshot","label":"after-reject-reload","expect":"no-new-nonessential"}
]
```

Repeat in a fresh run for **accept** (`"expect":"some-tracking"`), and for **withdraw** (accept, then use the site's preferences/withdraw control, snapshot, reload, snapshot). Each run starts from a clean context, so one choice does not contaminate another.

Add `--block-third-party` to observe what the page *attempts* without sending real traffic to vendors. Omit it (on a staging origin) when follow-on behavior matters, such as a tag manager that loads more tags.

**3. Classify each item** into: strictly necessary for a service the visitor asked for (e.g. auth session, cart, CSRF, the consent record itself); functional preference; measurement/analytics; advertising/tracking; third-party embed; unknown. **Unknown is not essential.** Do not classify from the name alone; use source, vendor docs, and behavior. Do not treat "essential" as legal classification; it is your working label.

**4. Compare with disclosure.** Read the cookie notice/privacy page. List what it names against what you observed; flag both directions (undisclosed item; disclosed item that never appears).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Vendor in source but no request observed: SOURCE-INDICATED. Say "integration present; runtime loading not observed on the pages exercised."
- Request observed at load: OBSERVED, and it is a fact about timing. Whether consent was required is a separate question needing a rule looked up at an official source: REVIEW REQUIRED.
- Absence is only proven for what you exercised: which pages, which viewport, which states, how long you waited. State the coverage.
- Tag managers hide downstream tags. If GTM/Segment is present, the inventory is incomplete until runtime shows what it fires, and that may depend on the container's configuration you cannot see.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

Nothing by default. This is an audit. Findings feed `consent-management` (implementation) and `privacy-policy`/`policy-consistency` (disclosure). If asked to fix a disclosure, correct it only to state observed facts.

## Must not claim

"No cookies", "cookie-free", "GDPR/ePrivacy compliant", "consent not required", or "all cookies are essential" from a single pass. Do not assert purposes you have not verified. Do not call a cookie banner unnecessary unless the timeline shows no non-essential storage or trackers on the exercised paths *and* you state the limits.

## Verify

The audit is verified when the timeline is reproducible: same steps, same result, on a second run. If results differ between runs (A/B tests, geo-based banners, lazy vendors), say so. Record the inventory in the reply (or `.readyvibe/storage-inventory.md`): item, type, first/third party, when it appears, purpose (with evidence), disclosed? (yes/no/unknown).

## Escalate

- Non-essential tracking observed before interaction: OBSERVED fact, applicability REVIEW REQUIRED; hand to `consent-management` and `jurisdiction-applicability`.
- Personal data in cookies/URLs/storage (email, IDs): flag to `analytics-privacy` / `privacy-readiness`.
- Cookies you cannot identify: UNKNOWN, ask the owner or find vendor documentation; do not guess.

## No change is valid when

The timeline shows no cookies, storage, or third-party requests beyond first-party essentials on the exercised paths, and the disclosure does not claim otherwise. Report "no non-essential storage or trackers observed on X, Y, Z; recheck if analytics, ads, embeds, or accounts are added", and do not add a banner.
