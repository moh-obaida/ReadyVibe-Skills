import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { EvidenceItem, RealityModel } from "./model.js";

const SKIP = new Set(["node_modules", "dist", ".git", ".readyvibe", "coverage"]);
const VENDORS: { id: string; name: string; categories: string[]; needles: string[] }[] = [
  { id: "google-analytics", name: "Google Analytics", categories: ["ANALYTICS"], needles: ["googletagmanager.com/gtag", "google-analytics.com", "gtag("] },
  { id: "meta-pixel", name: "Meta Pixel", categories: ["ADVERTISING"], needles: ["connect.facebook.net", "fbq("] },
  { id: "posthog", name: "PostHog", categories: ["ANALYTICS", "SESSION_REPLAY"], needles: ["posthog.init", "posthog-js"] },
  { id: "stripe", name: "Stripe", categories: ["PAYMENTS"], needles: ["js.stripe.com", "@stripe/stripe-js", "sk_live_"] },
  { id: "sentry", name: "Sentry", categories: ["ERROR_MONITORING"], needles: ["@sentry/", "sentry.io"] },
];

export interface ReconResult {
  model: RealityModel;
  evidence: EvidenceItem[];
}

export function reconStatic(root: string): ReconResult {
  const files = listFiles(root);
  const evidence: EvidenceItem[] = [];
  const texts = new Map<string, string>();
  for (const file of files) {
    if (statSync(file).size > 1_000_000) continue;
    if (!/\.(html?|tsx?|jsx?|vue|svelte|astro|css|json|xml|txt|md|ya?ml)$/i.test(file)) continue;
    texts.set(relative(root, file), readFileSync(file, "utf8"));
  }

  const pkg = readPkg(root);
  const frameworks = detectFrameworks(pkg, texts);
  const routes = detectRoutes(texts);
  const vendors = detectVendors(texts, evidence);
  const secrets = detectSecrets(texts, evidence);
  const network = vendors.map((v) => ({
    origin: v.id,
    phase: "PRE_INTERACTION" as const,
    vendorId: v.id,
  }));
  const declarations = detectDeclarations(texts);
  const forms = detectForms(texts);
  const dataElements = detectData(texts, forms);
  const design = detectDesign(texts);
  const identity = detectIdentity(texts);
  const deletion = detectDeletion(texts);
  const email = detectEmail(texts);
  const sitemapPaths = detectSitemap(texts);
  for (const route of routes) route.inSitemap = sitemapPaths.includes(route.path);

  const capabilities: RealityModel["capabilities"] = {
    HAS_ANALYTICS: vendors.some((v) => v.categories.includes("ANALYTICS")) ? "PRESENT" : "ABSENT",
    HAS_ADVERTISING: vendors.some((v) => v.categories.includes("ADVERTISING")) ? "PRESENT" : "ABSENT",
    HAS_PAYMENTS: vendors.some((v) => v.categories.includes("PAYMENTS")) ? "PRESENT" : "ABSENT",
    HAS_AUTH: /signIn|createUser|supabase.auth|next-auth|clerk/i.test([...texts.values()].join("\n")) ? "PRESENT" : "ABSENT",
    HAS_MARKETING_EMAIL: email?.marketing ? "PRESENT" : "ABSENT",
    HAS_PUBLIC_CONTENT: routes.some((r) => r.auth === "PUBLIC") ? "PRESENT" : "UNKNOWN",
    HAS_NON_ESSENTIAL_CLIENT_TECH: vendors.some((v) => v.categories.some((c) => c !== "PAYMENTS")) ? "PRESENT" : "ABSENT",
    HAS_MULTIPLE_LOCALES: /locale|hreflang|next-intl|i18n/i.test([...texts.values()].join("\n")) ? "SUSPECTED" : "ABSENT",
    HAS_ADMIN_SURFACE: routes.some((r) => r.path.includes("admin")) ? "PRESENT" : "ABSENT",
  };

  const model: RealityModel = {
    project: {
      name: typeof pkg?.name === "string" ? pkg.name : null,
      frameworks,
      packageManager: existsSync(join(root, "pnpm-lock.yaml")) ? "pnpm" : existsSync(join(root, "package-lock.json")) ? "npm" : null,
      hosting: texts.has("vercel.json") ? "vercel" : texts.has("netlify.toml") ? "netlify" : texts.has("wrangler.toml") ? "cloudflare" : null,
    },
    routes,
    capabilities,
    coverage: [
      {
        scope: "STATIC",
        files: texts.size,
        routes: routes.length,
        blindSpots: ["server-to-server requests", "routes behind login unless a URL is probed"],
      },
    ],
    clientStorage: [],
    networkDestinations: network,
    vendors,
    declarations,
    dataElements,
    forms,
    secrets,
    headers: {},
    design,
    identity,
    deletion,
    email,
  };
  evidence.push({
    id: "ev-coverage",
    type: "COVERAGE",
    observedValue: model.coverage[0],
    confidence: "CONFIRMED",
  });
  return { model, evidence };
}

function listFiles(dir: string, root = dir, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) listFiles(abs, root, out);
    else out.push(abs);
  }
  return out;
}

function readPkg(root: string): Record<string, unknown> | null {
  const file = join(root, "package.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}

function detectFrameworks(pkg: Record<string, unknown> | null, texts: Map<string, string>) {
  const deps = {
    ...((pkg?.dependencies as Record<string, string>) ?? {}),
    ...((pkg?.devDependencies as Record<string, string>) ?? {}),
  };
  const found: { id: string; version: string | null }[] = [];
  if (deps.next) found.push({ id: "nextjs", version: deps.next });
  if (deps.vite) found.push({ id: "vite-react", version: deps.vite });
  if (deps.astro) found.push({ id: "astro", version: deps.astro });
  if (texts.has("index.html") && found.length === 0) found.push({ id: "static-html", version: null });
  return found;
}

function detectRoutes(texts: Map<string, string>): RealityModel["routes"] {
  const routes: RealityModel["routes"] = [];
  for (const [file, text] of texts) {
    const page = file.match(/(?:^|\/)app\/(.*)page\.tsx$/);
    if (page) {
      const path = `/${(page[1] ?? "").replace(/\/$/, "")}` || "/";
      routes.push(routeFrom(path, file, text));
    }
    if (file === "index.html" || file.endsWith("/index.html")) {
      routes.push(routeFrom("/", file, text));
    }
  }
  if (routes.length === 0 && texts.has("index.html")) {
    routes.push(routeFrom("/", "index.html", texts.get("index.html")!));
  }
  return routes;
}

function routeFrom(path: string, file: string, text: string): RealityModel["routes"][number] {
  const title = text.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
  const canonical = text.match(/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? null;
  const robots = text.match(/name=["']robots["'][^>]*content=["']([^"']+)["']/i)?.[1] ?? null;
  const auth = /dashboard|admin|account/.test(path) ? "REQUIRED" : "PUBLIC";
  const htmlLang = text.match(/<html[^>]*\blang=["']([^"']+)["']/i)?.[1] ?? null;
  return { path, file, auth, title, description: null, canonical, robots, inSitemap: false, htmlLang };
}

function detectVendors(texts: Map<string, string>, evidence: EvidenceItem[]) {
  const blob = [...texts.entries()];
  const found = [];
  for (const vendor of VENDORS) {
    for (const [file, text] of blob) {
      if (vendor.needles.some((n) => text.includes(n))) {
        const line = text.split("\n").findIndex((l) => vendor.needles.some((n) => l.includes(n))) + 1;
        evidence.push({
          id: `ev-vendor-${vendor.id}`,
          type: "SOURCE_LOCATION",
          file,
          lines: [line, line],
          observedValue: vendor.id,
          confidence: "HIGH",
        });
        found.push({ id: vendor.id, name: vendor.name, categories: vendor.categories });
        break;
      }
    }
  }
  return found;
}

function detectSecrets(texts: Map<string, string>, evidence: EvidenceItem[]) {
  const secrets: RealityModel["secrets"] = [];
  const patterns: { kind: string; re: RegExp }[] = [
    { kind: "stripe-live-secret", re: /sk_live_[A-Za-z0-9]{8,}/ },
    { kind: "client-exposed-secret", re: /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|KEY|TOKEN)/ },
    { kind: "private-key", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  ];
  for (const [file, text] of texts) {
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        if (pattern.re.test(line) && !line.includes("sk_live_EXAMPLE")) {
          secrets.push({ file, kind: pattern.kind, line: index + 1 });
          evidence.push({
            id: `ev-secret-${secrets.length}`,
            type: "SOURCE_LOCATION",
            file,
            lines: [index + 1, index + 1],
            observedValue: pattern.kind,
            confidence: "CONFIRMED",
          });
        }
      }
    });
  }
  return secrets;
}

function detectDeclarations(texts: Map<string, string>) {
  const declarations: RealityModel["declarations"] = [];
  for (const [file, text] of texts) {
    const patterns: { kind: string; re: RegExp }[] = [
      { kind: "NO_ANALYTICS", re: /we do not use analytics/i },
      { kind: "NECESSARY_COOKIES_ONLY", re: /only necessary cookies/i },
      { kind: "DELETE_ANYTIME", re: /delete your account at any time/i },
      { kind: "COMPLIANCE_BADGE", re: /GDPR compliant/i },
      { kind: "BILINGUAL", re: /English\s*\|\s*العربية/ },
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern.re);
      if (match) declarations.push({ kind: pattern.kind, quote: match[0], file });
    }
  }
  return declarations;
}

function detectForms(texts: Map<string, string>): RealityModel["forms"] {
  const forms: RealityModel["forms"] = [];
  for (const [, text] of texts) {
    if (/type=["']email["']/i.test(text) && /newsletter/i.test(text)) {
      forms.push({
        purpose: "NEWSLETTER",
        fields: ["email"],
        precheckedMarketing: /type=["']checkbox["'][^>]*checked/i.test(text),
      });
    }
  }
  return forms;
}

function detectData(texts: Map<string, string>, forms: RealityModel["forms"]) {
  const elements: RealityModel["dataElements"] = [];
  if (forms.some((f) => f.fields.includes("email"))) {
    elements.push({ name: "email", dataClass: "EMAIL", source: "FORM" });
  }
  const blob = [...texts.values()].join("\n");
  if (/dateOfBirth|date_of_birth|type=["']date["']/i.test(blob)) {
    elements.push({ name: "dateOfBirth", dataClass: "DATE_OF_BIRTH", source: "FORM" });
  }
  return elements;
}

function detectDesign(texts: Map<string, string>): RealityModel["design"] {
  const tokens: string[] = [];
  const components: string[] = [];
  for (const [file, text] of texts) {
    if (file.endsWith(".css")) {
      for (const match of text.matchAll(/--([a-z0-9-]+)\s*:/gi)) tokens.push(`--${match[1]}`);
    }
    if (/export function Button/.test(text)) components.push("Button");
    if (/export function Card/.test(text)) components.push("Card");
    if (/export function Dialog/.test(text)) components.push("Dialog");
  }
  const cssStrategy = [...texts.keys()].some((f) => f.includes("tailwind")) ? "TAILWIND" : tokens.length ? "CSS_VARIABLES" : null;
  return { tokens: [...new Set(tokens)], components, cssStrategy };
}

function detectIdentity(texts: Map<string, string>): RealityModel["identity"] {
  const surfaces: { surface: string; value: string }[] = [];
  const residue: string[] = [];
  const residueNeedles = ["Vite + React", "Create Next App", "Your Company Name", "localhost"];
  for (const [file, text] of texts) {
    const title = text.match(/<title>([^<]*)<\/title>/i)?.[1];
    if (title) surfaces.push({ surface: file, value: title });
    for (const needle of residueNeedles) {
      if (text.includes(needle)) residue.push(`${needle} in ${file}`);
    }
  }
  return { surfaces, residue: [...new Set(residue)] };
}

function detectDeletion(texts: Map<string, string>): RealityModel["deletion"] {
  const blob = [...texts.values()].join("\n");
  if (!/delete account|permanently delete/i.test(blob)) return null;
  return {
    uiCopy: /permanently delete/i.test(blob) ? "permanently delete" : "delete account",
    setsActiveFalse: /active\s*[:=]\s*false|deleted_at/.test(blob),
    hardDelete: /DELETE FROM users|prisma\.user\.delete|\.delete\(\)/.test(blob),
  };
}

function detectEmail(texts: Map<string, string>): RealityModel["email"] {
  const blob = [...texts.values()].join("\n");
  if (!/newsletter|unsubscribe|sendMarketing/i.test(blob)) return null;
  return {
    marketing: /newsletter|sendMarketing/i.test(blob),
    unsubscribeLink: /unsubscribe/i.test(blob),
    suppressionEnforced: /suppression|isSuppressed/.test(blob) && /sendMarketing[\s\S]{0,400}suppression/.test(blob),
  };
}

function detectSitemap(texts: Map<string, string>): string[] {
  const paths: string[] = [];
  for (const [file, text] of texts) {
    if (!file.endsWith("sitemap.xml") && !file.endsWith("sitemap.ts")) continue;
    for (const match of text.matchAll(/<loc>[^<]*(\/[^<]*)<\/loc>/g)) {
      try {
        const url = match[1] ?? "";
        paths.push(url.startsWith("http") ? new URL(url).pathname : url);
      } catch {
        /* ignore malformed loc */
      }
    }
    for (const match of text.matchAll(/["'](\/(?:dashboard|admin)[^"']*)["']/g)) paths.push(match[1] ?? "");
  }
  return paths;
}

export async function observeHttp(baseUrl: string, model: RealityModel, evidence: EvidenceItem[]): Promise<void> {
  const target = new URL("/readyvibe-missing-route", baseUrl);
  const response = await fetch(target, { redirect: "manual" });
  evidence.push({
    id: "ev-unknown-route",
    type: "HTTP_EXCHANGE",
    url: target.toString(),
    observedValue: { status: response.status },
    confidence: "CONFIRMED",
  });
  model.routes.push({
    path: "/readyvibe-missing-route",
    auth: "PUBLIC",
    title: null,
    description: null,
    canonical: null,
    robots: null,
    status: response.status,
    inSitemap: false,
    htmlLang: null,
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    model.clientStorage.push({
      name: setCookie.split("=")[0] ?? "cookie",
      mechanism: "COOKIE_HTTP",
      purpose: "UNKNOWN",
      beforeConsent: true,
    });
  }
}
