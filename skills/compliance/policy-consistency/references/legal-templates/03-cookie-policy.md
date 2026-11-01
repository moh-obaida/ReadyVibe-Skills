# ReadyVibe Skills v1.1 — Cookie and Similar Technologies Policy Template

**Status:** Original drafting template. **Include only when justified by actual browser/server technologies and relevant notice obligations.**

## What really needs customization

A cookie policy must come from observation and service/provider evidence, not a generic cookie-category list. Cookies are only part of the picture: also examine localStorage, sessionStorage, IndexedDB, SDK identifiers, tracking pixels, embedded media, server-set cookies and other device-access technologies. A website may use essential cookies without needing a blanket cookie banner. Some jurisdictions require specific notices/consent for technologies other than cookies.

| Item | Default handling | Evidence |
|---|---|---|
| Public website name and URL | **AUTO** | Verified production host and site identity |
| First-party/third-party cookie names and hosts | **AUTO → VERIFY** | Real browser sessions, response headers, auth states, integrations |
| Local storage, pixels and other trackers | **AUTO → VERIFY** | Browser runtime and vendor documentation |
| Function, provider and duration | **AUTO → VERIFY** | Setters, HTTP headers, expiry attributes and provider docs; dynamic durations noted accurately |
| Essential vs optional classification | **INFER → OWNER/LEGAL CONFIRM** | Technical necessity, purpose and jurisdiction; "analytics" is not inherently exempt |
| Non-essential consent requirement | **LEGAL/APPLICABILITY CHECK** | Audience/jurisdiction, actual tracking behavior, current official rules |
| Cookie preferences/consent banner URL | **CONDITIONAL / AUTO** | Actual working UI, persisted consent and script gating |
| Advertising or cross-site tracking | **CONDITIONAL** | Actual vendors and behavior, not template examples |
| Contact and business identity | **OWNER CONFIRM** | Verified operator and effective contact method |
| Last-updated date and update process | **OWNER CONFIRM** | Real publication date and notification behavior |

### Inspection requirements

- Visit representative routes signed out and signed in (where safe); inspect cookies and storage at initial load, after interaction, after acceptance, after refusal and after withdrawal.
- Trace third-party requests and server-set cookies. Distinguish a loaded script from a script actually setting storage; conversely absence of a cookie in one test is not proof of absence in all sessions.
- Measure values/durations without collecting user secrets. Never log session cookie values or tokens in audit artifacts.
- Confirm **Reject** and **Withdraw** stop non-essential activity when legally required; a banner visible in UI alone is not evidence.
- Do not invent a cookie manager or claim a preferences link exists if it does not.
- If the site has no relevant non-essential technologies and a separate policy is not needed, explain that in the audit and keep any accurate short storage disclosure in the Privacy Policy instead.

### Assembly markers

- `{{...}}`: Verified facts or explicit owner-confirmed details.
- `[[IF ...]]`: Include only when applicable and evidenced.
- `[[REVIEW REQUIRED: ...]]`: Private drafting blocker or review note; never ship it in the published policy.

---

# Cookie Policy

**Last updated:** {{VERIFIED_PUBLICATION_DATE}}

This Policy explains how **{{VERIFIED_LEGAL_OPERATOR_OR_CONFIRMED_PUBLIC_NAME}}** ("we", "us" and "our") uses cookies and similar technologies on **{{VERIFIED_WEBSITE_URL}}**.

## What cookies and similar technologies do

Cookies are small pieces of information that websites can store in a browser or send back and forth with the server. Related technologies, such as browser storage and embedded pixels, may also store information or observe how a website is used.

These technologies serve different functions. For example, some keep a session working, while others may measure visits or support optional embedded services. The technologies **we actually use** are listed below.

## Technologies used by this website

{{VERIFIED_TECHNOLOGY_INVENTORY_TABLE}}

*Populate only real entries using columns: Name/identifier | Cookie, storage, pixel or other type | Provider and domain | Purpose | Essential or optional | Expiry or persistence. If different providers set technologies only on certain routes or after specific actions, note that accurately. Do not invent fixed durations; use "session" or verified provider-controlled language where appropriate.*

[[IF ESSENTIAL_TECHNOLOGIES_EXIST]]
### Essential technologies

We use **{{ACTUAL_ESSENTIAL_IDENTIFIERS_AND_PURPOSES}}** for **{{VERIFIED_NECESSARY_FUNCTIONS}}**. Disabling them in your browser may affect the specific features that depend on them.
[[END IF]]

[[IF OPTIONAL_FUNCTIONALITY_OR_EMBEDDED_MEDIA_TECHNOLOGIES_EXIST]]
### Optional functionality and embeds

**{{VERIFIED_PROVIDERS}}** may use **{{VERIFIED_IDENTIFIERS}}** when you choose **{{ACTUAL_FEATURE_OR_EMBED}}**. **{{ACTUAL_TRIGGER_AND_CHOICES}}**.
[[END IF]]

[[IF ANALYTICS_TECHNOLOGIES_EXIST]]
### Analytics

We use **{{VERIFIED_ANALYTICS_PROVIDER_AND_TECHNOLOGY}}** to **{{VERIFIED_ANALYTICS_PURPOSE}}**. **{{VERIFIED_DATA_AND_CONTROL_SUMMARY}}**.

[[REVIEW REQUIRED: Confirm whether and how consent is required, whether measurement is cookie-based or cookieless, and what data the analytics provider actually receives.]]
[[END IF]]

[[IF ADVERTISING_OR_MARKETING_TRACKERS_EXIST]]
### Advertising and marketing

We use **{{VERIFIED_ADVERTISING_TECHNOLOGIES_AND_PROVIDERS}}** to **{{ACTUAL_PURPOSES}}**. These technologies **{{CONFIRMED_CROSS_SITE_AND_PROFILING_BEHAVIOR}}**.

[[REVIEW REQUIRED: Verify precise use and required advertising opt-out/consent mechanisms. Do not describe targeting if only aggregate measurement is used, or vice versa.]]
[[END IF]]

[[IF UNRESOLVED_TRACKERS_EXIST]]
[[REVIEW REQUIRED: Investigate unidentified technologies and processors. Do not publish "unclassified cookies" as a substitute for establishing their purpose and legal treatment.]]
[[END IF]]

## How you can manage these technologies

[[IF A_WORKING_CONSENT_OR_PREFERENCES_INTERFACE_EXISTS]]
You can adjust your choices using **{{EXACT_VERIFIED_PREFERENCES_LINK_OR_CONTROL_LABEL}}**. **{{WHAT_THE_CONTROL_ACTUALLY_ENABLES_AND_DISABLES}}**.

Where a technology is optional and your consent is required, it will be used in accordance with your choices. You can change those choices using the same control.

[[REVIEW REQUIRED: Test refuse, accept, withdrawal, repeat visit, storage persistence and network loading. Do not claim that withdrawing consent removes data already collected unless that removal is implemented or legally explained.]]
[[END IF]]

Most browsers also allow you to delete or block cookies in their settings. Doing this may affect features that depend on session or preference storage. Browser settings do not necessarily stop other tracking technologies or replace a site-specific privacy choice where one is required.

[[IF OPTIONAL_THIRD_PARTY_EMBEDS_REQUIRE_SEPARATE_CONTROLS]]
For **{{VERIFIED_EMBED_OR_PROVIDER}}**, you can also **{{REAL_PROVIDER_OR_WEBSITE_SPECIFIC_CONTROL}}**.
[[END IF]]

## Third-party providers

Some technologies described above are operated by third parties. Their practices may be explained in the following notices, which should be checked against the actual providers we use:

{{VERIFIED_PROVIDER_PRIVACY_LINKS}}

[[REVIEW REQUIRED: Do not cite provider policies that aren't relevant. A third-party policy link does not replace the operator's own accurate disclosure or required control.]]

## Updates to this Policy

We may update this Policy when our technologies or relevant requirements change. The date at the top identifies the published version. **{{CONFIRMED_ADDITIONAL_NOTICE_IF_APPLICABLE}}**.

## Questions

Contact **{{VERIFIED_PRIVACY_CONTACT}}** with questions about these technologies.

---

## Publication checks

1. Do not generate a separate Cookie Policy solely to satisfy a checklist; assess whether it is needed or materially useful.
2. Populate from real storage/network observations and server/vendor evidence, not dummy names.
3. Do not include categories that have no verified entries.
4. Never include Flash-cookie instructions, nonexistent consent managers, dead browser-help links or cookie duration guesses.
5. Make consent UI, script timing, Privacy Policy and cookie inventory match.
6. A privacy or consent obligation that remains uncertain is **REVIEW REQUIRED**; it is not solved by adding a banner or disclaimers.
