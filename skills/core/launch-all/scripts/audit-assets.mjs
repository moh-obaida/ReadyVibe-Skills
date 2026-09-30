#!/usr/bin/env node
// audit-assets.mjs - high-impact page-weight risks: oversized images/JS/CSS/fonts, render-blocking scripts,
// unsized images, many third-party origins. It is NOT a performance lab: no LCP/INP/CLS numbers are produced.
//
//   node audit-assets.mjs --url http://localhost:3000 [--render] [--json]
//   node audit-assets.mjs --dir ./dist [--json]

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { parseArgs } from "node:util";
import { emit, finding, usageError } from "./lib/report.mjs";
import { classifyUrl } from "./lib/trackers.mjs";
import { closest, findAll, parseHtml } from "./lib/html.mjs";
import { fetchOnce, loadSite, siteNotRead } from "./lib/pages.mjs";

const { values: args } = parseArgs({
  options: { url: { type: "string" }, dir: { type: "string" }, render: { type: "boolean", default: false }, "max-pages": { type: "string", default: "15" }, timeout: { type: "string", default: "10000" }, "chrome-path": { type: "string" }, json: { type: "boolean", default: false } },
});
if (!args.url && !args.dir) usageError("Usage: audit-assets.mjs --url <site> | --dir <build dir> [--render] [--json]");
const site = await loadSite({ url: args.url, dir: args.dir, render: args.render, maxPages: Number(args["max-pages"]), timeoutMs: Number(args.timeout), chromePath: args["chrome-path"] }).catch((e) => usageError(e.message));

const KB = 1024;
const LIMITS = { image: 300 * KB, heroImage: 500 * KB, js: 250 * KB, css: 100 * KB, font: 150 * KB };
const findings = [];
const notes = [...site.notes];
const unread = siteNotRead(site);
if (unread) findings.push(unread);
const sizeCache = new Map();

async function sizeOf(pagePath, ref) {
  let target;
  try {
    target = new URL(ref, site.origin ?? "http://dir.local");
  } catch {
    return null;
  }
  const isLocal = site.mode === "dir" ? target.hostname === "dir.local" : target.origin === site.origin;
  if (!isLocal) return null;
  const key = target.pathname;
  if (sizeCache.has(key)) return sizeCache.get(key);
  let result = null;
  if (site.mode === "dir") {
    try {
      const abs = join(site.dir, decodeURIComponent(target.pathname));
      const st = statSync(abs);
      const buf = /\.(m?js|css|svg|html?|json)$/i.test(abs) ? readFileSync(abs) : null;
      result = { bytes: st.size, gzip: buf ? gzipSync(buf).length : st.size };
    } catch {
      result = null;
    }
  } else {
    const res = await fetchOnce(target.href, { timeoutMs: Number(args.timeout) });
    if (res.ok && res.status === 200) {
      const encoded = Number(res.headers["content-length"] ?? 0);
      result = { bytes: Buffer.byteLength(res.text ?? ""), gzip: encoded || Buffer.byteLength(res.text ?? ""), compressed: /gzip|br|zstd/i.test(res.headers["content-encoding"] ?? "") };
      if (!/text|json|xml|javascript/i.test(res.contentType ?? "") && encoded) result.bytes = encoded;
    }
  }
  sizeCache.set(key, result);
  return result;
}
const fmt = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}MB` : `${Math.round(b / 1024)}KB`);

for (const page of site.pages.filter((p) => p.status === 200 && p.html)) {
  const tree = parseHtml(page.html);
  const at = (code, severity, evidence, message, extra = {}) => findings.push(finding(code, severity, evidence, message, { page: page.path, ...extra }));
  if (page.spaShell) {
    at("PAGE_NOT_RENDERED", "INFO", "UNKNOWN", "Empty client-rendered shell as served; image and font findings for the real UI are missing. Re-run with --render.");
  }
  const head = findAll(tree, "head")[0];
  const scripts = findAll(tree, (n) => n.tag === "script" && n.attrs.src);
  const blocking = scripts.filter((s) => closest(s, "head") && !("async" in s.attrs) && !("defer" in s.attrs) && (s.attrs.type ?? "") !== "module");
  if (blocking.length) at("RENDER_BLOCKING_SCRIPT", "MEDIUM", "OBSERVED", `${blocking.length} synchronous <script src> in <head> block first paint: ${blocking.slice(0, 3).map((s) => s.attrs.src).join(", ")}.`);
  const origins = new Set();
  for (const el of findAll(tree, (n) => (n.attrs.src || n.attrs.href) && ["script", "link", "img", "iframe", "video", "source"].includes(n.tag))) {
    try {
      const u = new URL(el.attrs.src ?? el.attrs.href, page.finalUrl ?? "http://dir.local/");
      if (/^https?:$/.test(u.protocol) && u.hostname !== "dir.local" && (!site.origin || u.origin !== site.origin) && el.tag !== "a") origins.add(u.hostname);
    } catch {
      /* skip */
    }
  }
  if (origins.size > 6) at("MANY_THIRD_PARTY_ORIGINS", "LOW", "OBSERVED", `${origins.size} third-party origins referenced in markup (${[...origins].slice(0, 6).join(", ")}…). Each adds connection cost and a privacy dependency.`);
  for (const el of findAll(tree, (n) => (["script", "img", "iframe", "video", "audio", "source"].includes(n.tag) && n.attrs.src) || (n.tag === "link" && n.attrs.href && /stylesheet|icon|preload/i.test(n.attrs.rel ?? "")))) {
    const ref = el.attrs.src ?? el.attrs.href;
    if (/^http:\/\//i.test(ref) && !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(ref)) at("INSECURE_SUBRESOURCE", el.tag === "script" || el.tag === "iframe" ? "HIGH" : "MEDIUM", "OBSERVED", `<${el.tag}> loads ${ref} over http://. Browsers block or warn on mixed content, and an attacker on the network can alter it.`, { target: ref });
  }
  for (const s of scripts) {
    try {
      const u = new URL(s.attrs.src, page.finalUrl ?? "http://dir.local/");
      if (u.hostname !== "dir.local" && (!site.origin || u.origin !== site.origin) && !s.attrs.integrity && /(cdn|unpkg|jsdelivr|cdnjs|bootcdn|staticfile|googleapis)/i.test(u.hostname)) at("CDN_SCRIPT_NO_INTEGRITY", "LOW", "OBSERVED", `Script from ${u.hostname} has no integrity attribute; if that CDN is compromised, arbitrary code runs on your site. Pin a version and add integrity + crossorigin, or self-host.`, { target: s.attrs.src });
      if (u.hostname !== "dir.local" && /@latest\b|\/latest\/|@\*/.test(u.pathname)) at("CDN_SCRIPT_UNPINNED", "MEDIUM", "OBSERVED", `Script ${s.attrs.src} floats on a "latest" version, so what you tested is not what visitors run.`, { target: s.attrs.src });
    } catch {
      /* ignore malformed */
    }
  }
  const fontLinks = findAll(tree, (n) => n.tag === "link" && /fonts\.googleapis\.com/.test(n.attrs.href ?? ""));
  for (const l of fontLinks) {
    if (!/display=swap/.test(l.attrs.href)) at("FONT_DISPLAY_NOT_SWAP", "LOW", "OBSERVED", "Google Fonts stylesheet lacks display=swap; text may stay invisible while the font loads.", { target: l.attrs.href });
    if ((l.attrs.href.match(/family=/g) ?? []).length > 3) at("MANY_FONT_FAMILIES", "LOW", "OBSERVED", "More than three font families are requested.", { target: l.attrs.href });
  }
  if (fontLinks.length) at("EXTERNAL_FONT_HOST", "INFO", "OBSERVED", "Fonts load from fonts.googleapis.com / fonts.gstatic.com. Self-hosting removes a third-party request (relevant to performance and to visitor-IP disclosure).");

  const imgs = findAll(tree, "img");
  const unsized = imgs.filter((i) => !(i.attrs.width && i.attrs.height) && !/aspect-ratio|width\s*:|height\s*:/i.test(i.attrs.style ?? ""));
  if (unsized.length) at("IMG_NO_DIMENSIONS", "LOW", "OBSERVED", `${unsized.length} image(s) have no width/height, which causes layout shift while they load.`);
  const eager = imgs.slice(1).filter((i) => i.attrs.loading !== "lazy" && !("fetchpriority" in i.attrs));
  if (eager.length > 6) at("IMG_NOT_LAZY", "LOW", "OBSERVED", `${eager.length} images after the first are not lazy-loaded.`);

  let total = 0;
  const heavy = [];
  const refs = [
    ...imgs.map((i) => ({ kind: "image", ref: i.attrs.src })),
    ...scripts.map((s) => ({ kind: "js", ref: s.attrs.src })),
    ...findAll(tree, (n) => n.tag === "link" && /stylesheet/i.test(n.attrs.rel ?? "")).map((l) => ({ kind: "css", ref: l.attrs.href })),
    ...findAll(tree, (n) => n.tag === "link" && /preload/i.test(n.attrs.rel ?? "") && n.attrs.as === "font").map((l) => ({ kind: "font", ref: l.attrs.href })),
  ].filter((r) => r.ref && !r.ref.startsWith("data:"));
  for (const { kind, ref } of refs) {
    const size = await sizeOf(page.path, ref);
    if (!size) continue;
    total += kind === "image" ? size.bytes : size.gzip;
    const limit = LIMITS[kind];
    const measured = kind === "image" ? size.bytes : size.gzip;
    if (measured > limit && !/\.svg$/i.test(ref)) heavy.push({ kind, ref, size: measured });
  }
  for (const h of heavy) at(`ASSET_OVERSIZED_${h.kind.toUpperCase()}`, h.size > LIMITS[h.kind] * 3 ? "HIGH" : "MEDIUM", "OBSERVED", `${h.kind} ${h.ref} is ${fmt(h.size)}${h.kind === "image" ? "" : " (compressed estimate)"}; the guideline is ${fmt(LIMITS[h.kind])}.`, { target: h.ref });
  if (total > 2.5 * 1024 * KB) at("PAGE_WEIGHT_HIGH", "MEDIUM", "OBSERVED", `Referenced local assets total about ${fmt(total)} for this page.`);
  if (page.path === "/") notes.push(`Home page referenced-asset weight (images raw, JS/CSS compressed estimate): ${fmt(total)}.`);
}
if (site.mode === "url") notes.push("Sizes come from response bodies over the local/preview server; a production CDN may compress and resize differently. Confirm on the deployed URL.");
notes.push("These are lab-style size signals only. They are not Core Web Vitals and do not predict field performance.");
emit("audit-assets", { mode: site.mode, findings, notes }, args.json);
