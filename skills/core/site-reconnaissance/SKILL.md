---
name: site-reconnaissance
description: "Use when you need to know what a website or web app actually is and does before reviewing or changing it: its framework, routes, audience, accounts, payments, email, analytics, forms, third parties, and deployment. It builds a short evidence-labeled context from the repository, config, and running site without a questionnaire. Do not use it to draft policies, apply fixes, or ask the user questions the repository can answer."
license: Apache-2.0
metadata:
  kind: foundation
  compliance-domains: "1"
  helpers: "inspect-metadata"
---

# site-reconnaissance

Every other ReadyVibe skill is only as good as its picture of the product. This skill builds that picture from the artifacts, and writes it down briefly so nobody re-derives it.

## Activate when

- Starting any substantial launch review, or the first time a specialist is invoked on a project.
- The applicable checks depend on facts you do not yet have (is there email? accounts? payments? which markets?).
- Skip it when `.readyvibe/context.md` exists, is recent, and nothing relevant changed. Update rather than redo.

## Inspect

Work from the cheapest, most reliable sources first.

1. **Project shape.** `package.json` (framework, dependencies, scripts), lockfile, framework config (`next.config.*`, `vite.config.*`, `astro.config.*`), deployment files (`vercel.json`, `netlify.toml`, `wrangler.toml`, Dockerfile, CI workflows), README and docs.
2. **Routes and surfaces.** File-based routes (`app/`, `pages/`, `src/routes/`), router config, API routes, server actions. Separate public, authenticated, admin, and utility routes.
3. **Data and services.** Dependencies and imports that imply auth (next-auth, Clerk, Supabase auth, Firebase), payments (Stripe, Paddle, Lemon Squeezy, PayPal), email (Resend, SendGrid, Postmark, Mailchimp), analytics/ads/replay (GA, GTM, Meta Pixel, PostHog, Hotjar, Clarity, Plausible), error monitoring, AI providers, CMS, databases, storage, maps, chat, captcha. Environment templates (`.env.example`) name services; never read secret values from `.env`.
4. **Forms and data.** Every `<form>`, submit handler, and API route: which fields, where they go, whether stored.
5. **Audience and markets.** Copy, currencies, languages/locales, `hreflang`, shipping or pricing regions, legal pages already present, "who is this for" text, age or DOB fields. Only *documented* markets count; a TLD or timezone is a weak hint, not a jurisdiction.
6. **Runtime, when a URL exists.** `node scripts/inspect-metadata.mjs --url <site>` for public structure and hosts; the running site for what actually renders. For what loads and stores, hand off to `cookie-and-storage-audit`.

Do not ask a questionnaire. Ask only when an unresolved fact changes what will be done, at most three questions, and keep working meanwhile. Typical justified questions: "Is this meant to be indexed?", "Which countries do you sell to?", "What is the production URL?".

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- A dependency in `package.json` is SOURCE-INDICATED. It may be unused. Check for an import or a script tag before saying the product "uses Stripe".
- An `.env.example` entry says a service is expected, not that it is live.
- README claims are DECLARED. Treat as leads.
- Do not infer a legal jurisdiction. Record markets as DECLARED (stated) / INFERRED (from a strong documented signal, with the signal) / UNKNOWN.

## May change

Only `.readyvibe/context.md`. Never product code.

Suggested shape (short, human-readable, each line evidence-labeled):

```
# Launch context (updated <date>)
Product: invoicing app for freelancers  [DECLARED: README]
Stack: Next.js 14 (App Router), Vercel  [OBSERVED: package.json, vercel.json]
Public vs internal: public marketing site + authenticated app under /app  [SOURCE-INDICATED: routes]
Audience/markets: freelancers; English only; markets not documented  [UNKNOWN]
Accounts/auth: yes, Supabase auth  [SOURCE-INDICATED]
Payments: none found  [OBSERVED: no processor imports or scripts]
Email: Resend, transactional only so far; no newsletter form  [SOURCE-INDICATED]
Analytics/ads/cookies: Vercel Analytics; PostHog imported in app/layout.tsx  [SOURCE-INDICATED; runtime not tested]
Forms: waitlist (email), contact (name/email/message)  [OBSERVED]
Third parties: Google Fonts, Stripe.js? (no)  [OBSERVED]
Age/children: no DOB field; adult B2B copy  [OBSERVED]
Indexing intent: marketing pages public, /app private  [DECLARED by user]
Production URL: https://ledgerly.app  [DECLARED]
Open questions: which countries do you sell to?
```

## Must not claim

That a service is live, a market is targeted, or a feature is absent from code alone. "No payments found" means none were found in the places searched (say which).

## Verify

Cross-check two independent sources for anything that will drive a decision (a dependency *and* an import or network request; a route file *and* a live response). Note where you relied on one source.

## Escalate

Contradictions between docs and code, or signs of a regulated domain (health, finance, children, legal, education) or of unusual data (biometrics, precise location): flag for `regulated-domain-triggers` immediately.

## No change is valid when

`.readyvibe/context.md` is already accurate. Say "context unchanged" and do not rewrite it.
