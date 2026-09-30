---
name: compliance-diff
description: "Use when reviewing a pull request, branch, or release for launch and privacy impact: new vendors or third-party hosts, new personal-data fields or forms, new routes, changed consent or email behavior, new storage. It reads the change and lists what it introduces and which ReadyVibe specialists should recheck. Do not use it as a substitute for a full review or to approve a release as compliant."
license: Apache-2.0
metadata:
  kind: auditor
---

# compliance-diff

Launch readiness decays. A month after a clean review, someone adds a session-replay tool, a signup field, or a `/admin` route. This skill reads a *change* and says what it re-opens.

## Activate when

- A PR, branch, or release diff is under review, or the user asks "what does this change do to our launch/privacy posture?"
- A context note (`.readyvibe/context.md`), if one exists, has "NOT APPLICABLE" items whose recheck triggers might have fired.
- Not for a first full review (use `launch-all`).

## Inspect

Get the diff (`git diff <base>...HEAD`, or the PR files). Look for these introductions, in order of consequence:

| In the diff | Re-opens |
|---|---|
| new dependency or script tag for analytics, ads, replay, tag manager, chat, maps, fonts, embeds, captcha, payments | checks 3–5 (`analytics-privacy`, `third-party-privacy`, `cookie-and-storage-audit`) and the privacy disclosure |
| new form field, DB column, or API route accepting personal data (email, name, phone, location, DOB, IDs) | 1, 5, 6, 7 (`data-flow-mapping`, `privacy-policy`, `data-rights`) |
| new auth, account, role, or admin route | 7, 38 (`data-rights`, `web-security`, `admin-authorization`) |
| new email send, newsletter form, template, or list | 36–37 (`email-compliance`) |
| price, checkout, subscription, refund copy, billing code | `consumer-protection-readiness`, `subscription-readiness`, `payments-readiness` |
| new locale, currency, country selector, or shipping region | `jurisdiction-applicability`, `multilingual-readiness` |
| new public route, changed canonical/robots/sitemap, changed metadata | 9–18 (`seo-readiness`) |
| removed or changed legal/contact/footer links or pages | `legal-navigation`, `public-support` |
| changed consent code, cookie names, storage keys | `consent-management`, `cookie-and-storage-audit` |
| AI/model calls, prompts with user data | `ai-features-readiness` |
| user-generated content features | `user-content-safety` |
| age/DOB fields or child-oriented copy or features | `minors-readiness`, `regulated-domain-triggers` |
| new environment variable with a client prefix | `web-security` |
| removed features (data no longer collected) | disclosure may now overstate; `policy-consistency` |

Also look for *deletions* that reduce protection: removed consent gating, removed unsubscribe route, dropped auth check.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A diff shows SOURCE-INDICATED behavior. "This adds PostHog" is fact; "PostHog loads before consent" is unproven until the change is run.
- If you can run the branch, do a targeted `observe-runtime` pass on the affected routes rather than guessing.

## May change

Nothing in the product. Produce a short review note (in the reply, or `.readyvibe/diff-review.md` if asked).

```
Changes with launch/privacy impact
  1. New third party: posthog-js (analytics + replay-capable). Runtime timing unproven.  -> analytics-privacy, cookie-and-storage-audit; privacy notice does not mention it.
  2. New field: phone on /signup. Stored in profiles.phone.  -> data-flow-mapping, privacy-policy, data-rights (deletion covers it?)
No impact found in: routes, metadata, email, payments.
```

## Must not claim

That the change is "approved", "compliant", or "safe to ship". Say what it introduces, what is unverified, and what to recheck.

## Verify

Confirm each listed introduction by locating the code (file and line), and confirm each "no impact" claim by searching for the corresponding patterns. For anything you can run, run it.

## Escalate

Regulated-domain or child-directed features appearing in a diff; exposure of credentials in the diff (report at once and do not copy the value); changes that silently contradict the published privacy notice or terms.

## No change is valid when

The diff is refactoring, styling, or copy that touches none of the surfaces above. Say "no launch or privacy impact found" and name the patterns you searched.
