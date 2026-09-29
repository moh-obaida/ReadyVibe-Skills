# `.readyvibe/` interchange contract

Normative rules are implemented by `@readyvibe/schemas`:

1. Artifacts live under `.readyvibe/`. Readers reject paths that resolve outside it, including symlink escapes (`ARTIFACT_PATH_ESCAPE`).
2. Every JSON artifact is an envelope: `schemaVersion`, `kind`, `producer`, `runId`, `createdAt`, `contentHash`, `data`.
3. Invalid artifacts are rejected as a whole (`ARTIFACT_INVALID`).
4. A different schema major is `ARTIFACT_MAJOR_UNSUPPORTED`. A newer minor warns `ARTIFACT_NEWER_MINOR`.
5. `contentHash` is `sha256:` plus the SHA-256 of canonical JSON of `data`. A mismatch is `ARTIFACT_HASH_MISMATCH`.
6. Writes are atomic (temp file, then rename).
7. `findings`, `report`, `launch-manifest`, and `baseline` require `producer.type: ENGINE` (`ARTIFACT_STATUS_AUTHORITY`).
8. Secret-shaped values are rejected (`ARTIFACT_CONTAINS_SECRET`).
