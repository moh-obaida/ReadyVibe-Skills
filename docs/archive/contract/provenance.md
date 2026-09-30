# Rule and source provenance

> **SUPERSEDED / HISTORICAL DESIGN.** Belongs to the dropped platform architecture. See [`docs/current-model.md`](../../current-model.md).

- Authoritative text is not stored. Snapshots record per-provision hashes.
- Review state is computed by `reviewState` in `@readyvibe/schemas`. It is never a field an author sets.
- Temporal state is computed by `temporalState` for an `evaluatedAsOf` date.
- `metadata` and obligation YAML must not contain `reviewState`, `reviewed`, or `status` fields that claim a review outcome.
- Obligations name `basis` provisions. A changed provision hash moves a previously reviewed obligation to `REVIEW_REQUIRED`.
