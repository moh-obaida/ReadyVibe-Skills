# Marketplace distribution (Agensi)

## Primary artifact: the unified ReadyVibe Skills bundle

Agensi lists **one** product, ReadyVibe Skills, from **one** ZIP that contains all public skills behind a single master `SKILL.md`. Upload `dist/agensi/ReadyVibe-Skills.zip`. Never upload the GitHub repository ZIP: Agensi would detect `skills/accessibility/wcag-readiness/SKILL.md` first and publish an accessibility-only listing (see [ADR 0007](adr/0007-unified-marketplace-bundle.md)).

```bash
pnpm marketplace:bundle         # build dist/agensi/ReadyVibe-Skills.zip + bundle-report.json
pnpm marketplace:bundle:check   # run every check and validate the archive; writes nothing
```

The build requires `pnpm sync:check` and `pnpm lint` to pass (it runs them itself and stops on failure), discovers public skills (`metadata.internal: true` is excluded), stages the bundle in a temporary directory, creates a reproducible ZIP, validates the archive, extracts it, and validates it again in isolation. It prints a report: steps, skill count, file count, size, and SHA-256. Generated files are gitignored.

Archive layout:

```text
readyvibe-skills/
├── SKILL.md                      the only SKILL.md: master router (name: readyvibe-skills)
├── README.md  LICENSE  NOTICE  manifest.json
├── references/
│   ├── skill-catalog.md          every skill: method path, purpose, owned checks, helpers, companions
│   └── routing-guide.md          routes with keywords, launch-check index
└── modules/<category>/<name>/
    ├── METHOD.md                 the skill's SKILL.md, frontmatter and body unchanged, plus a bundle banner
    ├── references/               vendored references and the companion fallbacks
    └── scripts/                  vendored helpers and their lib/
```

How it works: `SKILL.md` resolves a request (named specialist, whole-site launch, narrow route, combination, or catalog lookup), loads `modules/core/launch-all/METHOD.md` for broad launch requests or the matching specialist for narrow ones, and loads further methods only when they apply. The authored sources are in `marketplace/bundle/` (`master.md`, `readme.md`, `routing-guide.md`, `routes.json`); the catalog, route table, and manifest are generated from the skills' own metadata. If you add a public skill, add it to a route in `routes.json` or the build fails.

The listing copy is in [`marketplace/agensi-listing.md`](marketplace/agensi-listing.md). It leaves the demo and media explicitly pending.

### Manual steps in Agensi (not automatable here)

1. Upload `ReadyVibe-Skills.zip` and confirm the detected skill is `readyvibe-skills` / ReadyVibe Skills, not `wcag-readiness`.
2. Enter the listing text, set pricing to Free, review declared permissions, add genuine media and a real demo run.
3. Pass the platform's security scan and review. Do not describe the listing as published until that happens.

---

## Secondary artifacts: individual skill ZIPs


ReadyVibe's canonical product is still the 55-skill, Skills CLI-compatible collection under skills/. Marketplace ZIPs are an additional build output, not another source of truth. Do not move, rename, or edit the existing skill folders for marketplace purposes.

## Build

Requires Node.js 22+ (the repository's existing version), pnpm install, and the system commands zip and unzip.

- Build all public skills: `pnpm marketplace:build`
- Build one: `pnpm marketplace:skill --skill wcag-readiness`
- Validate all archives without retaining generated files: `pnpm marketplace:check`

Files are generated under `dist/agensi/`, which is gitignored. For each public skill, the build creates exactly one ZIP named after the skill and a worksheet at `listings/<skill>.md`. A `manifest.json` maps every ZIP to its repository path and original activation description.

ZIP structure:

```text
wcag-readiness.zip
└── wcag-readiness/
    ├── SKILL.md
    ├── README.md
    ├── LICENSE
    ├── NOTICE
    ├── references/
    └── scripts/
```

Only files inside the skill's own folder are included, plus a generated README and repository Apache-2.0 attribution documents. Helpers and references have already been vendored by the existing sync process. Do not ship the entire repository ZIP; Agensi may autodetect a single SKILL.md and silently publish a different skill than intended.

## Listing workflow

1. Run `pnpm check` before packaging, to validate the canonical content and vendored references.
2. Run `pnpm marketplace:build` or the one-skill command; inspect the generated ZIP and worksheet.
3. Upload ONE standalone ZIP for ONE Agensi listing.
4. Use the worksheet as a fact-checking guide. Rewrite the summary for buyers, add a precise full description, and include a real demo request and result. Verify the agent was actually run; generated worksheets are intentionally not fake demonstrations.
5. Review the actual permissions, hosts, executable helpers, browser requirements, and supported agent runtimes of that specific skill. The marketplace may suggest unrelated domains from text references. Do not automatically declare these to be dependencies.
6. Add optional genuine logo/screenshots, accurate tags, FAQs, compatibility limitations, and pricing. Run the platform's security and editorial review.
7. For later releases, rebuild from the approved git release/tag, check the ZIP contents, and replace the marketplace version only after verification. Do not hand-edit a generated copy while leaving its source unchanged.

The generated worksheets are editorial drafts, not import-ready metadata or proof of security review. No listing is published by the build script.

## Licensing and payouts

All public ReadyVibe skills remain Apache-2.0 and available free on GitHub; adding a priced marketplace download does not make the same source proprietary or exclusive. Explain what a buyer is paying for. Do not imply that paid access gives exclusive rights. Keep the Apache license and NOTICE with each ZIP.

Marketplace seller and Stripe verification are handled by the service; complete them through an account legitimately eligible under the platform's terms, with parent/guardian involvement if required. This repository never creates payment accounts, works around verification, or collects buyer credentials.

Reference: https://www.agensi.io/learn/skill-md-creator-checklist
