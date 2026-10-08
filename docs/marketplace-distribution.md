# Marketplace distribution (Agensi)

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
