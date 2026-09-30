---
name: minors-readiness
description: "Use when a site or app may be used by children or teenagers, collects age or date of birth, or states an audience rule such as 18+. It checks who the product is evidently for, whether age is collected or implied, and whether behavior contradicts the stated audience. Do not use it to bolt on a decorative age gate, to bypass an age restriction, or to decide which child-protection law applies."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "6"
  compliance-domains: "5"
  references: "official-sources"
  companions: "analytics-privacy,third-party-privacy,design-system-reconnaissance"
---

# minors-readiness

A sentence saying "for users 18+" and a checkbox do not create an adult-only product. This skill compares the **stated audience** with the **evident audience** and with what the product actually does with age.

## Activate when

- The product could appeal to children (games, education, toys, social, creator tools, family apps, characters/cartoon style, school context).
- A date-of-birth, age, grade, or parent field exists; terms or copy state an age rule; accounts or content are public between users.
- Not for a clearly adult B2B tool with no child signals: record the evidence and stop.

## Working alone

This skill is self-contained. Its **companions** (declared in its metadata) are skills whose method it may need to do its own promised work. Use of a companion can be conditional: declaring one does not mean running it. When a companion's lane applies, use the skill if it is installed; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip an applicable lane silently. Skills mentioned here only for escalation, referral, documentation, or optional deeper follow-up are not dependencies: report the hand-off and finish honestly.

Companions: `analytics-privacy`, `third-party-privacy`, `design-system-reconnaissance`.

## Inspect

1. **Stated audience:** terms, privacy notice, footers, app store text, marketing ("for kids", "ages 6-12", "18+ only").
2. **Evident audience signals:** content and imagery style, gamification aimed at children, school/parent language, product category, influencers/characters, community features, sample data.
3. **Age collection and use:** DOB/age fields (required? validated? stored?); what happens on a "too young" answer (blocked? data kept? can the user simply retry with another date?); whether age drives behavior (feature limits, ads, content), whether the field is stored longer than needed.
4. **Contradictions:** an "18+" statement with a birth-year dropdown starting at 2015; a children's product with no age handling; analytics/advertising/replay running on pages plausibly used by minors; open chat, public profiles, or user-content sharing with unknown-age users; account creation allowing anonymous minors to share personal data.
5. **Parental handling** where the product is child-directed or collects from children: is there any parent/guardian flow? Does it exist in code or only in copy?
6. **Third parties on child-plausible pages:** advertising pixels, embedded social, replay (`analytics-privacy`, `third-party-privacy`).

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- Stated audience is DECLARED. Evident audience is INFERRED (list the signals). A gap between them is a finding, not a verdict about the law.
- Whether the product is "directed to children" in a legal sense is REVIEW REQUIRED. Do not conclude it yourself.
- An age field that is collected but unenforced is SOURCE-INDICATED; prove the bypass by trying it on a test flow.
- **Legal specifics: never from memory.** When a rule, deadline, threshold, or required wording matters, read the current text or guidance at an official source while you run (start from [references/official-sources.md](references/official-sources.md)), cite the source and access date, and treat applicability to this business as REVIEW REQUIRED. If you cannot look it up, the answer is UNKNOWN.

## May change

**Design first.** Before creating or changing anything visible, inspect the project's existing design system (`design-system-reconnaissance`) and build from its tokens and components. Never impose a ReadyVibe look on the user's site.

- Make an existing age check actually enforce (server-side validation, not only UI; no auto-retry loophole) **when the owner has stated the rule**.
- Stop collecting age/DOB that nothing uses; remove age data from analytics.
- Align copy with the owner's actual audience statement.
- Never invent an age threshold, add a "Are you 18?" click-through as if it were verification, or add parental-consent flows you cannot back with real process.

## Must not claim

"COPPA/GDPR-K compliant", "child-safe", "age-verified", "suitable for children", or that an age gate is verification. Do not state age thresholds by jurisdiction from memory.

## Verify

Exercise the age flow: under-age answer, edge-age answer, retry with a different date, back button. Confirm server-side enforcement and that under-age data is not silently retained. Re-check that trackers do not run on child-plausible pages if the owner decides they should not.

## Escalate

Any child-directed or mixed-audience signal: REVIEW REQUIRED, and `regulated-domain-triggers`. Collection of data from minors, public social features, advertising to minors, or sensitive categories: recommend legal review before launch, and stop ordinary work on that surface until the owner decides the audience.

## No change is valid when

The evident audience is clearly adult/professional, no age or child signals exist, and copy is consistent. Say so with the signals you checked, and the recheck trigger (a game mode, a school offering).
