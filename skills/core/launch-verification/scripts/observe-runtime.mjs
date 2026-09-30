#!/usr/bin/env node
// observe-runtime.mjs - drive a real (headless) browser through a scripted sequence and record what the
// site ACTUALLY does: cookies, storage, network destinations, planted-data leakage, consent-choice effects,
// horizontal overflow, small touch targets, keyboard focus. It does not call any AI model.
//
//   node observe-runtime.mjs --url http://localhost:3000 [--steps steps.json] [--viewport 375x812]
//        [--canary] [--block-third-party] [--screenshots ./shots] [--allow-live-submit] [--json]
//        [--fail "**/api/items=500"] [--fail "**/api/x=abort"] [--delay "**/api/items=4000"]
//
// steps.json is an array of:
//   {"do":"snapshot","label":"initial","expect":"no-new-nonessential" | "some-tracking"}
//   {"do":"click","text":"Reject all"} | {"do":"click","selector":"#reject"}
//   {"do":"fill","selector":"input[name=email]","value":"$CANARY_EMAIL"}    ($CANARY_NAME/_PHONE/_TEXT too)
//   {"do":"submit","selector":"form"}       (refused on non-local origins unless --allow-live-submit)
//   {"do":"goto","path":"/pricing"} | {"do":"reload"} | {"do":"wait","ms":800}
//   {"do":"resize","width":375,"height":812} | {"do":"tab","times":10} | {"do":"screenshot","name":"home"}
//   {"do":"offline","on":true}   (simulate losing the network; use false to restore)
//
// --fail and --delay force failure states so loading/error/recovery UI can be observed (failure-resilience).
//
// The output reports FACTS. It does not decide whether consent was legally required: findings that depend
// on jurisdiction or purpose carry review:true. Requires Playwright (see lib/browser.mjs); no static fallback.

import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { launchBrowser } from "./lib/browser.mjs";
import { findPlanted, plantIdentity } from "./lib/canary.mjs";
import { emit, finding, usageError } from "./lib/report.mjs";
import { isLocalHost } from "./lib/pages.mjs";
import { NON_ESSENTIAL_CATEGORIES, TRACKING_COOKIE_HINT, classifyUrl } from "./lib/trackers.mjs";

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    steps: { type: "string" },
    viewport: { type: "string", default: "1280x800" },
    canary: { type: "boolean", default: false },
    "block-third-party": { type: "boolean", default: false },
    fail: { type: "string", multiple: true, default: [] },
    delay: { type: "string", multiple: true, default: [] },
    "allow-live-submit": { type: "boolean", default: false },
    screenshots: { type: "string" },
    settle: { type: "string", default: "1500" },
    "chrome-path": { type: "string" },
    json: { type: "boolean", default: false },
  },
});
if (!args.url) usageError("Usage: observe-runtime.mjs --url <site> [--steps steps.json] [--viewport WxH] [--canary] [--block-third-party] [--json]");

const base = new URL(args.url);
const isLocalOrigin = isLocalHost(base.hostname);
const [vw, vh] = args.viewport.split("x").map(Number);
const identity = args.canary ? plantIdentity() : null;
const steps = args.steps ? JSON.parse(readFileSync(args.steps, "utf8")) : [];
const settleMs = Number(args.settle);
const findings = [];
const notes = [];
const add = (code, severity, evidence, message, extra = {}) => findings.push(finding(code, severity, evidence, message, extra));

let browser;
try {
  ({ browser } = await launchBrowser({ chromePath: args["chrome-path"] }));
} catch (error) {
  usageError(error.message);
}

const context = await browser.newContext({ viewport: { width: vw, height: vh }, ...(vw <= 500 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
const page = await context.newPage();
const requests = [];
const failures = [];
const consoleErrors = [];
let cursor = 0;

const originOf = (u) => {
  try {
    return new URL(u).origin;
  } catch {
    return "";
  }
};
context.on("request", (req) => {
  const url = req.url();
  if (!/^https?:/i.test(url)) return;
  const post = req.postData();
  requests.push({ method: req.method(), url, host: new URL(url).hostname, resourceType: req.resourceType(), thirdParty: originOf(url) !== base.origin, postData: post ? post.slice(0, 20000) : "", referer: req.headers().referer ?? "", vendor: classifyUrl(url) });
});
context.on("response", (res) => {
  if (res.status() >= 400) failures.push({ url: res.url(), status: res.status() });
});
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 200)}`));
if (args["block-third-party"]) {
  await context.route("**/*", (route) => (originOf(route.request().url()) === base.origin || !/^https?:/i.test(route.request().url()) ? route.continue() : route.fulfill({ status: 204, body: "" })));
  notes.push("--block-third-party: third-party requests were recorded but answered with an empty 204, so scripts they would have loaded did not run. This shows what the page ATTEMPTS to contact; follow-on behavior is not observed.");
}

for (const spec of args.fail) {
  const at = spec.lastIndexOf("=");
  const [pattern, mode] = at > 0 ? [spec.slice(0, at), spec.slice(at + 1)] : [spec, "abort"];
  await context.route(pattern, (route) => (mode === "abort" ? route.abort("failed") : route.fulfill({ status: Number(mode) || 500, contentType: "application/json", body: JSON.stringify({ error: "forced failure (observe-runtime)" }) })));
  notes.push(`Forced failure: ${pattern} → ${mode}`);
}
for (const spec of args.delay) {
  const at = spec.lastIndexOf("=");
  const [pattern, ms] = [spec.slice(0, at), Number(spec.slice(at + 1))];
  await context.route(pattern, async (route) => {
    await new Promise((r) => setTimeout(r, ms));
    await route.continue();
  });
  notes.push(`Forced delay: ${pattern} +${ms}ms`);
}

// ---------- state capture ----------
async function captureState(label, expect) {
  const cookies = (await context.cookies()).map((c) => ({ name: c.name, domain: c.domain, thirdParty: !c.domain.replace(/^\./, "").endsWith(base.hostname.replace(/^www\./, "")), session: c.expires === -1, days: c.expires === -1 ? null : Math.round((c.expires - Date.now() / 1000) / 86400), secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite, trackingName: TRACKING_COOKIE_HINT.test(c.name) }));
  const deviceWidth = page.viewportSize()?.width ?? vw;
  const inPage = await page.evaluate((deviceWidth) => {
    const dump = (s) => {
      const out = [];
      try {
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          const v = s.getItem(k) ?? "";
          // Show only clearly non-secret values (a consent choice like "accepted"); anything token-shaped is redacted.
          const tokenLike = /^[A-Za-z0-9_\-+/=.:]{16,}$/.test(v) || /@|eyJ/.test(v);
          out.push({ key: k, length: v.length, value: v.length <= 40 && !tokenLike ? v : null });
        }
      } catch {
        /* storage blocked */
      }
      return out;
    };
    const vw = deviceWidth;
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (r.width > 0 && r.right > vw + 1 && style.position !== "fixed" && style.visibility !== "hidden" && style.display !== "none") {
        offenders.push({ tag: el.tagName.toLowerCase(), id: el.id || null, cls: String(el.className?.baseVal ?? el.className ?? "").slice(0, 50), right: Math.round(r.right) });
        if (offenders.length >= 40) break;
      }
    }
    const small = [];
    for (const el of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link]")) {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none" && (r.width < 24 || r.height < 24)) small.push({ tag: el.tagName.toLowerCase(), text: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("name") || "").trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
    }
    const covering = [];
    for (const el of document.querySelectorAll("body *")) {
      const st = getComputedStyle(el);
      if ((st.position === "fixed" || st.position === "sticky") && st.display !== "none" && st.visibility !== "hidden") {
        const r = el.getBoundingClientRect();
        if (r.height > innerHeight * 0.25 && r.width > innerWidth * 0.5) covering.push({ tag: el.tagName.toLowerCase(), id: el.id || null, heightPct: Math.round((r.height / innerHeight) * 100) });
      }
    }
    const ui = [];
    const bannerRe = /cookie|consent|privacy|tracking|your choices/i;
    const buttonRe = /accept|agree|allow|reject|decline|deny|refuse|only (necessary|essential)|manage|preferences|customi[sz]e|settings|got it|ok/i;
    for (const box of document.querySelectorAll("div, section, aside, dialog, [role=dialog], form")) {
      const r = box.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || getComputedStyle(box).visibility === "hidden") continue;
      const text = (box.innerText || "").slice(0, 400);
      if (!bannerRe.test(text) || text.length > 350) continue;
      const buttons = [...box.querySelectorAll("button, a, [role=button], input[type=button], input[type=submit]")].map((b) => (b.innerText || b.value || b.getAttribute("aria-label") || "").trim()).filter((t) => t && buttonRe.test(t));
      if (buttons.length) {
        ui.push({ text: text.replace(/\s+/g, " ").slice(0, 120), buttons: [...new Set(buttons)].slice(0, 6) });
        break;
      }
    }
    return { local: dump(localStorage), session: dump(sessionStorage), scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, hasViewportMeta: !!document.querySelector('meta[name=viewport]'), innerHeight, offenders, small, covering, consentUi: ui[0] ?? null, url: location.href };
  }, deviceWidth);
  const idb = await page.evaluate(async () => (indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : [])).catch(() => []);
  const windowRequests = requests.slice(cursor);
  cursor = requests.length;
  return { label, expect, url: inPage.url, viewport: { width: deviceWidth, layoutWidth: inPage.innerWidth, height: inPage.innerHeight }, hasViewportMeta: inPage.hasViewportMeta, cookies, localStorage: inPage.local, sessionStorage: inPage.session, indexedDb: idb, newRequests: windowRequests, scrollWidth: inPage.scrollWidth, overflowX: Math.max(inPage.scrollWidth, inPage.innerWidth) > deviceWidth + 1, overflowOffenders: inPage.offenders.slice(0, 5), smallTargets: inPage.small, stickyCovering: inPage.covering, consentUi: inPage.consentUi };
}

const snapshots = [];
const steplog = [];
const canaryEnv = identity ? { $CANARY_EMAIL: identity.email, $CANARY_NAME: identity.name, $CANARY_PHONE: identity.phone, $CANARY_TEXT: identity.text } : {};
const subst = (v) => (typeof v === "string" ? Object.entries(canaryEnv).reduce((s, [k, val]) => s.replaceAll(k, val), v) : v);
const focusSamples = [];
let submitted = false;

async function locate(step) {
  if (step.selector) return page.locator(step.selector).first();
  if (step.text) {
    const byRole = page.getByRole("button", { name: new RegExp(step.text, "i") });
    if (await byRole.count()) return byRole.first();
    const byLink = page.getByRole("link", { name: new RegExp(step.text, "i") });
    if (await byLink.count()) return byLink.first();
    return page.getByText(new RegExp(step.text, "i")).first();
  }
  throw new Error("step needs selector or text");
}

try {
  await page.goto(args.url, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(settleMs);
  snapshots.push(await captureState("initial"));

  for (const step of steps) {
    const entry = { step };
    try {
      switch (step.do) {
        case "snapshot":
          await page.waitForTimeout(Math.min(settleMs, 1200));
          snapshots.push(await captureState(step.label ?? `snapshot-${snapshots.length}`, step.expect));
          break;
        case "click":
          await (await locate(step)).click({ timeout: 8000 });
          await page.waitForTimeout(400);
          break;
        case "fill":
          await page.locator(step.selector).first().fill(String(subst(step.value)), { timeout: 8000 });
          break;
        case "submit": {
          if (!isLocalOrigin && !args["allow-live-submit"]) {
            entry.skipped = "Refused: submitting a form on a non-local origin can create real-world records or send real email. Re-run against localhost/staging, or pass --allow-live-submit if the owner authorized it.";
            break;
          }
          const form = page.locator(step.selector ?? "form").first();
          await form.evaluate((f) => (f.requestSubmit ? f.requestSubmit() : f.submit()));
          submitted = true;
          await page.waitForTimeout(1200);
          entry.afterSubmit = { url: page.url(), visibleStatusText: (await page.locator('[role=alert], [role=status], .error, .success, [class*=error], [class*=success], [class*=toast]').allInnerTexts().catch(() => [])).map((t) => t.trim()).filter(Boolean).slice(0, 4) };
          break;
        }
        case "goto":
          await page.goto(new URL(step.path, args.url).href, { waitUntil: "load", timeout: 30000 });
          await page.waitForTimeout(settleMs);
          break;
        case "reload":
          await page.reload({ waitUntil: "load" });
          await page.waitForTimeout(settleMs);
          break;
        case "wait":
          await page.waitForTimeout(Number(step.ms ?? 500));
          break;
        case "offline":
          await context.setOffline(step.on !== false);
          break;
        case "resize":
          await page.setViewportSize({ width: step.width, height: step.height });
          await page.waitForTimeout(300);
          break;
        case "screenshot":
          if (args.screenshots) {
            mkdirSync(args.screenshots, { recursive: true });
            await page.screenshot({ path: join(args.screenshots, `${step.name ?? "shot"}.png`), fullPage: step.fullPage ?? false });
          }
          break;
        case "tab": {
          for (let i = 0; i < (step.times ?? 5); i++) {
            await page.keyboard.press("Tab");
            focusSamples.push(await page.evaluate(() => {
              const el = document.activeElement;
              if (!el || el === document.body) return { tag: "body" };
              const st = getComputedStyle(el);
              const visible = (st.outlineStyle !== "none" && parseFloat(st.outlineWidth) > 0) || st.boxShadow !== "none";
              return { tag: el.tagName.toLowerCase(), name: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("name") || "").trim().slice(0, 40), focusIndicator: visible };
            }));
          }
          break;
        }
        default:
          entry.skipped = `unknown step "${step.do}"`;
      }
    } catch (error) {
      entry.error = error.message.split("\n")[0];
    }
    steplog.push(entry);
  }
  if (!steps.some((s) => s.do === "snapshot") && steps.length) snapshots.push(await captureState("final"));
} catch (error) {
  usageError(`Navigation failed: ${error.message.split("\n")[0]}`);
} finally {
  await browser.close();
}

// ---------- derive facts ----------
const first = snapshots[0];
const trackingVendors = (reqs) => {
  const map = new Map();
  for (const r of reqs) if (r.vendor && NON_ESSENTIAL_CATEGORIES.has(r.vendor.category)) map.set(r.vendor.id, r.vendor);
  return [...map.values()];
};
const allVendors = (reqs) => {
  const map = new Map();
  for (const r of reqs) if (r.vendor) map.set(r.vendor.id, r.vendor);
  return [...map.values()];
};
const thirdPartyHosts = (reqs) => [...new Set(reqs.filter((r) => r.thirdParty).map((r) => r.host))];

const initialTracking = trackingVendors(first.newRequests);
if (initialTracking.length) {
  add("TRACKING_BEFORE_INTERACTION", "MEDIUM", "OBSERVED", `Before any interaction, the page contacted ${initialTracking.map((v) => `${v.name} (${v.category})`).join(", ")}. Whether consent was required depends on jurisdiction, purpose, and the vendor's configuration: REVIEW REQUIRED before calling this a violation. It is a confirmed fact that this happened before any choice was made.`, { target: initialTracking.map((v) => v.id).join(","), review: true });
}
const otherVendors = allVendors(first.newRequests).filter((v) => !NON_ESSENTIAL_CATEGORIES.has(v.category));
if (otherVendors.length) add("THIRD_PARTY_CONTACT_BEFORE_INTERACTION", "INFO", "OBSERVED", `Third parties contacted on load: ${otherVendors.map((v) => `${v.name} (${v.category})`).join(", ")}. Each receives the visitor's IP address and request metadata; check the privacy disclosure covers them.`, { target: otherVendors.map((v) => v.id).join(",") });
const unknownHosts = thirdPartyHosts(first.newRequests).filter((h) => !classifyUrl(`https://${h}/`));
if (unknownHosts.length) add("UNCLASSIFIED_THIRD_PARTY_HOSTS", "INFO", "OBSERVED", `Unclassified third-party hosts contacted on load: ${unknownHosts.slice(0, 10).join(", ")}. Identify what they are before deciding whether they matter.`, { target: unknownHosts.join(",") });
if (first.cookies.length) add("COOKIES_BEFORE_INTERACTION", "INFO", "OBSERVED", `Cookies present before interaction: ${first.cookies.map((c) => `${c.name}${c.thirdParty ? " (third-party)" : ""}${c.trackingName ? " [tracking-like name]" : ""}`).join(", ")}. Purpose is not known from the cookie alone.`, { review: true });
if (first.localStorage.length || first.sessionStorage.length) add("STORAGE_BEFORE_INTERACTION", "INFO", "OBSERVED", `Web storage present before interaction: local [${first.localStorage.map((k) => k.key).join(", ")}] session [${first.sessionStorage.map((k) => k.key).join(", ")}].`, { review: true });
if (first.cookies.some((c) => c.trackingName)) add("TRACKING_COOKIE_BEFORE_INTERACTION", "MEDIUM", "OBSERVED", `Cookies with tracking-style names were set before any interaction: ${first.cookies.filter((c) => c.trackingName).map((c) => c.name).join(", ")}.`, { review: true });

for (let i = 1; i < snapshots.length; i++) {
  const snap = snapshots[i];
  const before = snapshots[i - 1];
  const priorVendors = new Set(snapshots.slice(0, i).flatMap((s) => trackingVendors(s.newRequests).map((v) => v.id)));
  const newTracking = trackingVendors(snap.newRequests);
  const priorCookieNames = new Set(snapshots.slice(0, i).flatMap((s) => s.cookies.map((c) => c.name)));
  const newCookies = snap.cookies.filter((c) => !priorCookieNames.has(c.name));
  const newStorage = [...snap.localStorage, ...snap.sessionStorage].filter((k) => ![...before.localStorage, ...before.sessionStorage].some((b) => b.key === k.key));
  snap.diff = { newTrackingVendors: newTracking.map((v) => v.id), newCookies: newCookies.map((c) => c.name), newStorageKeys: newStorage.map((k) => k.key), newThirdPartyHosts: thirdPartyHosts(snap.newRequests) };
  if (snap.expect === "no-new-nonessential") {
    const trackingAgain = newTracking;
    const trackingCookies = newCookies.filter((c) => c.trackingName);
    if (trackingAgain.length || trackingCookies.length) {
      add("CHOICE_NOT_HONORED", "HIGH", "OBSERVED", `After "${snap.label}", tracking activity continued or started: ${[...trackingAgain.map((v) => v.name), ...trackingCookies.map((c) => `cookie ${c.name}`)].join(", ")}. The choice that was expected to stop non-essential activity did not.`, { target: snap.label });
    } else notes.push(`"${snap.label}": no new tracking-like requests or cookies were observed in the settle window (${settleMs}ms). Absence is only shown for what was exercised.`);
    if (newStorage.length) add("NEW_STORAGE_AFTER_CHOICE", "INFO", "OBSERVED", `After "${snap.label}", new storage keys appeared: ${newStorage.map((k) => k.key).join(", ")}. This is often the consent record itself; confirm it stores only the choice.`, { target: snap.label, review: true });
  }
  if (snap.expect === "some-tracking" && !newTracking.length && priorVendors.size === 0) add("CHOICE_HAD_NO_EFFECT", "LOW", "OBSERVED", `After "${snap.label}", no tracking-like requests were observed. Either the choice does nothing, the vendor is not configured, or it loads later than the settle window.`, { target: snap.label });
}

// canary
if (identity) {
  if (!submitted) notes.push("--canary was set but no submit step ran; planted values were not sent anywhere.");
  for (const req of requests) {
    const hits = findPlanted(`${req.url}\n${req.postData}\n${req.referer}`, identity);
    if (!hits.length) continue;
    const inUrl = findPlanted(req.url, identity).length > 0;
    const fields = [...new Set(hits.map((h) => `${h.field}(${h.encoding})`))].join(", ");
    if (req.thirdParty) add("CANARY_SENT_TO_THIRD_PARTY", req.vendor?.tracking ? "HIGH" : "MEDIUM", "OBSERVED", `Planted test data ${fields} was sent to ${req.host}${req.vendor ? ` (${req.vendor.name}, ${req.vendor.category})` : ""} via ${req.method} ${req.resourceType}. Confirm the recipient is a disclosed, intended processor.`, { target: req.host, review: !req.vendor?.tracking });
    else if (inUrl) add("CANARY_IN_URL", "MEDIUM", "OBSERVED", `Planted test data ${fields} appeared in a first-party URL (${req.method} ${new URL(req.url).pathname}); URLs land in logs, history, and referrers.`, { target: new URL(req.url).pathname });
  }
  for (const s of snapshots) for (const k of [...s.localStorage, ...s.sessionStorage]) if (k.value && Object.values(identity).some((v) => k.value.includes(v))) add("CANARY_IN_STORAGE", "LOW", "OBSERVED", `Planted test data was persisted in web storage key "${k.key}".`, { target: k.key });
  notes.push(`Planted identity used: ${identity.email}, ${identity.name}. These are fake and safe to appear in logs; search back-ends for them to confirm deletion/suppression later.`);
}

// layout / a11y-ish facts per snapshot
for (const s of snapshots) {
  const mismatch = vw <= 500 && !s.hasViewportMeta && s.viewport.layoutWidth > vw + 40;
  if (mismatch) add("VIEWPORT_LAYOUT_MISMATCH", "MEDIUM", "OBSERVED", `A ${vw}px-wide device laid the page out at ${s.viewport.layoutWidth}px (a desktop-width layout scaled down) because the page has no viewport meta tag.`, { page: new URL(s.url).pathname, target: s.label });
  if (s.overflowX && !mismatch) add("HORIZONTAL_OVERFLOW", "MEDIUM", "OBSERVED", `On a ${s.viewport.width}px-wide screen the page is ${Math.max(s.scrollWidth, s.viewport.layoutWidth)}px wide and scrolls horizontally. Widest offenders: ${s.overflowOffenders.map((o) => `${o.tag}${o.id ? `#${o.id}` : ""}${o.cls ? `.${o.cls.split(" ")[0]}` : ""} (right edge ${o.right}px)`).join(", ") || "not identified"}.`, { page: new URL(s.url).pathname, target: s.label });
  if (s.viewport.width <= 500 && s.smallTargets.length) add("SMALL_TOUCH_TARGETS", "LOW", "OBSERVED", `${s.smallTargets.length} interactive element(s) are smaller than 24×24 CSS px at ${s.viewport.width}px wide: ${s.smallTargets.slice(0, 4).map((t) => `${t.tag} "${t.text}" ${t.w}×${t.h}`).join("; ")}.`, { page: new URL(s.url).pathname, target: s.label });
  if (s.viewport.width <= 500 && s.stickyCovering.length) add("STICKY_UI_COVERS_VIEWPORT", "LOW", "OBSERVED", `Fixed/sticky element(s) cover a large part of a ${s.viewport.height}px-tall viewport: ${s.stickyCovering.map((c) => `${c.tag}${c.id ? `#${c.id}` : ""} ${c.heightPct}%`).join(", ")}. Check they do not hide content or the primary action.`, { page: new URL(s.url).pathname, target: s.label });
}
const noIndicator = focusSamples.filter((f) => f.tag !== "body" && !f.focusIndicator);
if (noIndicator.length) add("KEYBOARD_FOCUS_INDICATOR_NOT_DETECTED", "MEDIUM", "OBSERVED", `${noIndicator.length} of ${focusSamples.length} keyboard-focused element(s) showed no computed outline or box-shadow (${noIndicator.slice(0, 3).map((f) => `${f.tag} "${f.name}"`).join("; ")}). Heuristic: a custom indicator using border/background may be present; confirm in a screenshot.`);
if (focusSamples.length >= 4 && new Set(focusSamples.map((f) => `${f.tag}|${f.name}`)).size === 1) add("KEYBOARD_FOCUS_STUCK", "MEDIUM", "OBSERVED", "Repeated Tab presses kept focus on the same element; a keyboard trap or non-focusable page is possible.");
if (consoleErrors.length) add("CONSOLE_ERRORS", "LOW", "OBSERVED", `${consoleErrors.length} console error(s): ${[...new Set(consoleErrors)].slice(0, 3).join(" | ")}`);
const realFailures = failures.filter((f) => !(args["block-third-party"] && originOf(f.url) !== base.origin));
if (realFailures.length) add("REQUEST_FAILURES", "LOW", "OBSERVED", `${realFailures.length} request(s) failed: ${realFailures.slice(0, 4).map((f) => `${f.status} ${new URL(f.url).pathname}`).join(", ")}.`);
if (base.protocol === "https:" && requests.some((r) => r.url.startsWith("http://"))) add("MIXED_CONTENT", "MEDIUM", "OBSERVED", `Insecure http:// subresources were requested on an https page: ${requests.filter((r) => r.url.startsWith("http://")).slice(0, 3).map((r) => r.host).join(", ")}.`);
if (first.consentUi) notes.push(`Consent-like UI detected: "${first.consentUi.text}" with buttons [${first.consentUi.buttons.join(" | ")}]. Use these labels in click steps.`);
else notes.push("No consent-like UI was detected on load. That says nothing about whether one is needed.");

emit("observe-runtime", { url: args.url, viewport: args.viewport, snapshots: snapshots.map(({ newRequests, ...rest }) => ({ ...rest, requestCount: newRequests.length, thirdPartyHosts: thirdPartyHosts(newRequests), vendors: allVendors(newRequests).map((v) => v.id) })), focusSamples, steps: steplog, findings, notes }, args.json);
