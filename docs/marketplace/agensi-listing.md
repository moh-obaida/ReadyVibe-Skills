# Agensi listing draft: ReadyVibe Skills

**Editable draft.** Nothing here has been entered on Agensi, and the listing is not published or approved. Facts below were checked against this repository; items marked **PENDING** need a real run or a human decision before they go on the listing.

Upload exactly one file: `dist/agensi/ReadyVibe-Skills.zip` (built by `pnpm marketplace:bundle`). Do not upload the GitHub repository ZIP and do not upload the per-skill ZIPs from `pnpm marketplace:build`.

## Product title

ReadyVibe Skills

## Pricing

Free.

## Short summary

The complete ReadyVibe toolkit: 55 launch-readiness methods that help your AI coding agent inspect, fix, and verify what stands between a website and a responsible launch.

## Full description

Your AI coding agent built a site that looks finished. ReadyVibe Skills teaches that agent to find what still stands between the site and a responsible launch: it inspects what the project actually does, decides which launch concerns apply, fixes what is safe to fix, verifies each change, and tells you plainly what needs a human.

This is one download containing the complete ReadyVibe collection: 55 specialist methods behind a single entry point. Ask for what you need in plain words. A request like "make my entire website ready to launch" runs the broad launch-readiness method, which considers 40 launch checks and 12 conditional compliance domains and activates only the specialists that apply. A narrow request such as "fix my SEO" or "audit my authentication security" goes straight to the matching specialist. It never runs all 55 on every request.

The principle: **consider broadly, activate selectively, verify deeply.**

## What it covers

Coverage areas are what the methods inspect. They are not certifications.

- Production readiness: deployment cleanup, staging and debug leftovers, secrets, source maps, placeholder environment values
- Security: exposed secrets, authorization and session handling, security headers and CSP, dependency risk (not a penetration test)
- Accessibility: keyboard, focus, contrast, labels, alt text, reduced motion (not a WCAG conformance audit)
- SEO and discoverability: titles, descriptions, canonicals, robots, sitemap, social previews, structured data, Search Console readiness
- Performance: oversized assets and blocking scripts
- Privacy and compliance readiness: data-flow mapping, cookies and trackers, consent behavior, policy-versus-behavior consistency, data rights, email, age handling, regulated-domain triggers (legal specifics are looked up at official sources and marked for human review)
- Mobile responsiveness and right-to-left / multilingual layouts
- UI and UX verification: dead buttons, placeholders, fake claims, error pages, loading/empty/error states
- Forms and user flows: labels, validation, endpoints, success/error handling, duplicate submission
- Administrative systems: build or improve an admin tailored to the real app, authorization, audit logs
- AI-powered application readiness and user-generated-content safety

## Features (as built)

- One master `SKILL.md` that identifies intent and routes to specialists; 55 method documents loaded only when needed
- Helper scripts bundled with the methods (metadata, link crawling, markup, asset weight, secret scanning, headless-browser runtime observation, data-model inventory). Zero dependencies, Node 22+, never call a model
- Evidence labels on every claim (observed, source-indicated, declared, inferred, unknown, review required); unknown is never turned into a pass
- Builds on your own design system for any visible change; does not impose a look
- Refuses to invent legal terms, company details, testimonials, FAQ answers, or metrics
- Self-contained: nothing outside the downloaded folder is needed; no ReadyVibe account, package, or service
- Apache-2.0, source on GitHub

## Usage examples

Prompts to try inside your project:

- "Make my entire website ready to launch."
- "Fix my website's SEO."
- "Audit my authentication security."
- "Make my website mobile-friendly."
- "Check my signup form."

**Demonstration output: PENDING.** No real agent run has been recorded for this listing (this repository's checks never run a model). Before publishing, run one of the prompts above on a non-sensitive sample project with the extracted bundle installed, and paste the genuine result: observed findings, what changed, verification, remaining unknowns. Do not invent a successful audit.

## Compatibility

Verified here (deterministically, with no model run):

- The bundle is a normal `SKILL.md` skill folder. The Skills CLI (`skills` 1.7.1) detected exactly one skill, `readyvibe-skills`, in the extracted bundle and installed all of its files for the `claude-code` agent layout; bundled helpers ran from the installed copy.

Not verified:

- Behavior of any coding agent actually following the skill (requires a model-consuming evaluation).
- Other agents' skill folders and how they handle large skills with relative file references. Describe other agents as untested until you test them.
- Agensi's own upload scanner and auto-detection.

Helper scripts need Node.js 22 or newer. Browser-based checks use Playwright if the inspected project has it.

## Known limitations

- Not a lawyer, a WCAG conformance audit, a penetration test, or a promise of ranking or indexing.
- Results depend on the agent and your project; review everything it changes.
- Runtime checks need a reachable site (local dev server, preview, or production). Without one, those checks stay UNKNOWN.
- The package is larger than a typical single skill (55 methods and their helpers); the agent loads only the methods that apply.

## FAQ

**Is this one skill or 55?** One download with one entry point. It contains 55 specialist methods; the entry skill routes to the ones that fit your request.

**Does it run everything every time?** No. Whole-site requests run the launch-readiness method, which activates only the specialists that apply and records the rest as not applicable (with the reason) or unknown.

**Will it make my site compliant, accessible, or secure?** It will not claim that. It inspects, fixes what is clearly safe, verifies, and reports what still needs a human, a lawyer, or a security review.

**Does it need an account, package, or API key?** No.

**Is it really free?** Yes. The same collection is open source under Apache-2.0 at the repository below.

**Can I install individual skills instead?** Yes: `npx skills add moh-obaida/ReadyVibe-Skills --skill launch-all` (or any other skill name). The Agensi bundle is an additional download format.

## Permissions to review before declaring

Check each against the shipped scripts and methods; do not copy an auto-detected list blindly.

- Reads project files in the folder being inspected.
- Runs `node` helper scripts bundled in the skill folder.
- Fetches only the site URLs the user points the helpers at; the headless-browser helper starts a local browser through Playwright if present.
- Methods may edit project files within their documented "May change" scope; they do not deploy, send messages, or use credentials.
- External host referenced in the package text: github.com (source link).

## License and attribution

Apache-2.0. `LICENSE` and `NOTICE` are inside the ZIP. Source: https://github.com/moh-obaida/ReadyVibe-Skills

## Media

**PENDING.** The repository contains no ReadyVibe logo or brand assets, and none were generated. Add genuine artwork or real screenshots of an actual run when they exist.

## Submission checklist

- [ ] `pnpm check` and `pnpm marketplace:bundle` pass on the release commit/tag you are uploading
- [ ] Upload only `ReadyVibe-Skills.zip`; confirm Agensi detects one skill named `readyvibe-skills` / "ReadyVibe Skills", not `wcag-readiness`
- [ ] Pricing set to Free
- [ ] Real demo recorded (above) or the demo section left out
- [ ] Permissions reviewed by hand
- [ ] Platform security scan and review completed
