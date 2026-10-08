# ReadyVibe Skills

**One toolkit of {{SKILL_COUNT}} production and launch-readiness methods for AI coding agents.** ReadyVibe helps an agent inspect, fix, and verify what stands between a website and a responsible launch.

This download is the complete collection as a single skill. `SKILL.md` is the router; the {{SKILL_COUNT}} specialist methods, their helper scripts, and their references are inside `modules/`. Nothing else is needed: no ReadyVibe package, account, or service, and no access to the source repository.

Version {{VERSION}} · License: Apache-2.0 · Source: https://github.com/moh-obaida/ReadyVibe-Skills

## Install

Extract the `readyvibe-skills` folder into the skills directory your coding agent reads (it must contain `SKILL.md` directly), for example `.claude/skills/readyvibe-skills/` in a project or `~/.claude/skills/readyvibe-skills/` for all projects with Claude Code. Other agents that load `SKILL.md`-based skills use their own skills directory. Keep the folder intact: the router loads methods by relative path.

Helper scripts need Node.js 22 or newer. A few browser-based checks use [Playwright](https://playwright.dev) if the inspected project has it, and say so when it is missing.

## Use

Ask your agent for the outcome you want, inside your project:

- "Make my entire website ready to launch." Runs the `launch-all` method, which considers all {{LAUNCH_CHECKS}} launch checks and activates only the specialists that apply.
- "Fix my website's SEO." Runs the SEO readiness method.
- "Audit my authentication security." Runs the web security method (and admin authorization, headers, or payments only if they apply).
- "Make my website mobile-friendly." Runs the mobile readiness method after inspecting your design system.
- "Check my forms." Runs the forms readiness method.

It never runs all {{SKILL_COUNT}} specialists for one request.

## What is inside

| Path | Contents |
|---|---|
| `SKILL.md` | The only skill entry point: identifies intent and routes to specialists |
| `references/skill-catalog.md` | Every specialist with its path, purpose, owned checks, helpers, and companions |
| `references/routing-guide.md` | Request-to-specialist routes with keywords |
| `modules/<category>/<name>/METHOD.md` | One specialist's full method |
| `modules/<category>/<name>/references/` | The documents that method links to, including companion fallbacks |
| `modules/<category>/<name>/scripts/` | The helper scripts that method runs |
| `manifest.json` | Machine-readable index with SHA-256 checksums of every packaged file |

Specialists by category: {{CATEGORY_SUMMARY}}. The coverage areas (production readiness, accessibility, security, SEO, performance, privacy and compliance readiness, mobile responsiveness, UI and UX, forms, deployment, admin, AI features) describe what the methods inspect. They are not certifications.

## What it does not promise

It is not a lawyer, a WCAG conformance audit, a penetration test, or a guarantee of search ranking or indexing. It will not call a site "compliant", "accessible", or "secure" without scope. Legal specifics are looked up at official sources while the agent works and are marked for human review. Skills are instructions your agent runs with your project's permissions: read them before you use them.

## License and attribution

Apache-2.0. The `LICENSE` and `NOTICE` files travel with every copy. ReadyVibe Skills is the same open-source collection published at https://github.com/moh-obaida/ReadyVibe-Skills, where each skill is also installable on its own with `npx skills add moh-obaida/ReadyVibe-Skills`.
