// Loads the pages of a site for the ReadyVibe helper scripts, from one of:
//   url mode  - a running site (local dev server, preview deploy, or production)
//   dir mode  - a static build output directory (dist/, out/, build/, public/)
// Optional --render uses a headless browser so client-rendered (SPA) pages are read after
// JavaScript ran. Without it, SPA pages are read as served and flagged `spaShell`.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { launchBrowser } from "./browser.mjs";
import { findAll, parseHtml, textOf } from "./html.mjs";

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", ".vercel", ".netlify", ".cache"]);
const ASSET_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|json|xml|txt|pdf|zip|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|webmanifest)$/i;

/** Hosts where submitting a test form cannot create real-world records: loopback and reserved dev/test names. */
export function isLocalHost(hostname) {
  return /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|::1|.*\.localhost|.*\.test)$/i.test(hostname);
}

export function isAssetPath(pathname) {
  return ASSET_EXT.test(pathname);
}

export function normalizePath(pathname) {
  let p = pathname.replace(/\/{2,}/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

export function looksLikeSpaShell(html) {
  const root = parseHtml(html);
  const body = findAll(root, "body")[0];
  if (!body) return false;
  const text = textOf(body);
  const hasMount = findAll(root, (n) => n.tag === "div" && ["root", "app", "__next", "__nuxt", "svelte"].includes(n.attrs.id ?? "")).length > 0;
  const elements = findAll(body, (n) => !["script", "style", "noscript", "div", "span"].includes(n.tag)).length;
  return hasMount && text.length < 80 && elements < 3;
}

export async function fetchOnce(url, { method = "GET", timeoutMs = 10000, maxHops = 6, headers = {} } = {}) {
  let current = url;
  const chain = [];
  for (let hop = 0; hop <= maxHops; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(current, {
        method,
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "ReadyVibe-check/0.1 (+launch-readiness helper)", accept: "text/html,application/xhtml+xml,*/*;q=0.8", ...headers },
      });
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        chain.push({ url: current, status: res.status });
        current = new URL(location, current).href;
        continue;
      }
      const contentType = res.headers.get("content-type") ?? "";
      const text = method === "HEAD" || !/text|xml|json|html/i.test(contentType) ? "" : await res.text();
      return { ok: true, status: res.status, finalUrl: current, chain, headers: Object.fromEntries(res.headers), contentType, text };
    } catch (error) {
      return { ok: false, status: 0, finalUrl: current, chain, error: error?.name === "AbortError" ? "timeout" : (error?.cause?.code ?? error?.message ?? "network error") };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status: 0, finalUrl: current, chain, error: "too many redirects" };
}

/** Fetch with retries for transient failures. 5xx and network errors are retried; 4xx are not. */
export async function fetchWithRetry(url, options = {}, retries = 1) {
  let result = await fetchOnce(url, options);
  for (let attempt = 0; attempt < retries && (!result.ok || result.status >= 500); attempt++) {
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    result = await fetchOnce(url, options);
  }
  return result;
}

export function extractLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([\s\S]*?)\s*<\/loc>/gi;
  let m;
  while ((m = re.exec(xml))) locs.push(m[1].replace(/&amp;/g, "&").replace(/<!\[CDATA\[|\]\]>/g, "").trim());
  return locs;
}

function parseRobotsSitemaps(text) {
  return [...text.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
}

function walkDir(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) walkDir(abs, out);
    else out.push(abs);
  }
  return out;
}

export function loadDirSite(dir) {
  const root = resolve(dir);
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error(`--dir is not a directory: ${dir}`);
  const files = walkDir(root);
  const pages = [];
  const known = new Set();
  for (const abs of files) {
    const rel = relative(root, abs).split(sep).join("/");
    known.add(`/${rel}`);
    if (!/\.html?$/i.test(rel)) continue;
    let path = `/${rel}`.replace(/\/index\.html?$/i, "/").replace(/\.html?$/i, "");
    path = normalizePath(path);
    const html = readFileSync(abs, "utf8");
    pages.push({ url: path, path, status: 200, file: rel, html, headers: {}, spaShell: looksLikeSpaShell(html) });
    known.add(path);
    if (/index\.html?$/i.test(rel)) known.add(normalizePath(`/${rel}`.replace(/\/index\.html?$/i, "/")));
  }
  const read = (name) => (existsSync(join(root, name)) ? readFileSync(join(root, name), "utf8") : null);
  const robotsText = read("robots.txt");
  const sitemapText = read("sitemap.xml");
  return {
    mode: "dir",
    origin: null,
    dir: root,
    pages,
    known,
    robots: { status: robotsText === null ? 404 : 200, text: robotsText ?? "", url: "robots.txt" },
    sitemaps: sitemapText === null ? [] : [{ url: "sitemap.xml", status: 200, text: sitemapText }],
    notes: pages.some((p) => p.spaShell) ? ["Some pages are empty client-rendered shells. A static directory cannot show their links or metadata; run against a served URL with --render."] : [],
  };
}

async function renderPages(urls, chromePath) {
  const { browser } = await launchBrowser({ chromePath });
  const out = new Map();
  try {
    const context = await browser.newContext();
    for (const url of urls) {
      const page = await context.newPage();
      try {
        const res = await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
        out.set(url, { status: res?.status() ?? 0, html: await page.content(), finalUrl: page.url() });
      } catch (error) {
        out.set(url, { status: 0, html: "", error: error.message.split("\n")[0] });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  return out;
}

export async function loadUrlSite(baseUrl, { maxPages = 40, timeoutMs = 10000, render = false, chromePath, extraPaths = [] } = {}) {
  const base = new URL(baseUrl);
  const origin = base.origin;
  const notes = [];
  const robotsRes = await fetchWithRetry(new URL("/robots.txt", origin).href, { timeoutMs }, 1);
  const robots = { status: robotsRes.status, text: robotsRes.ok && robotsRes.status === 200 ? robotsRes.text : "", url: new URL("/robots.txt", origin).href, error: robotsRes.error };

  // Sitemaps: robots.txt declarations first, then /sitemap.xml. Declared hosts may be the production
  // host while we inspect localhost, so we request the same path on the origin being inspected.
  const sitemapPaths = new Set(["/sitemap.xml"]);
  for (const declared of parseRobotsSitemaps(robots.text)) {
    try {
      sitemapPaths.add(new URL(declared).pathname);
    } catch {
      /* invalid declaration is reported by inspect-metadata */
    }
  }
  const sitemaps = [];
  const queue = [...sitemapPaths];
  const seenMaps = new Set();
  while (queue.length && seenMaps.size < 10) {
    const path = queue.shift();
    if (seenMaps.has(path)) continue;
    seenMaps.add(path);
    const url = new URL(path, origin).href;
    const res = await fetchWithRetry(url, { timeoutMs }, 1);
    const entry = { url, status: res.status, text: res.ok && res.status === 200 ? res.text : "", error: res.error };
    sitemaps.push(entry);
    if (entry.text && /<sitemapindex/i.test(entry.text)) {
      for (const loc of extractLocs(entry.text)) {
        try {
          queue.push(new URL(loc).pathname);
        } catch {
          /* skip */
        }
      }
    }
  }

  const start = ["/", ...extraPaths];
  for (const s of sitemaps) {
    if (!s.text || /<sitemapindex/i.test(s.text)) continue;
    for (const loc of extractLocs(s.text)) {
      try {
        start.push(new URL(loc).pathname);
      } catch {
        /* skip */
      }
    }
  }

  const pages = [];
  const seen = new Set();
  const frontier = start.map(normalizePath);
  while (frontier.length && pages.length < maxPages) {
    const path = frontier.shift();
    if (seen.has(path) || isAssetPath(path)) continue;
    seen.add(path);
    const url = new URL(path, origin).href;
    const res = await fetchWithRetry(url, { timeoutMs }, 1);
    const isHtml = /html/i.test(res.contentType ?? "");
    const page = { url, path, status: res.status, finalUrl: res.finalUrl, chain: res.chain, headers: res.headers ?? {}, html: isHtml ? res.text : "", error: res.error, spaShell: isHtml && looksLikeSpaShell(res.text) };
    pages.push(page);
    if (!isHtml) continue;
    for (const a of findAll(parseHtml(res.text), (n) => n.tag === "a" && n.attrs.href)) {
      try {
        const target = new URL(a.attrs.href, res.finalUrl);
        if (target.origin === origin && !isAssetPath(target.pathname) && !/^(mailto|tel|javascript):/i.test(a.attrs.href)) frontier.push(normalizePath(target.pathname));
      } catch {
        /* malformed href reported by check-links */
      }
    }
  }
  if (frontier.length && pages.length >= maxPages) notes.push(`Stopped at --max-pages ${maxPages}; more pages exist.`);

  if (render) {
    const rendered = await renderPages(pages.filter((p) => p.status === 200).map((p) => p.url), chromePath);
    for (const page of pages) {
      const r = rendered.get(page.url);
      if (r?.html) {
        page.html = r.html;
        page.spaShell = false;
        page.rendered = true;
      }
    }
    notes.push("Pages were read after JavaScript ran (--render).");
  } else if (pages.some((p) => p.spaShell)) {
    notes.push("Some pages are empty client-rendered shells as served. Re-run with --render to read them after JavaScript runs.");
  }
  return { mode: "url", origin, pages, robots, sitemaps: sitemaps.filter((s) => s.status !== 404 || s.url.endsWith("/sitemap.xml")), notes };
}

export async function loadSite(opts) {
  if (opts.dir) return loadDirSite(opts.dir);
  if (opts.url) return loadUrlSite(opts.url, opts);
  throw new Error("Pass --url <site> or --dir <static build directory>.");
}
