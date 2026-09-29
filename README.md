# ReadyVibe

ReadyVibe inspects a website that already looks finished and reports what is still missing before a public launch: tracking that starts too early, policies that contradict the code, private URLs in a sitemap, starter branding, and secrets in client code.

It does not certify that a site is legally compliant. A clean report means the selected checks passed for that commit. `LEGAL_REVIEW_REQUIRED` means a person with legal training still has to decide.

The architecture is in [`docs/architecture/README.md`](docs/architecture/README.md).

## Quick start

List skills:

```bash
npx skills add moh-obaida/ReadyVibe-Skills --list
```

Install the launch bundle, or one skill:

```bash
npx skills add moh-obaida/ReadyVibe-Skills --skill launch-all
npx skills add moh-obaida/ReadyVibe-Skills --skill site-reconnaissance
npx skills add moh-obaida/ReadyVibe-Skills --skill admin-dashboard
```

Several skills:

```bash
npx skills add moh-obaida/ReadyVibe-Skills --skill privacy-readiness consent-management seo-readiness
```

Everything:

```bash
npx skills add moh-obaida/ReadyVibe-Skills --all
```

Installing every skill does not run every skill. The engine skips work that does not apply.

From a project checkout, after the CLI is built or installed:

```bash
npx @readyvibe/cli doctor
npx @readyvibe/cli recon --root . --json true
```

`@readyvibe/cli` is not published to npm yet. Use this repository. Do not treat a future version tag as available until a release exists.

## What the engine checks today

Static reconnaissance plus deterministic findings for:

- analytics or advertising present before any consent gate
- a privacy sentence that denies analytics the code loads
- starter titles, localhost canonicals, and compliance badges
- private routes listed in a sitemap
- account deletion that only sets `active: false`
- marketing mail with an unsubscribe link and no suppression check
- client-exposed `NEXT_PUBLIC_*SECRET*` style configuration
- unknown-route HTTP status when you pass `--url`

Planted-value matching covers raw, URL-encoded, Base64, SHA-256, and MD5 forms of synthetic identities.

## What is not done yet

- A full headless-browser consent timeline (reject, accept, withdraw) is specified in the architecture and not executed by the CLI yet. Static presence of a vendor is a `FAIL` for pre-consent loading until a gate is proven.
- Jurisdiction obligations ship as data. The EU ePrivacy example stays **provisional** until a reviewer record and a source snapshot hash exist. Review state is computed. It is not something you edit.
- npm packages are implemented and tested locally. They are not published.

## Limitations

ReadyVibe is not a lawyer, a WCAG conformance statement, a PCI assessment, or a promise that a search engine will index a page. Reports must not say "fully compliant" or "guaranteed".

## License

Apache-2.0 for the engine, CLI, skills, schemas, and tests. CC0-1.0 for original templates and catalogs that are meant to be copied into other projects. Laws and standards stay external. See `NOTICE`.
