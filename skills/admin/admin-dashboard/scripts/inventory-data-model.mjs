#!/usr/bin/env node
// inventory-data-model.mjs - what data does this application store, and what is it built with?
//
// Reads database schemas (Prisma, SQL migrations, Drizzle, Mongoose) and package.json, and reports:
//   entities and columns, with hints for personal data, stored secrets, soft-delete/state flags,
//   role columns, owner references; the auth/database/payments/email stack; the UI kit and any admin
//   framework already in use; and existing admin/dashboard routes.
// Static and best-effort. It does not run the app or connect to any database, so it proves that a
// column is DEFINED, never that it is populated. ORMs it cannot read are named as UNKNOWN.
//
//   node inventory-data-model.mjs [--root .] [--json]

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseArgs } from "node:util";
import { emit, finding } from "./lib/report.mjs";

const { values: args } = parseArgs({ options: { root: { type: "string", default: "." }, json: { type: "boolean", default: false } } });
const root = args.root;
const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", ".nuxt", ".svelte-kit", ".output", "coverage", ".vercel", ".turbo"]);

const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[-\s]+/g, "_").toLowerCase();
const PERSONAL = /(^|_)(email|e_mail|phone|mobile|telephone|first_name|last_name|full_name|given_name|family_name|display_name|username|address|street|city|postcode|zip|postal|dob|birth|birthday|date_of_birth|birthdate|gender|ip|ip_address|ssn|passport|national_id|tax_id|lat|lng|latitude|longitude|geo|location|avatar|photo|picture|bio)(_|$)/;
const USER_LIKE_TABLE = /(user|customer|profile|member|contact|lead|subscriber|person|account|student|patient|employee|candidate|applicant)/;
const SECRETISH = /(^|_)(password|passwd|secret|api_key|apikey|access_token|refresh_token|token|private_key)(_|$)/;
const HASHED = /(hash|digest|encrypted|salt)/;
const SOFT_DELETE = /(deleted_at|is_deleted|deleted|archived_at|is_archived|disabled_at|removed_at)$/;
const STATE_FLAG = /^(active|is_active|enabled|is_enabled|status)$/;
const ROLE = /(^|_)(role|roles|is_admin|is_staff|is_superuser|is_super_admin|permissions|scopes?)(_|$)/;
const OWNER = /(^|_)(user_id|owner_id|author_id|account_id|customer_id|org_id|organization_id|tenant_id|created_by)$/;
const PRISMA_SCALARS = new Set(["String", "Int", "BigInt", "Float", "Decimal", "Boolean", "DateTime", "Json", "Bytes"]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const abs = join(dir, e);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(abs, out);
    else if (st.size < 1_000_000) out.push(abs);
  }
  return out;
}

function block(text, openIdx, open = "{", close = "}") {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close && --depth === 0) return text.slice(openIdx + 1, i);
  }
  return text.slice(openIdx + 1);
}

function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function flagsFor(table, column, extra = {}) {
  const c = snake(column);
  const flags = [];
  if (PERSONAL.test(c) || (c === "name" && USER_LIKE_TABLE.test(snake(table)))) flags.push("PERSONAL_DATA_HINT");
  if (SECRETISH.test(c) && !HASHED.test(c)) flags.push("SECRET_HINT");
  if (SOFT_DELETE.test(c)) flags.push("SOFT_DELETE");
  if (STATE_FLAG.test(c)) flags.push("STATE_FLAG");
  if (ROLE.test(c)) flags.push("ROLE");
  if (OWNER.test(c)) flags.push("OWNER_REF");
  if (extra.primary) flags.push("PRIMARY_KEY");
  return flags;
}

const entities = [];
const unsupported = new Set();
const files = walk(root);
const rel = (abs) => relative(root, abs).split(sep).join("/");

for (const abs of files) {
  const path = rel(abs);
  const text = /\.(prisma|sql|[cm]?[jt]sx?)$/.test(abs) ? readFileSync(abs, "utf8") : "";
  if (!text) continue;

  if (abs.endsWith(".prisma")) {
    for (const m of text.matchAll(/^\s*model\s+(\w+)\s*\{/gm)) {
      const body = block(text, m.index + m[0].length - 1);
      const columns = [];
      for (const line of body.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("//") || t.startsWith("@@")) continue;
        const f = t.match(/^(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/);
        if (!f) continue;
        const [, name, type, list, optional, rest] = f;
        if (!PRISMA_SCALARS.has(type) && /@relation/.test(rest)) continue;
        if (!PRISMA_SCALARS.has(type) && /^[A-Z]/.test(type) && !/@/.test(rest) && list) continue;
        columns.push({ name, type: `${type}${list ?? ""}${optional ?? ""}`, flags: flagsFor(m[1], name, { primary: /@id\b/.test(rest) }) });
      }
      entities.push({ name: m[1], source: path, kind: "prisma", columns });
    }
  } else if (abs.endsWith(".sql")) {
    for (const m of text.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?((?:"?\w+"?\.)?"?\w+"?)\s*\(/gi)) {
      const name = m[1].replace(/"/g, "").replace(/^public\./, "");
      const body = block(text, m.index + m[0].length - 1, "(", ")");
      const columns = [];
      for (const item of splitTopLevel(body)) {
        const t = item.trim();
        if (!t || /^(constraint|primary\s+key|foreign\s+key|unique|check|index|exclude)\b/i.test(t)) continue;
        const f = t.match(/^"?(\w+)"?\s+([\w\s()\[\],]+?)(?:\s+(?:not\s+null|null|default|primary|references|unique|check|generated)\b.*)?$/is);
        if (f) columns.push({ name: f[1], type: f[2].trim().split(/\s+/)[0].toLowerCase(), flags: flagsFor(name, f[1], { primary: /primary\s+key/i.test(t) }) });
      }
      entities.push({ name, source: path, kind: "sql", columns });
    }
  } else if (/\b(pg|mysql|sqlite)Table\s*\(/.test(text)) {
    for (const m of text.matchAll(/\b(?:pg|mysql|sqlite)Table\s*\(\s*["'](\w+)["']\s*,\s*\{/g)) {
      const body = block(text, m.index + m[0].length - 1);
      const columns = [];
      for (const c of body.matchAll(/^\s*(\w+)\s*:\s*(\w+)\(\s*["'](\w+)["']/gm)) columns.push({ name: c[3], type: c[2], flags: flagsFor(m[1], c[3], { primary: /primaryKey/.test(body.slice(c.index, c.index + 200).split("\n")[0]) }) });
      entities.push({ name: m[1], source: path, kind: "drizzle", columns });
    }
  } else if (/new\s+(?:mongoose\.)?Schema\s*\(\s*\{/.test(text)) {
    for (const m of text.matchAll(/new\s+(?:mongoose\.)?Schema\s*\(\s*\{/g)) {
      const body = block(text, m.index + m[0].length - 1);
      const columns = [];
      let depth = 0;
      for (const line of body.split("\n")) {
        const k = line.match(/^\s*(\w+)\s*:/);
        if (k && depth === 0) columns.push({ name: k[1], type: "mongoose", flags: flagsFor("", k[1]) });
        depth += (line.match(/[{[]/g) ?? []).length - (line.match(/[}\]]/g) ?? []).length;
      }
      const model = text.slice(m.index).match(/model\(\s*["'](\w+)["']/);
      entities.push({ name: model?.[1] ?? path, source: path, kind: "mongoose", columns });
    }
  }
}

// ---------- stack from package.json ----------
const stack = { frameworks: [], auth: [], database: [], payments: [], email: [], ui: [], adminFrameworks: [], tables: [] };
const pkgPath = join(root, "package.json");
let deps = {};
if (existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    deps = { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    /* unreadable package.json */
  }
}
const has = (re) => Object.keys(deps).filter((d) => re.test(d));
const put = (list, re) => list.push(...has(re));
put(stack.frameworks, /^(next|react|vue|nuxt|svelte|@sveltejs\/kit|astro|remix|@remix-run\/react|vite|express|fastify|hono|@nestjs\/core|laravel)$/);
put(stack.auth, /^(next-auth|@auth\/core|@clerk\/.*|@supabase\/supabase-js|@supabase\/ssr|firebase|firebase-admin|@auth0\/.*|better-auth|lucia|passport|@kinde-oss\/.*)$/);
put(stack.database, /^(prisma|@prisma\/client|drizzle-orm|mongoose|typeorm|sequelize|knex|pg|mysql2|better-sqlite3|@libsql\/client|@neondatabase\/serverless|@planetscale\/database|@supabase\/supabase-js|firebase|firebase-admin|convex)$/);
put(stack.payments, /^(stripe|@stripe\/.*|@paddle\/.*|@lemonsqueezy\/.*|@paypal\/.*)$/);
put(stack.email, /^(resend|@sendgrid\/mail|nodemailer|postmark|mailchimp.*|@mailchimp\/.*|@react-email\/.*|loops)$/);
put(stack.ui, /^(tailwindcss|@radix-ui\/.*|@mui\/material|antd|@chakra-ui\/react|@mantine\/core|bootstrap|react-bootstrap|@headlessui\/react|daisyui|@heroicons\/react|lucide-react|class-variance-authority|@shadcn\/.*|styled-components|@emotion\/react|@ark-ui\/.*|@nextui-org\/.*|@heroui\/.*)$/);
put(stack.adminFrameworks, /^(react-admin|@refinedev\/.*|@adminjs\/.*|adminjs|@strapi\/.*|payload|@payloadcms\/.*|@tremor\/react)$/);
put(stack.tables, /^(@tanstack\/react-table|ag-grid-react|react-data-grid|mantine-react-table)$/);
if (existsSync(join(root, "components.json"))) stack.ui.push("shadcn/ui (components.json)");
for (const f of ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs", "tailwind.config.cjs"]) if (existsSync(join(root, f))) stack.ui.push(f);

// ---------- ORMs and stores we cannot read ----------
for (const d of Object.keys(deps)) {
  if (/^(typeorm|sequelize|knex|@mikro-orm\/.*|firebase|firebase-admin|@aws-sdk\/client-dynamodb|convex)$/.test(d)) unsupported.add(d);
}
if (files.some((f) => /firestore\.rules$/.test(f))) unsupported.add("firestore (collections are schemaless)");

// ---------- existing admin surfaces ----------
const adminRoutes = files
  .map(rel)
  .filter((p) => /(^|\/)(app|pages|src\/routes|src\/pages|routes)\//.test(p) && /(^|\/)(admin|dashboard|backoffice|back-office|manage|staff)(\/|\.[jt]sx?$|\.vue$|\.svelte$|\.astro$)/i.test(p))
  .slice(0, 25);
const apiAdmin = files.map(rel).filter((p) => /api\/.*admin/i.test(p)).slice(0, 15);

// ---------- findings ----------
const findings = [];
const add = (code, severity, evidence, message, extra = {}) => findings.push(finding(code, severity, evidence, message, extra));
for (const e of entities) {
  const personal = e.columns.filter((c) => c.flags.includes("PERSONAL_DATA_HINT")).map((c) => c.name);
  if (personal.length) add("PERSONAL_DATA_COLUMNS", "INFO", "SOURCE-INDICATED", `${e.name} defines personal-data-like columns: ${personal.join(", ")}. Defined is not populated; check the code that writes them.`, { file: e.source, target: e.name });
  for (const c of e.columns.filter((c) => c.flags.includes("SECRET_HINT"))) add("SECRET_LIKE_COLUMN", "MEDIUM", "SOURCE-INDICATED", `${e.name}.${c.name} looks like a stored secret or credential that is not named as hashed or encrypted. Confirm how it is stored, and never show it in an admin UI.`, { file: e.source, target: `${e.name}.${c.name}` });
  const soft = e.columns.filter((c) => c.flags.includes("SOFT_DELETE")).map((c) => c.name);
  if (soft.length) add("SOFT_DELETE_COLUMN", "INFO", "SOURCE-INDICATED", `${e.name} has soft-delete column(s) ${soft.join(", ")}. A soft delete is retention, not deletion; check whether anything purges these rows (data-rights).`, { file: e.source, target: e.name });
}
if (entities.length && !entities.some((e) => e.columns.some((c) => c.flags.includes("ROLE")))) add("NO_ROLE_COLUMN", "INFO", "SOURCE-INDICATED", "No role, is_admin, or permissions column was found in any entity. Admin access would need a role model, or roles held by the auth provider (claims or metadata); check the auth setup before building admin screens.");
if (!entities.length) add("NO_DATA_MODEL_FOUND", "INFO", "UNKNOWN", `No readable schema found (Prisma, SQL migrations, Drizzle, Mongoose). The data model is UNKNOWN${unsupported.size ? `; unreadable stores present: ${[...unsupported].join(", ")}` : ""}. Read the code that queries the database instead.`);
else if (unsupported.size) add("UNREADABLE_DATA_STORES", "INFO", "UNKNOWN", `Also present but not readable by this helper: ${[...unsupported].join(", ")}. Those entities are UNKNOWN until read from code.`);

emit("inventory-data-model", { root: args.root, entities, stack, unsupported: [...unsupported], adminRoutes, adminApiRoutes: apiAdmin, findings, notes: ["Static, best-effort inventory. It shows what is defined, not what is populated, and cannot see schemas held only in a hosted dashboard (for example a Supabase table created in the UI with no migration)."] }, args.json);
