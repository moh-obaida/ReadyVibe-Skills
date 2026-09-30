#!/usr/bin/env node
// check-links.mjs - internal links, nav/footer/CTA targets, canonical targets, sitemap URLs, dead hrefs.
// Distinguishes a CONFIRMED broken route from a transient/unverifiable failure. Zero dependencies.
//
//   node check-links.mjs --url http://localhost:3000 [--render] [--external] [--json]
//   node check-links.mjs --dir ./dist [--json]

import { parseArgs } from "node:util";
import { emit, finding, usageError } from "./lib/report.mjs";
import { accessibleName, closest, findAll, findFirst, parseHtml, textOf } from "./lib/html.mjs";
import { extractLocs, fetchWithRetry, isAssetPath, loadSite, normalizePath } from "./lib/pages.mjs";

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    dir: { type: "string" },
    render: { type: "boolean", default: false },
    external: { type: "boolean", default: false },
    "max-pages": { type: "string", default: "40" },
    "max-external": { type: "string", default: "30" },
    timeout: { type: "string", default: "10000" },
    "chrome-path": { type: "string" },
    json: { type: "boolean", default: false },
  },
});
if (!args.url && !args.dir) usageError("Usage: check-links.mjs --url <site> | --dir <build dir> [--render] [--external] [--json]");

const PLACEHOLDER_HOST = /(^|\.)(example\.(com|org|net)|yourdomain\.\w+|yourwebsite\.\w+|your-?site\.\w+|your-?company\.\w+|domain\.com|website\.com|test\.com|lorem\.\w+)$/i;
const DEV_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|.*\.local|.*\.localhost)$/i;
const STAGING_HOST = /(^|\.)(staging|stage|dev|preview|qa|uat|test)\./i;
const CTA_WORDS = /\b(get started|sign ?up|sign ?in|log ?in|join|start|try|buy|subscribe|book|contact|demo|download|pricing|shop|order|learn more|request)\b/i;
const NOT_FOUND_TEXT = /\b(404|not found|page (?:doesn'?t|does not|cannot|can'?t) (?:exist|be found)|no such page)\b/i;
const PLACEHOLDER_MAIL = /@(example\.(com|org|net)|yourdomain\.\w+|yourcompany\.\w+|email\.com|domain\.com|test\.com|company\.com)$/i;

function linkContext(node) {
  if (closest(node, "footer")) return "footer";
  if (closest(node, (n) => n.tag === "nav" || n.tag === "header")) return "nav";
  const cls = `${node.attrs.class ?? ""} ${node.attrs.role ?? ""}`;
  if (/\b(btn|button|cta)\b/i.test(cls) || CTA_WORDS.test(accessibleName(node))) return "cta";
  return "content";
}

const severityFor = (context, high = "HIGH", low = "MEDIUM") => (context === "content" ? low : high);

const site = await loadSite({
  url: args.url,
  dir: args.dir,
  render: args.render,
  maxPages: Number(args["max-pages"]),
  timeoutMs: Number(args.timeout),
  chromePath: args["chrome-path"],
}).catch((error) => usageError(error.message));

const findings = [];
const notes = [...site.notes];
const hasSpa = site.pages.some((p) => p.spaShell);
const targetCache = new Map(); // key -> Promise<result>
const occurrences = new Map(); // `${code}|${target}` -> { finding, pages:Set }

function record(code, severity, evidence, message, { page, target, context }) {
  const key = `${code}|${target ?? ""}`;
  const hit = occurrences.get(key);
  if (hit) {
    hit.pages.add(page);
    if (["HIGH", "MEDIUM", "LOW", "INFO"].indexOf(severity) < ["HIGH", "MEDIUM", "LOW", "INFO"].indexOf(hit.finding.severity)) hit.finding.severity = severity;
    return;
  }
  const f = finding(code, severity, evidence, message, { page, target, context });
  occurrences.set(key, { finding: f, pages: new Set([page]) });
  findings.push(f);
}

async function checkInternal(pathname, search = "") {
  const key = `${pathname}${search}`;
  if (targetCache.has(key)) return targetCache.get(key);
  const job = (async () => {
    if (site.mode === "dir") {
      const p = normalizePath(pathname);
      const found = site.known.has(p) || site.known.has(`${p}.html`) || site.known.has(`${p}/index.html`) || site.known.has(pathname);
      if (found) return { state: "ok" };
      return hasSpa ? { state: "unverified", reason: "static directory has client-rendered pages; route may be handled by JavaScript or hosting rewrites" } : { state: "broken", status: 404 };
    }
    const res = await fetchWithRetry(new URL(`${pathname}${search}`, site.origin).href, { timeoutMs: Number(args.timeout) }, 1);
    if (!res.ok) return { state: "unverified", reason: res.error };
    if (res.status === 404 || res.status === 410) return { state: "broken", status: res.status };
    if (res.status === 401 || res.status === 403) return { state: "protected", status: res.status };
    if (res.status >= 500) return { state: "unverified", reason: `HTTP ${res.status}` };
    if (res.status >= 400) return { state: "broken", status: res.status };
    let soft = false;
    if (/html/i.test(res.contentType ?? "") && res.text) {
      const tree = parseHtml(res.text);
      const title = textOf(findFirst(tree, "title") ?? { tag: "#text", text: "" });
      const h1 = textOf(findFirst(tree, "h1") ?? { tag: "#text", text: "" });
      soft = NOT_FOUND_TEXT.test(title) || NOT_FOUND_TEXT.test(h1);
    }
    return { state: soft ? "soft404" : "ok", status: res.status, hops: res.chain.length };
  })();
  targetCache.set(key, job);
  return job;
}

async function checkExternal(url) {
  if (targetCache.has(url)) return targetCache.get(url);
  const job = (async () => {
    let res = await fetchWithRetry(url, { method: "HEAD", timeoutMs: Number(args.timeout) }, 1);
    if (!res.ok || res.status === 405 || res.status === 403 || res.status === 501) res = await fetchWithRetry(url, { timeoutMs: Number(args.timeout) }, 0);
    if (!res.ok) return { state: "unverified", reason: res.error };
    if (res.status === 404 || res.status === 410) return { state: "broken", status: res.status };
    if ([401, 403, 429, 999].includes(res.status) || res.status >= 500) return { state: "unverified", reason: `HTTP ${res.status} (bot protection or transient)` };
    return { state: "ok", status: res.status };
  })();
  targetCache.set(url, job);
  return job;
}

const pending = [];
let externalChecked = 0;
const externalTargets = new Set();

for (const page of site.pages) {
  if (page.status !== 200 || !page.html) continue;
  const tree = parseHtml(page.html);
  const ids = new Set();
  for (const n of findAll(tree, (x) => x.attrs.id || (x.tag === "a" && x.attrs.name))) ids.add(n.attrs.id ?? n.attrs.name);

  for (const a of findAll(tree, (n) => n.tag === "a")) {
    const href = (a.attrs.href ?? "").trim();
    const context = linkContext(a);
    const label = accessibleName(a).slice(0, 60);
    if (!("href" in a.attrs) || href === "" || href === "#" || /^javascript:/i.test(href)) {
      if ("href" in a.attrs || context !== "content") {
        record("LINK_DEAD_HREF", severityFor(context, "MEDIUM", "LOW"), "SOURCE-INDICATED", `Link "${label}" has no real destination (${href === "" ? "empty href" : href || "no href"}). A script may handle the click; verify in a browser.`, { page: page.path, target: href || "(none)", context });
      }
      continue;
    }
    if (/^mailto:/i.test(href)) {
      const addr = href.replace(/^mailto:/i, "").split("?")[0];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) record("LINK_MAILTO_INVALID", "MEDIUM", "OBSERVED", `mailto target "${addr}" is not a valid address.`, { page: page.path, target: href, context });
      else if (PLACEHOLDER_MAIL.test(addr)) record("LINK_PLACEHOLDER_TARGET", "MEDIUM", "OBSERVED", `mailto address ${addr} looks like a placeholder.`, { page: page.path, target: href, context });
      continue;
    }
    if (/^tel:/i.test(href)) {
      if (/(?:^|\D)(?:123[-\s.]?456|555[-\s.]?01|000[-\s.]?000|1234567890)/.test(href)) record("LINK_PLACEHOLDER_TARGET", "LOW", "OBSERVED", `tel target ${href} looks like a placeholder number.`, { page: page.path, target: href, context });
      continue;
    }
    if (href.startsWith("#")) {
      const frag = decodeURIComponent(href.slice(1));
      if (!page.spaShell && frag && !ids.has(frag) && frag !== "top") record("LINK_FRAGMENT_MISSING", "LOW", "OBSERVED", `Anchor ${href} has no element with that id on the page.`, { page: page.path, target: href, context });
      continue;
    }
    let target;
    try {
      target = new URL(href, page.finalUrl ?? `http://dir.local${page.path}`);
    } catch {
      record("LINK_MALFORMED", "MEDIUM", "OBSERVED", `href "${href}" is not a valid URL.`, { page: page.path, target: href, context });
      continue;
    }
    if (!/^https?:$/.test(target.protocol)) continue;
    const isInternal = site.mode === "dir" ? target.hostname === "dir.local" : target.origin === site.origin;
    if (!isInternal) {
      if (DEV_HOST.test(target.hostname) || STAGING_HOST.test(target.hostname)) {
        record("LINK_DEV_HOST", "HIGH", "OBSERVED", `Link points at a development/staging host (${target.hostname}).`, { page: page.path, target: target.href, context });
        continue;
      }
      if (PLACEHOLDER_HOST.test(target.hostname)) {
        record("LINK_PLACEHOLDER_TARGET", severityFor(context), "OBSERVED", `Link points at a placeholder host (${target.hostname}).`, { page: page.path, target: target.href, context });
        continue;
      }
      if (target.protocol === "http:") record("LINK_INSECURE_SCHEME", "LOW", "OBSERVED", "External link uses http://.", { page: page.path, target: target.href, context });
      externalTargets.add(target.href);
      if (args.external && externalChecked < Number(args["max-external"]) && !targetCache.has(target.href)) {
        externalChecked++;
        pending.push(
          checkExternal(target.href).then((r) => {
            if (r.state === "broken") record("LINK_BROKEN_EXTERNAL", severityFor(context, "MEDIUM", "LOW"), "OBSERVED", `External link returned HTTP ${r.status}.`, { page: page.path, target: target.href, context });
            else if (r.state === "unverified") record("LINK_UNVERIFIED", "INFO", "UNKNOWN", `External link could not be verified: ${r.reason}. This is not evidence that it is broken.`, { page: page.path, target: target.href, context });
          }),
        );
      }
      continue;
    }
    if (isAssetPath(target.pathname) && site.mode === "dir") {
      if (!site.known.has(target.pathname)) record("LINK_BROKEN", severityFor(context), "OBSERVED", `File ${target.pathname} does not exist in the build directory.`, { page: page.path, target: target.pathname, context });
      continue;
    }
    pending.push(
      checkInternal(target.pathname, site.mode === "url" ? target.search : "").then((r) => {
        const shown = target.pathname + (target.search ?? "");
        if (r.state === "broken") record("LINK_BROKEN", severityFor(context), "OBSERVED", `${context} link "${label}" → ${shown} is a confirmed broken route${r.status ? ` (HTTP ${r.status})` : ""}.`, { page: page.path, target: shown, context });
        else if (r.state === "soft404") record("LINK_SOFT_404", "MEDIUM", "OBSERVED", `${shown} returns HTTP 200 but its title or heading says the page was not found. Real unknown routes should return 404.`, { page: page.path, target: shown, context });
        else if (r.state === "unverified") record("LINK_UNVERIFIED", "INFO", "UNKNOWN", `${shown} could not be verified: ${r.reason}. This is not evidence that it is broken.`, { page: page.path, target: shown, context });
        else if (r.hops > 2) record("LINK_REDIRECT_CHAIN", "LOW", "OBSERVED", `${shown} redirects ${r.hops} times before resolving.`, { page: page.path, target: shown, context });
      }),
    );
  }

  for (const form of findAll(tree, (n) => n.tag === "form" && n.attrs.action)) {
    const action = form.attrs.action.trim();
    if (/^(#|javascript:)/i.test(action)) continue;
    try {
      const t = new URL(action, page.finalUrl ?? `http://dir.local${page.path}`);
      if (DEV_HOST.test(t.hostname) && t.hostname !== "dir.local" && (site.mode === "dir" || t.origin !== site.origin)) record("LINK_DEV_HOST", "HIGH", "OBSERVED", `Form posts to a development host (${t.hostname}).`, { page: page.path, target: t.href, context: "form" });
      else if (PLACEHOLDER_HOST.test(t.hostname) || /YOUR_[A-Z_]*ID|FORM_ID|xxxxxxxx/i.test(action)) record("LINK_PLACEHOLDER_TARGET", "HIGH", "OBSERVED", `Form action looks like an unfinished placeholder (${action}).`, { page: page.path, target: action, context: "form" });
    } catch {
      /* ignore malformed form action */
    }
  }
}

// Canonical and sitemap targets.
for (const page of site.pages) {
  if (!page.html) continue;
  const canon = findFirst(parseHtml(page.html), (n) => n.tag === "link" && (n.attrs.rel ?? "").toLowerCase().split(/\s+/).includes("canonical"));
  if (!canon?.attrs.href) continue;
  try {
    const t = new URL(canon.attrs.href, page.finalUrl ?? `http://dir.local${page.path}`);
    pending.push(
      checkInternal(t.pathname, "").then((r) => {
        if (r.state === "broken") record("CANONICAL_TARGET_BROKEN", "HIGH", "OBSERVED", `Canonical ${canon.attrs.href} points to a path that returns ${r.status ?? 404} on the inspected site.`, { page: page.path, target: t.pathname, context: "canonical" });
      }),
    );
  } catch {
    /* malformed canonical is reported by inspect-metadata */
  }
}
for (const map of site.sitemaps) {
  if (!map.text || /<sitemapindex/i.test(map.text)) continue;
  for (const loc of extractLocs(map.text)) {
    let pathname;
    try {
      pathname = new URL(loc).pathname;
    } catch {
      continue;
    }
    pending.push(
      checkInternal(pathname, "").then((r) => {
        if (r.state === "broken") record("SITEMAP_URL_BROKEN", "HIGH", "OBSERVED", `Sitemap lists ${loc}, but ${pathname} returns ${r.status ?? 404} on the inspected site.`, { page: map.url, target: loc, context: "sitemap" });
        else if (r.state === "soft404") record("SITEMAP_URL_BROKEN", "MEDIUM", "OBSERVED", `Sitemap lists ${loc}, which serves a not-found page with HTTP 200.`, { page: map.url, target: loc, context: "sitemap" });
      }),
    );
  }
}

await Promise.all(pending);
for (const { finding: f, pages } of occurrences.values()) {
  f.pages = [...pages].slice(0, 6);
  f.count = pages.size;
}
if (!args.external) notes.push(`${externalTargets.size} external link(s) were not fetched. Re-run with --external to check them (failures there are reported as unverified, not broken, unless the server answers 404/410).`);
if (site.mode === "dir" && hasSpa) notes.push("Static mode cannot confirm client-routed links as broken; they are reported as unverified. Serve the build and pass --url with --render for a definitive result.");
const covered = site.pages.filter((p) => p.status === 200 && p.html).length;
emit("check-links", { mode: site.mode, pagesChecked: covered, findings, notes }, args.json);
