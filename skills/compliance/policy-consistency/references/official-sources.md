# Official sources: where to look when legal or standards specifics matter

ReadyVibe skills do not carry a legal database and must not answer legal questions from memory. Laws, regulator guidance, and standards change, differ by market, and are easy to misremember. When a specific requirement matters, **look it up at the official source while you are running, cite what you read, and say what you could not confirm.**

## How to use this

1. **Decide the question first.** "Is analytics consent required for visitors in market X?" is a legal question. "Does an analytics request fire before any consent choice?" is a technical fact. Verify the fact yourself; look up the rule.
2. **Go to the official source, not a summary.** The hubs below are starting points. Search within them for the current text or guidance. Blog posts, vendor pages, and AI summaries are leads, not sources.
3. **Record what you read**: source name and URL, the provision or page title, the date you accessed it, and the relevant text in your own words. Keep quotes short.
4. **Say what remains uncertain.** Interpretation, applicability to this business, and enforcement practice are for a qualified professional. Mark those REVIEW REQUIRED.
5. **If you cannot browse**, or the source is unclear, or the market is unknown: the answer is **UNKNOWN / REVIEW REQUIRED**. Do not fill the gap from memory, and do not turn the gap into a pass or a failure.
6. **Never write "compliant".** Reports may say "requirement identified from <source, date>", "behavior verified", "behavior inconsistent with the notice", or "legal review recommended".

## Starting points (hub sites, not answers)

| Area | Official or standards-body hubs |
|---|---|
| EU law text | EUR-Lex (`eur-lex.europa.eu`): GDPR (Regulation (EU) 2016/679), ePrivacy Directive (2002/58/EC), European Accessibility Act (Directive (EU) 2019/882), consumer directives |
| EU regulators and guidance | European Data Protection Board (`edpb.europa.eu`) and the national data protection authorities it lists; Your Europe (`europa.eu/youreurope`) for consumer rights |
| UK | Information Commissioner's Office (`ico.org.uk`) for UK GDPR, PECR, children's code; `legislation.gov.uk` for statute text; Competition and Markets Authority on `gov.uk` |
| US federal | Federal Trade Commission (`ftc.gov`): CAN-SPAM, COPPA, consumer protection, endorsements and reviews; `ecfr.gov` for federal regulation text; `ada.gov` and `section508.gov` |
| US states | California Privacy Protection Agency (`cppa.ca.gov`) and California Attorney General (`oag.ca.gov/privacy`); other states' attorney general sites |
| Canada | Office of the Privacy Commissioner (`priv.gc.ca`); CRTC (`crtc.gc.ca`) for anti-spam |
| Accessibility standards | W3C WCAG 2.2 (`w3.org/TR/WCAG22/`), W3C Web Accessibility Initiative (`w3.org/WAI/`) |
| Payments and security | PCI Security Standards Council (`pcisecuritystandards.org`), OWASP (`owasp.org`), NIST (`nist.gov`) |
| Search and web platform | Google Search Central (`developers.google.com/search`), Bing Webmaster (`bing.com/webmasters`), sitemaps protocol (`sitemaps.org`), RFC 9309 robots exclusion (`rfc-editor.org`), MDN (`developer.mozilla.org`), web.dev, Open Graph (`ogp.me`), schema.org, W3C CSP (`w3.org/TR/CSP3/`) |

If a market is not listed, find its national regulator and legislation portal, and confirm you are on the official domain before relying on it.

## What to put in a report

```
Requirement: <what the source says, in your words>
Source:      <name>, <URL>, accessed <date>
Applies?:    UNKNOWN / REVIEW REQUIRED (depends on <market, audience, data>)
Behavior:    <what you observed, how>
Next:        <fix if a technical fact is clearly wrong; otherwise "legal review recommended">
```
