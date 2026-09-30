# Security policy

## Reporting a vulnerability

**Please do not open a public issue for an unfixed vulnerability.** Report it privately through GitHub:

1. Go to the repository's **Security** tab and choose **Report a vulnerability** (GitHub private vulnerability reporting), or open a private advisory at <https://github.com/moh-obaida/ReadyVibe-Skills/security/advisories/new>.
2. Include what you found, how to reproduce it, which skill or script is affected, and the impact you expect.

You will get an acknowledgement, and we will work with you on a fix and a coordinated disclosure. This is a volunteer-maintained project, so please allow reasonable time.

## What is in scope

- **Helper scripts** (`scripts/`, and their vendored copies in `skills/**/scripts/`): a secret printed in full, reading `.env` values into output, path traversal, submitting forms or sending requests to a non-local origin without explicit authorization, executing code from an inspected project, or unsafe handling of untrusted page content.
- **Skill instructions** (`skills/**/SKILL.md` and references): guidance that could lead an agent to leak credentials, run destructive actions on real data, bypass authorization, use or rotate a credential, or take another unsafe action.
- **Repository tooling** (`tools/`, CI): anything that could publish a broken skill, a hidden skill, or a secret.

## What is out of scope

- Vulnerabilities in a website or application you point a skill at.
- The behavior of a third-party agent or of the Skills CLI itself (report those to their maintainers).

## Trust model

The helpers treat inspected projects and pages as untrusted: they do not run project install scripts, and they never send planted test data or submit forms to a live origin unless you explicitly allow it. **Installed skills are instructions your agent runs with your project's permissions.** Read a skill before you install it, and prefer a pinned release (`moh-obaida/ReadyVibe-Skills#<tag>`) over a moving branch.

## Supported versions

Security fixes go into the latest release. Older releases are not maintained.
