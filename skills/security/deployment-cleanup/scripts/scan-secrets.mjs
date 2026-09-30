#!/usr/bin/env node
// scan-secrets.mjs - secret-shaped values, client-exposed env variables, tracked .env files,
// and dev/staging artifacts in shipped output (source maps, localhost URLs, debug routes).
//
//   node scan-secrets.mjs [--root .] [--json]
//
// Safety: secret values are NEVER printed in full (first 4 characters + length only). .env files are
// inspected for variable NAMES and tracked/ignored state only; their values are not read into output.
// Zero dependencies. Uses `git ls-files` when available to tell tracked from untracked files.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { parseArgs } from "node:util";
import { emit, finding } from "./lib/report.mjs";

const { values: args } = parseArgs({
  options: { root: { type: "string", default: "." }, json: { type: "boolean", default: false }, "max-file-kb": { type: "string", default: "2048" } },
});
const root = args.root;
const SKIP_DIRS = new Set(["node_modules", ".git", ".pnpm-store", ".yarn", ".turbo", ".cache", "coverage", ".readyvibe", "__pycache__", ".venv", "venv"]);
const SKIP_FILES = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|composer\.lock|Cargo\.lock|poetry\.lock)$/;
const TEXT_EXT = /\.(?:[cm]?[jt]sx?|vue|svelte|astro|html?|json|ya?ml|toml|env[\w.-]*|ini|cfg|conf|sh|py|rb|php|go|rs|java|kt|swift|md|mdx|txt|xml|map|css|scss)$/i;
const BUILD_DIRS = /(^|\/)(dist|build|out|\.next\/static|\.output\/public|\.svelte-kit\/output\/client|public)(\/|$)/;
const CLIENT_SRC = /(^|\/)(src|app|pages|components|lib|public)(\/|$)/;
const ENV_PLACEHOLDER = /(your[_-]?|example|changeme|xxx+|placeholder|<[^>]+>|\$\{|\{\{|dummy|sample|test[_-]?key|fake|replace[_-]?me|000000)/i;
const CLIENT_PREFIX = /^(NEXT_PUBLIC_|VITE_|REACT_APP_|PUBLIC_|EXPO_PUBLIC_|NUXT_PUBLIC_|GATSBY_|VUE_APP_|STORYBOOK_)/;
const SECRETISH_NAME = /(SECRET|PRIVATE|PASSWORD|PASSWD|SERVICE_ROLE|SERVICEROLE|ACCESS_TOKEN|AUTH_TOKEN|API_SECRET|CLIENT_SECRET|WEBHOOK_SECRET|SIGNING|DATABASE_URL|DB_URL|CONNECTION_STRING|MASTER_KEY|ADMIN_KEY|_TOKEN$)/i;
const PUBLIC_OK_NAME = /(PUBLISHABLE|ANON|PUBLIC_KEY|PUBLIC_TOKEN|SITE_KEY|CLIENT_ID|MEASUREMENT_ID|PROJECT_ID|APP_ID|SENTRY_DSN|MAPBOX_TOKEN|POSTHOG_KEY)/i;

const PATTERNS = [
  { code: "SECRET_PRIVATE_KEY", severity: "HIGH", re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/g, label: "private key block" },
  { code: "SECRET_AWS_ACCESS_KEY", severity: "HIGH", re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, label: "AWS access key id" },
  { code: "SECRET_STRIPE_LIVE", severity: "HIGH", re: /\b(?:sk|rk)_live_[0-9A-Za-z]{16,}\b/g, label: "Stripe live secret key" },
  { code: "SECRET_STRIPE_WEBHOOK", severity: "HIGH", re: /\bwhsec_[0-9A-Za-z]{20,}\b/g, label: "Stripe webhook signing secret" },
  { code: "SECRET_STRIPE_TEST", severity: "LOW", re: /\b(?:sk|rk)_test_[0-9A-Za-z]{16,}\b/g, label: "Stripe test secret key (still should not be committed)" },
  { code: "SECRET_GITHUB_TOKEN", severity: "HIGH", re: /\b(?:ghp|gho|ghu|ghs|ghr)_[0-9A-Za-z]{30,}\b|\bgithub_pat_[0-9A-Za-z_]{40,}\b/g, label: "GitHub token" },
  { code: "SECRET_SLACK_TOKEN", severity: "HIGH", re: /\bxox[abprs]-[0-9A-Za-z-]{10,}\b/g, label: "Slack token" },
  { code: "SECRET_OPENAI_KEY", severity: "HIGH", re: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b/g, label: "OpenAI-style API key" },
  { code: "SECRET_ANTHROPIC_KEY", severity: "HIGH", re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, label: "Anthropic API key" },
  { code: "SECRET_SENDGRID_KEY", severity: "HIGH", re: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g, label: "SendGrid API key" },
  { code: "SECRET_RESEND_KEY", severity: "HIGH", re: /\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}\b/g, label: "Resend API key" },
  { code: "SECRET_TWILIO_KEY", severity: "HIGH", re: /\bSK[0-9a-f]{32}\b/g, label: "Twilio API key sid" },
  { code: "SECRET_DB_URL_CREDENTIALS", severity: "HIGH", re: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp):\/\/[^\s:/@'"]+:[^\s@'"]{4,}@[^\s'"]+/g, label: "database URL containing a password" },
  { code: "KEY_GOOGLE_API", severity: "MEDIUM", re: /\bAIza[0-9A-Za-z_-]{35}\b/g, label: "Google API key (may be a browser key by design; verify HTTP-referrer/API restrictions)", review: true },
];
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const ASSIGN_RE = /\b([A-Za-z0-9_]*(?:secret|password|passwd|private[_-]?key|api[_-]?key|auth[_-]?token|access[_-]?token|client[_-]?secret)[A-Za-z0-9_]*)\s*[:=]\s*(["'`])([^"'`\s]{12,})\2/gi;

const findings = [];
const notes = [];
const seen = new Set();
const add = (code, severity, evidence, message, extra = {}) => {
  const key = `${code}|${extra.file}|${extra.line}|${extra.target ?? ""}`;
  if (seen.has(key)) return;
  seen.add(key);
  findings.push(finding(code, severity, evidence, message, extra));
};

const redact = (value) => `${value.slice(0, 4)}…[${value.length} chars]`;
const entropy = (s) => {
  const counts = {};
  for (const c of s) counts[c] = (counts[c] ?? 0) + 1;
  return -Object.values(counts).reduce((sum, n) => sum + (n / s.length) * Math.log2(n / s.length), 0);
};
const lineAt = (text, index) => text.slice(0, index).split("\n").length;

function gitFiles() {
  try {
    const out = execFileSync("git", ["-C", root, "ls-files"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return new Set(out.split("\n").filter(Boolean));
  } catch {
    return null;
  }
}
function gitIgnored(rel) {
  try {
    execFileSync("git", ["-C", root, "check-ignore", "-q", rel], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const tracked = gitFiles();
if (!tracked) notes.push("Not a git repository (or git unavailable): tracked/ignored state of .env files could not be determined.");

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const abs = join(dir, entry);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(abs);
    else files.push({ abs, rel: relative(root, abs).split(sep).join("/"), size: st.size });
  }
})(root);

const maxBytes = Number(args["max-file-kb"]) * 1024;
let scanned = 0;
const devHits = new Map();

for (const { abs, rel, size } of files) {
  const name = basename(rel);
  const isEnv = /^\.env(\..+)?$/.test(name) || /\.env$/.test(name);
  const isTemplate = /\.(example|sample|template|dist)$/.test(name) || name === ".env.example";

  if (isEnv && !isTemplate) {
    // Names and tracked state only. Never surface values.
    const names = [];
    let hasValues = false;
    try {
      for (const line of readFileSync(abs, "utf8").split("\n")) {
        const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m) {
          names.push(m[1]);
          if (m[2].trim() && !ENV_PLACEHOLDER.test(m[2])) hasValues = true;
          if (CLIENT_PREFIX.test(m[1]) && SECRETISH_NAME.test(m[1]) && !PUBLIC_OK_NAME.test(m[1])) {
            add("CLIENT_ENV_SECRET_NAME", "HIGH", "SOURCE-INDICATED", `${m[1]} carries a client-exposed prefix but is named like a secret. Anything with that prefix is bundled into browser code.`, { file: rel, target: m[1] });
          }
        }
      }
    } catch {
      /* unreadable */
    }
    const isTracked = tracked ? tracked.has(rel) : undefined;
    if (isTracked) add("ENV_FILE_TRACKED", hasValues ? "HIGH" : "MEDIUM", "OBSERVED", `${rel} is committed to git${hasValues ? " and contains non-placeholder values" : ""}. Variable names: ${names.slice(0, 12).join(", ")}${names.length > 12 ? "…" : ""}. Values were not read into this report.`, { file: rel });
    else if (isTracked === false && hasValues && !gitIgnored(rel)) add("ENV_FILE_NOT_IGNORED", "MEDIUM", "OBSERVED", `${rel} holds values and is not covered by .gitignore; it could be committed by accident.`, { file: rel });
    continue;
  }
  if (SKIP_FILES.test(rel) || size > maxBytes || !(TEXT_EXT.test(rel) || isTemplate)) continue;
  let text;
  try {
    text = readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  scanned++;
  const inBuild = BUILD_DIRS.test(rel);
  const clientish = inBuild || CLIENT_SRC.test(rel);
  const where = (index) => ({ file: rel, line: lineAt(text, index) });
  const exposure = inBuild ? "in shipped/public output" : "in source";

  if (isTemplate) {
    // Templates may legitimately name variables; still flag client-prefixed secret-named ones.
    for (const m of text.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)) {
      if (CLIENT_PREFIX.test(m[1]) && SECRETISH_NAME.test(m[1]) && !PUBLIC_OK_NAME.test(m[1])) add("CLIENT_ENV_SECRET_NAME", "HIGH", "SOURCE-INDICATED", `${m[1]} in ${name} has a client-exposed prefix but a secret-like name.`, { file: rel, target: m[1] });
    }
    continue;
  }

  for (const p of PATTERNS) {
    for (const m of text.matchAll(p.re)) {
      if (ENV_PLACEHOLDER.test(m[0])) continue;
      add(p.code, inBuild && p.severity === "MEDIUM" ? "MEDIUM" : p.severity, "OBSERVED", `${p.label} ${exposure} (${redact(m[0])}).${inBuild ? " It is downloadable by every visitor." : ""}`, { ...where(m.index), review: p.review });
    }
  }
  for (const m of text.matchAll(JWT_RE)) {
    try {
      const payload = JSON.parse(Buffer.from(m[0].split(".")[1], "base64url").toString("utf8"));
      if (payload.role === "service_role") add("SECRET_SUPABASE_SERVICE_ROLE", "HIGH", "OBSERVED", `Supabase service_role JWT ${exposure} (${redact(m[0])}). This key bypasses row-level security.`, where(m.index));
      else if (payload.role === "anon") continue; // anon keys are designed to be public
    } catch {
      /* not a decodable JWT */
    }
  }
  for (const m of text.matchAll(ASSIGN_RE)) {
    const value = m[3];
    if (ENV_PLACEHOLDER.test(value) || ENV_PLACEHOLDER.test(m[1]) || /^(true|false|null|undefined)$/i.test(value) || /^[a-z]+([-_ ][a-z]+)*$/.test(value)) continue;
    if (/^(process\.env|import\.meta|os\.environ)/.test(value) || entropy(value) < 3.2) continue;
    add("SECRET_HARDCODED_ASSIGNMENT", clientish ? "MEDIUM" : "LOW", "SOURCE-INDICATED", `${m[1]} is assigned a literal high-entropy value ${exposure} (${redact(value)}). Confirm whether it is a real credential.`, { ...where(m.index), review: true });
  }
  // client-exposed env usage of secret-named vars
  for (const m of text.matchAll(/(?:process\.env|import\.meta\.env)\.((?:NEXT_PUBLIC_|VITE_|REACT_APP_|PUBLIC_|EXPO_PUBLIC_|NUXT_PUBLIC_)[A-Z0-9_]+)/g)) {
    if (SECRETISH_NAME.test(m[1]) && !PUBLIC_OK_NAME.test(m[1])) add("CLIENT_ENV_SECRET_NAME", "HIGH", "SOURCE-INDICATED", `Code reads ${m[1]}, a client-exposed variable with a secret-like name.`, { ...where(m.index), target: m[1] });
  }
  // shipped dev artifacts
  if (inBuild) {
    if (/\.map$/.test(rel)) add("SOURCEMAP_EXPOSED", "MEDIUM", "OBSERVED", `Source map ${rel} is in shipped output. It can expose original source, comments, and file paths.`, { file: rel });
    else if (/[#@]\s*sourceMappingURL=/.test(text) && /\.(m?js|css)$/.test(rel)) add("SOURCEMAP_REFERENCED", "LOW", "OBSERVED", "Shipped file references a source map. Fine if maps are not deployed or are access-restricted.", { file: rel });
    if (/\.(html?|m?js|css|json)$/.test(rel)) {
      for (const m of text.matchAll(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?[^\s"'`)<]*/g)) {
        devHits.set(rel, [...(devHits.get(rel) ?? []), { url: m[0], line: lineAt(text, m.index) }]);
      }
    }
  }
}
for (const [file, hits] of devHits) add("DEV_URL_IN_SHIPPED_OUTPUT", "MEDIUM", "OBSERVED", `${hits.length} localhost URL(s) in shipped output, e.g. ${hits[0].url.slice(0, 60)}. They will fail for visitors and may be scraped as real destinations.`, { file, line: hits[0].line });

// Debug endpoints and dev routes in source (SOURCE-INDICATED only; reachability is not proven here).
for (const { rel } of files) {
  if (/(^|\/)(app|pages|src\/routes|routes|api)\/.*(debug|__test|__dev|phpinfo|graphiql|_seed|_reset)[^/]*(\/|\.)/i.test(rel) && !/\.(test|spec)\./.test(rel) && !/node_modules/.test(rel)) {
    add("DEBUG_ROUTE_PRESENT", "MEDIUM", "SOURCE-INDICATED", `${rel} looks like a debug/test route. Confirm it is not reachable in production and requires authorization.`, { file: rel });
  }
}
for (const legacy of [".env.local", ".env.production"]) if (tracked?.has(legacy)) notes.push(`${legacy} is tracked in git; rotate any secret that has ever been in it, not just delete the file (history keeps it).`);
notes.push(`Scanned ${scanned} text files. Findings with review:true may be intentional public identifiers; verify before rotating.`);
notes.push("A secret found in git history is still exposed after deletion. This scanner reads the working tree only.");
emit("scan-secrets", { root: args.root, filesScanned: scanned, findings, notes }, args.json);
