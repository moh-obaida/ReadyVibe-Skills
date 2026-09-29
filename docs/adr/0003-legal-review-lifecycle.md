# ADR 0003 — Rule-Level Legal Review Lifecycle and Source Snapshots

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-09-28 |
| Decided by | Repository owner |
| Affects | §9.1, §9.4–§9.10, §32.4, §32.12, §38.1, §54.4, `rules/sources/`, `rules/reviewers.yaml`, `rules/packs/*/reviews/` |

## Context

A pack-level "stable" flag relies on documentation discipline. One reviewed pack can hide an unreviewed obligation added later, and a source can change after a review without anyone noticing. The architecture must enforce the distinction between reviewed and unreviewed legal rules mechanically.

## Decision

1. **Review state belongs to each obligation, and it is computed, never authored.** Tooling computes one of three states for every obligation:
   - `PROVISIONAL`: no qualifying review exists. Every obligation starts here.
   - `REVIEWED`: at least one qualifying review covers the obligation's **current version** and the **current source snapshot** of every provision it relies on, and every required specialist area is covered.
   - `REVIEW_REQUIRED`: a qualifying review existed, but the obligation version changed, or a relied-on provision's snapshot hash changed (a material source change), or a required specialist area is no longer covered.

   Pack review state is derived from its obligations: `REVIEWED` if all are reviewed, `PARTIALLY_REVIEWED` if some are, `PROVISIONAL` otherwise, and `REVIEW_REQUIRED` flagged if any obligation is in that state. Authors cannot write any of these states. Review **records** are what authors write.

2. **A qualifying review record** (`rules/packs/<pack>/reviews/<date>-<reviewer>.yaml`) must contain:
   - a reviewer reference (an id in `rules/reviewers.yaml`, which records the display name or handle, the professional reference the reviewer consents to publish, specialisms, and jurisdictions);
   - the review date;
   - the obligation ids **and** versions covered;
   - the source snapshot ids (with provision hashes) that the review was performed against;
   - the outcome (`APPROVED`, `APPROVED_WITH_NOTES`, `CHANGES_REQUESTED`, `NO_MATERIAL_CHANGE`);
   - optional notes.

   Multiple reviews per obligation are supported and all are listed. One qualifying review is sufficient in general.

3. **Specialist review is mandatory** for obligations tagged with a `specialistAreas` value. Initial areas: `CHILDREN`, `REGULATED_SECTOR:<sector>` (health, finance, gambling, education, and others), `CROSS_BORDER_TRANSFER`, `AUTOMATED_DECISIONS`, `SPECIAL_CATEGORY_DATA`, and `UNCERTAIN_CROSS_BORDER_APPLICABILITY`. A review qualifies for an area only if the reviewer's registry entry lists that specialism.

4. **Source snapshots store hashes, not text** (ADR 0001):

   - `rules/sources/<authority-id>/authority.yaml`: the instrument (identifier, kind, publisher, official URL, legal status).
   - `rules/sources/<authority-id>/snapshots/<retrievedAt>.yaml`: retrieval date, official version label (for example the consolidation date), the normalizer version, and per-provision records containing a `sha256` of the normalized provision text and the provision's commencement or status metadata.
   - Granularity is per provision where the source has stable anchors (article, section, paragraph). Otherwise it is per document, which is conservative because any change triggers review.
   - A scheduled **source-watch** job re-fetches official sources, recomputes hashes with the pinned normalizer, and adds a new snapshot whenever something changes. Because review state is computed against the latest snapshot, a changed provision hash makes every obligation relying on it `REVIEW_REQUIRED` **automatically**. Nobody has to remember to flag it.
   - Editorial-only changes are cleared by a lightweight review record with outcome `NO_MATERIAL_CHANGE` from a domain reviewer. Maintainers cannot clear them alone.
   - A normalizer version change recomputes all hashes and is recorded as non-material. It never flips review states by itself.

5. **Runtime effect** (see §9.6 and §9.10):

   | Obligation review state | Effect on findings |
   | --- | --- |
   | `PROVISIONAL` | Evaluated. Findings carry caveat `PROVISIONAL_RULE`. The report and launch-state definition box count obligations evaluated under provisional rules. |
   | `REVIEWED` | Evaluated normally |
   | `REVIEW_REQUIRED` | Legal-category obligations cannot contribute to a `PASS`: they yield `LEGAL_REVIEW_REQUIRED(reason = SOURCE_CHANGED)`. A confirmed technical failure of the mapped control stays `FAIL`, with caveat `RULE_REVIEW_REQUIRED`. |

## Consequences

- There is no "stable because a maintainer said so". CI computes and publishes review states, and the README pack table is generated from them.
- CODEOWNERS routes `rules/packs/*/reviews/**` and `rules/reviewers.yaml` to maintainers and domain reviewers. A reviewer cannot approve a PR that adds their own review record without a maintainer.
- Reviewer data in a public repository is limited to what the reviewer consents to publish. The registry supports a public handle plus a professional reference, without contact details.
- A pack review improves pack quality. It is **not** legal advice to users, and the README and reports say so.

## Alternatives considered

- **Pack-level `STABLE` flag:** easy to drift. Rejected.
- **Two independent legal reviews for everything:** too costly for community packs, and it does not target risk. Rejected in favor of mandatory specialist review for high-risk areas, with support for more reviews.
- **Storing source text to diff changes:** conflicts with ADR 0001. Hashes plus official URLs give the same change detection.
