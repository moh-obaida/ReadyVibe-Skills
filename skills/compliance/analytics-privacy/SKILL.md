---
name: analytics-privacy
description: "Use when a site includes analytics, advertising pixels, session replay, heatmaps, or a tag manager and you need to know what they collect, when they fire, and whether the disclosure and any consent gating match. It inventories vendors and personal-data exposure and verifies timing at runtime. Do not use it to install analytics, to certify a vendor as compliant, or to state that analytics needs or does not need consent without looking up the rule at an official source."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "5"
  compliance-domains: "3,9"
  helpers: "observe-runtime"
  references: "official-sources,companion-methods"
---

# analytics-privacy

"Analytics package exists" is not "analytics behavior is understood and appropriately disclosed or gated". This skill establishes what each measurement tool **does**.

## Activate when

- An analytics, ad, replay, heatmap, A/B, or tag-manager tool appears in source or network traffic.
- Someone asks whether tracking is disclosed or gated, or is about to add a new tool.
- Not to choose or install an analytics product. Not to rule on legal necessity.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `consent-management`, `regulated-domain-triggers`.

## Inspect

1. **Inventory (SOURCE-INDICATED).** Snippets, SDK imports, framework integrations (Vercel Analytics, `next/script` with GTM), env vars naming property IDs, server-side event senders. For each: vendor, purpose (as documented), configuration (autocapture? session replay? IP handling? identify calls with user data? cross-site sharing? Google Signals/advertising features?).
1b. **Telemetry and hidden measurement.** Framework and platform telemetry that reaches vendors from the visitor's browser (web-vitals reporters, Vercel/Cloudflare analytics, Sentry performance/replay, feature-flag SDKs that phone home, error trackers capturing user context), plus fingerprinting-like signals (canvas/font/hardware probing, device-ID libraries). Treat each as a measurement tool: what does it send, when, and is it disclosed? IP address and user agent reach the vendor on every request.
2. **Runtime (OBSERVED).** `node scripts/observe-runtime.mjs --url <site> --settle 2000` (paths relative to this skill's folder). Read: vendors contacted at `initial` (before interaction), cookies with tracking-style names, and later snapshots after actions. Repeat on the key pages, not only the home page. Use `--block-third-party` to observe attempts safely; use a staging origin without it when the tag manager's downstream tags matter.
3. **What they receive.** Look for personal data leaking to analytics: emails or names in URLs or query strings, user IDs sent via `identify`, form field contents captured by autocapture/replay, sensitive page content captured by replay (password fields, payment fields, health/finance data). With a local/staging form: run a submit step with `--canary` (planted fake identity) and check `CANARY_SENT_TO_THIRD_PARTY` and `CANARY_IN_URL`.
4. **Timing and gating.** What fires before any choice? After reject? After accept? (`consent-management` owns the control; you own the *measurement facts*.)
5. **Disclosure.** Compare with the privacy/cookie notice: is each observed vendor named, with purpose? Is anything claimed that does not occur ("we don't use analytics" while a pixel loads)?

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Source says GA is configured: SOURCE-INDICATED. Network request seen at load: OBSERVED. Say which one you have.
- The correct phrasing when only source exists: "Analytics integration is present; pre-consent gating has not been proven." Never "analytics loads before consent" without an observed request before a choice.
- Vendor documentation (cookieless mode, IP anonymization) is DECLARED; it lowers concern only when configuration and traffic corroborate it.
- Cookieless does not mean disclosure-free or rule-free: report the facts; applicability is REVIEW REQUIRED.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

- Correct **disclosure text** so it states the observed facts (vendor names, categories, purpose you verified), when the owner has confirmed intent. Leave retention periods and legal bases as marked gaps.
- Remove or minimize personal data sent to analytics (strip emails from URLs, stop `identify` with PII, mask replay inputs) when clearly unintended.
- Gate initialization behind the existing consent state (coordinate with `consent-management`) when gating is applicable or required by the owner.
- Never add a new tracking tool, change analytics IDs, or alter business measurement without the owner's ask.

## Must not claim

"Privacy-friendly", "anonymous", "compliant", "cookieless so no consent needed", or "no personal data is collected" unless you verified configuration and traffic, and even then only scoped to what you observed. IP addresses and device identifiers reach every contacted vendor; do not say otherwise.

## Verify

Re-run the runtime timeline (load, reject, accept, reload). Confirm: vendor requests match the intended gating; no planted identity in analytics requests; replay masks sensitive inputs (observe the request payloads or the vendor's masking config in code); disclosure names the same vendors you observed.

## Escalate

- Personal or sensitive data observed reaching an analytics/advertising vendor: HIGH, REVIEW REQUIRED; stop the leak if the fix is clear, and tell the owner.
- Session replay or ad pixels on pages with health, finance, children's, or account data: `regulated-domain-triggers`.
- Advertising/remarketing pixels: consent and disclosure rules are strict in many markets; REVIEW REQUIRED.

## No change is valid when

No analytics or trackers are present or observed ("no analytics found in source or runtime on the pages exercised; recheck if added"), or they are gated and disclosed correctly and verified. Do not add analytics to make a report "complete".
