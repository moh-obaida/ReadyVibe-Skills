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
| **United Arab Emirates** | UAE government portal (`u.ae`) for federal digital and data-protection information; UAE legislation portal (`uaelegislation.gov.ae`) for federal law text; Ministry of Economy (`moec.gov.ae`) for consumer protection and e-commerce; Telecommunications and Digital Government Regulatory Authority (`tdra.gov.ae`) for telecom and online-content rules. **Free zones have their own regimes**: DIFC Commissioner of Data Protection (`dp.difc.ae`) and ADGM Office of Data Protection (`adgm.com`). Emirate-level and sector regulators (health, finance, media) may also apply. Federal, free-zone, and emirate rules can differ; establish which entity and location the business is under before reading any of them. |
| Saudi Arabia and the wider Gulf | Saudi Data and AI Authority (`sdaia.gov.sa`) for personal data protection; the Saudi laws portal (`laws.boe.gov.sa`); other Gulf states' regulators and legislation portals through their national government sites |
| Australia and New Zealand | Office of the Australian Information Commissioner (`oaic.gov.au`), ACCC (`accc.gov.au`), `legislation.gov.au`; NZ Office of the Privacy Commissioner (`privacy.org.nz`) |
| Asia | Singapore PDPC (`pdpc.gov.sg`); India MeitY (`meity.gov.in`) and India Code (`indiacode.nic.in`); Japan Personal Information Protection Commission (`ppc.go.jp`); Korea Personal Information Protection Commission (`pipc.go.kr`) |
| Latin America | Brazil's data protection authority ANPD (`gov.br/anpd`); other countries through their national data protection authority and legislation portal |
| Europe beyond the EU | Swiss Federal Data Protection and Information Commissioner (`edoeb.admin.ch`); Turkey's KVKK (`kvkk.gov.tr`) |
| Africa | South Africa's Information Regulator (`inforegulator.org.za`); other countries through their national regulator and legislation portal |
| Accessibility standards | W3C WCAG 2.2 (`w3.org/TR/WCAG22/`), W3C Web Accessibility Initiative (`w3.org/WAI/`) |
| Payments and security | PCI Security Standards Council (`pcisecuritystandards.org`), OWASP (`owasp.org`), NIST (`nist.gov`) |
| Search and web platform | Google Search Central (`developers.google.com/search`), Bing Webmaster (`bing.com/webmasters`), sitemaps protocol (`sitemaps.org`), RFC 9309 robots exclusion (`rfc-editor.org`), MDN (`developer.mozilla.org`), web.dev, Open Graph (`ogp.me`), schema.org, W3C CSP (`w3.org/TR/CSP3/`) |

If a market is not listed, find its national regulator and legislation portal (a government `.gov`-style domain, or the regulator's own site), and confirm you are on the official domain before relying on it. Prefer the primary text or the regulator's own guidance over law-firm summaries. This list is a set of doors, not a map of the law; it is extended as skills are used in more markets.

## What to put in a report

```
Requirement: <what the source says, in your words>
Source:      <name>, <URL>, accessed <date>
Applies?:    UNKNOWN / REVIEW REQUIRED (depends on <market, audience, data>)
Behavior:    <what you observed, how>
Next:        <fix if a technical fact is clearly wrong; otherwise "legal review recommended">
```
