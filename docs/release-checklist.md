# Release checklist

Work top to bottom. Do not tag until every box above the tag step is checked. Replace `X.Y.Z` with the version.

## Before the release commit

- [ ] Working tree clean apart from intended changes; on `main`
- [ ] Active docs accurate (`README.md`, `docs/current-model.md`, `docs/skill-layout.md`, `CONTRIBUTING.md`, `SECURITY.md`); `docs/archive/` clearly marked historical
- [ ] Every public `SKILL.md` reviewed (routing description, method, applicability, evidence, fix boundaries, verification, escalation, standalone behavior)
- [ ] Every skill name intentional; no stale names (`grep -rn production-readiness` outside `docs/archive/` is empty)
- [ ] `metadata.companions` reviewed by hand: only real method dependencies, no referrals
- [ ] Generated files synchronized: `pnpm sync --check`
- [ ] Marketplace bundle builds and validates: `pnpm marketplace:bundle:check` (and `pnpm marketplace:bundle` when preparing an Agensi upload)
- [ ] Lint green: `pnpm lint`
- [ ] Tests green in CI mode: `CI=true pnpm test` on the supported Node versions (22 and 24)
- [ ] No secrets or realistic credentials (the lint's `SECRET` rule; fixtures are synthetic)
- [ ] `LICENSE` is the full Apache-2.0 text; `NOTICE` accurate
- [ ] `CHANGELOG.md` updated; release notes ready in `docs/releases/vX.Y.Z.md`
- [ ] `package.json` version set

## Verify the real distribution path

- [ ] CI green on the release commit on GitHub
- [ ] `node tools/verify-public-install.mjs --all`: public GitHub `--list`, isolated installs of representative skills, and `--all` all pass
- [ ] Mutation checks: each guard fails when its rule is broken (stale generated companion file, unknown companion, missing fallback entry, missing vendored helper, invalid YAML description, ReadyVibe CLI dependency, check with no owner, stray `SKILL.md` path), and every mutation is restored

## Tag and publish

- [ ] Release commit is on `main` and pushed
- [ ] Annotated tag: `git tag -a vX.Y.Z -m "ReadyVibe-Skills vX.Y.Z"` then `git push origin vX.Y.Z`
- [ ] GitHub Release created from the tag with the prepared notes
- [ ] **Pinned install verified**: `node tools/verify-public-install.mjs moh-obaida/ReadyVibe-Skills#vX.Y.Z --all`
- [ ] Only now, add the pinned-install example to the README (a docs commit after the tag)
- [ ] Do not publish anything to npm
