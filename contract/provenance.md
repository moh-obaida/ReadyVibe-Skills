# Rule and source provenance

- Authoritative text is not stored. Snapshots record per-provision hashes.
- Review state is computed by `reviewState` in `@readyvibe/schemas`. It is never a field an author sets.
- Temporal state is computed by `temporalState` for an `evaluatedAsOf` date.
- `metadata` and obligation YAML must not contain `reviewState`, `reviewed`, or `status` fields that claim a review outcome.
- Obligations name `basis` provisions. A changed provision hash moves a previously reviewed obligation to `REVIEW_REQUIRED`.
