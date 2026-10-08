# ADR 0007: Unified marketplace bundle

Status: accepted (2026-10-08). Distribution through the Skills CLI is unchanged ([ADR 0006](0006-skills-first-distribution.md)).

## Context

Agensi auto-detects skills by looking for `SKILL.md` files in an uploaded archive. Uploading the repository ZIP exposed `skills/accessibility/wcag-readiness/SKILL.md` as the first match, so the listing was created as "wcag readiness" with an accessibility description. That misrepresents ReadyVibe Skills, which is a collection of 55 skills. The per-skill ZIPs from the earlier marketplace work (`pnpm marketplace:build`) are correct but cannot present the collection as one product.

## Decision

1. Add a second, additive distribution artifact: `dist/agensi/ReadyVibe-Skills.zip`, built by `pnpm marketplace:bundle`, containing one top-level folder `readyvibe-skills/` and exactly one `SKILL.md`.
2. That `SKILL.md` is a generated master router. Each public skill's `SKILL.md` is packaged as `modules/<category>/<name>/METHOD.md` with its own `references/` and `scripts/`, byte-identical to the canonical copies (only a bundle banner is added, and any mention of its own `SKILL.md` filename is renamed).
3. The router, catalog, and routing guide are generated from the canonical skills' metadata plus an authored route table (`marketplace/bundle/routes.json`). The build fails if a route names a non-public skill or a public skill has no route, so no method becomes unreachable.
4. The build never repairs canonical content. It requires `sync --check` and the skill lint to pass, then fails on anything inconsistent (stray files, symlinks, hidden files, name mismatches, missing helpers).
5. Methods are not flattened. The router loads only the methods that fit a request, preserving "consider broadly, activate selectively, verify deeply".
6. The master `SKILL.md` exists only in the build output, so the repository's own rule (no `SKILL.md` outside `skills/<category>/<name>/`) is untouched. Generated archives are not committed.

## Consequences

- `npx skills add moh-obaida/ReadyVibe-Skills` and `--skill <name>` behave exactly as before; the 55 canonical skills do not move.
- Helper scripts are duplicated per module inside the ZIP (about 1.3 MB compressed) to preserve each method's relative paths and independence.
- Statements in methods about skills being "installed" are resolved by a banner in each METHOD.md and by the router: bundled methods are the installed skills; reduced-depth companion fallbacks remain available as a backup.
- Whether Agensi's scanner and installer handle the bundle as intended can only be confirmed by a manual upload.
