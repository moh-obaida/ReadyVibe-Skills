# Security policy

Report vulnerabilities through a private GitHub security advisory. Do not open a public issue for an unfixed vulnerability.

In scope:

- **Helper scripts** (`scripts/`): secret redaction failures (a secret printed in full), reading `.env` values, path traversal, submitting forms or sending requests against non-local origins without explicit authorization, or executing inspected project code.
- **Skill instructions** (`skills/**/SKILL.md`): guidance that could lead an agent to leak credentials, run destructive actions on real data, bypass authorization, or take other unsafe actions.
- **Lint and vendoring tools** (`tools/`): misses that would publish a broken or hidden skill.

The helpers treat inspected projects as untrusted: they do not run install scripts. Out of scope: vulnerabilities in a website you point a skill at.

Installed skills run with your agent's permissions. Read a skill before you install it.
