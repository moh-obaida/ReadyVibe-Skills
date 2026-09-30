---
name: dependency-security
description: "Use when a project has package manifests and lockfiles and you want to know about known-vulnerable, abandoned, or suspicious dependencies before launch, without running install scripts. It reads manifests and lockfiles, uses the ecosystem's audit tooling where safe, and proposes minimal, non-breaking upgrades. Do not use it to upgrade major versions automatically, run untrusted install scripts, or claim a project is free of vulnerabilities."
license: Apache-2.0
metadata:
  kind: specialist
  launch-checks: "39,38"
  compliance-domains: "10"
  references: "companion-methods"
---

# dependency-security

Every dependency is code you ship. A launch review should know what is in the tree and whether any of it is known-bad, without executing any of it to find out.

## Activate when

- Manifests exist (`package.json`, lockfiles, `requirements.txt`, `Gemfile.lock`, `go.mod`, `Cargo.lock`, `composer.lock`).
- Before launch, after a big scaffold, or when the AI generator added many packages.
- Not to perform general code review or to upgrade frameworks.

## Working alone

This skill is self-contained. Where it names other ReadyVibe skills, they are **optional companions**: if one is installed, use it; if not, follow its short entry in [references/companion-methods.md](references/companion-methods.md) and say in your report which lanes ran inline at reduced depth. Never skip a lane silently.

Companions named here: `legal-identity-notices`, `performance-readiness`, `web-security`.

## Inspect

1. **Lockfile present and committed?** No lockfile means builds are not reproducible: flag it. Multiple package managers' lockfiles (both `package-lock.json` and `pnpm-lock.yaml`) signal confusion.
2. **Known vulnerabilities, safely.** Use audit tooling that reads the lockfile: `npm audit --omit=dev`, `pnpm audit --prod`, `yarn npm audit`, `pip-audit`, `bundle audit`, `cargo audit`. These query an advisory database and do **not** run package scripts; they need network access to the registry: state if unavailable (UNKNOWN). Never run `npm install`/`pnpm install` on unreviewed code solely to audit; audit from the lockfile. Separate **production** from dev-only dependencies: production exposure matters most at launch.
3. **Triage each advisory:** is the vulnerable code path reachable in this project (a server-only package used client-side, a dev tool)? Severity in context; fix availability; direct vs transitive.
4. **Suspicious or unnecessary packages:** typosquat-looking names (`reacct`, `lodahs`), packages added by an AI with tiny download counts or no repository, `postinstall`/`preinstall` scripts in the tree (list them; do not run), unused dependencies, duplicate libraries for the same job, packages requesting broad permissions.
5. **Abandonment and licensing signals:** end-of-life framework versions, deprecated packages (`npm view <pkg> deprecated`), copyleft licenses in shipped client code (`legal-identity-notices`).
6. **Client bundle exposure:** heavy or server-only libraries in the client bundle (`performance-readiness`, `web-security`).
7. **CI and supply chain:** lockfile-enforced installs (`npm ci`), no secrets in CI logs, pinned actions where practical.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- An advisory from an audit run is OBSERVED for that database at that time. Reachability is INFERRED unless traced.
- "No advisories" means none in the database queried, on that date, for that lockfile; it says nothing about unknown vulnerabilities or malicious packages.
- If audit tooling could not run (offline), vulnerability status is UNKNOWN.

## May change

Apply **patch and minor** upgrades that resolve advisories when tests/build still pass (`npm update <pkg>`, lockfile-only); add overrides/resolutions for transitive fixes when clearly safe; remove unused or suspicious packages **with the owner's confirmation**; commit a lockfile. **Do not upgrade major versions or frameworks automatically, run install scripts of unreviewed packages, or delete a lockfile to "fix" it.** Propose major upgrades as a list with breaking-change notes.

## Must not claim

"No vulnerabilities", "secure dependencies", or "up to date". Report counts by severity, what is production-reachable, and what could not be checked.

## Verify

Re-run the audit from the updated lockfile; rebuild and run the project's tests and a smoke load of the site; confirm no new deprecations or peer-dependency errors.

## Escalate

Critical/high advisories with no fix, suspected malicious packages, or a compromised dependency (stop and tell the owner; rotate any secrets the package could have seen); major upgrades that need scheduled work.

## No change is valid when

The audit is clean for production dependencies and the lockfile is committed. Do not churn versions to hit "latest".
