# Archive: superseded and historical design

**SUPERSEDED / HISTORICAL DESIGN.** Nothing here is current. See [`../current-model.md`](../current-model.md).

- `platform-architecture/`: the original specification for a ReadyVibe CLI, deterministic engine, schemas, rule packs, and `.readyvibe/` artifact protocol. The product direction changed: ReadyVibe-Skills is a public skills repository, not a platform.
- `adr/`: decision records that only made sense for that platform (rule review lifecycle, temporal validity, package boundaries).
- `contract/`: the `.readyvibe/` artifact-bus and rule-provenance contracts.

The code from that design (the `packages/` CLI, engine, and schemas, and the `rules/` packs) was removed from the working tree in this simplification. It remains in git history at commit `64405be` ("Add the ReadyVibe engine, public skills, and artifact contract.") if a future project ever needs it:

```bash
git show 64405be --stat
git checkout 64405be -- packages rules
```

The parts of that work that make skills better were kept and adapted: planted-identity detection (now in `scripts/lib/canary.mjs`), vendor classification (`scripts/lib/trackers.mjs`), and the synthetic fixtures (`fixtures/`).
