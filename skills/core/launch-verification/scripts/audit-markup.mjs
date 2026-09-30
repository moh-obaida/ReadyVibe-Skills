#!/usr/bin/env node
// audit-markup.mjs - automatable accessibility, form, and mobile-viewport signals in served or rendered HTML.
// This is a lightweight source-level scan. It CANNOT establish WCAG conformance, keyboard operability,
// contrast, focus order, or responsive behavior. Use observe-runtime.mjs / a real browser for those.
//
//   node audit-markup.mjs --url http://localhost:3000 [--render] [--json]
//   node audit-markup.mjs --dir ./dist [--json]

import { parseArgs } from "node:util";
import { emit, finding, usageError } from "./lib/report.mjs";
import { accessibleName, closest, findAll, findFirst, metaContent, parseHtml, textOf } from "./lib/html.mjs";
import { loadSite, siteNotRead } from "./lib/pages.mjs";

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    dir: { type: "string" },
    render: { type: "boolean", default: false },
    "max-pages": { type: "string", default: "25" },
    timeout: { type: "string", default: "10000" },
    "chrome-path": { type: "string" },
    json: { type: "boolean", default: false },
  },
});
if (!args.url && !args.dir) usageError("Usage: audit-markup.mjs --url <site> | --dir <build dir> [--render] [--json]");

const site = await loadSite({ url: args.url, dir: args.dir, render: args.render, maxPages: Number(args["max-pages"]), timeoutMs: Number(args.timeout), chromePath: args["chrome-path"] }).catch((e) => usageError(e.message));
const findings = [];
const notes = [...site.notes, "Static/rendered markup scan only. It does not prove WCAG conformance, keyboard access, contrast, focus behavior, or responsive layout."];
const unread = siteNotRead(site);
if (unread) findings.push(unread);
const GENERIC_LINK = /^(click here|here|read more|learn more|more|link|this|details|continue)$/i;
const FILENAME_ALT = /^(img|image|photo|picture|screenshot|dsc|untitled)?[\s_-]*\d*\.?(png|jpe?g|gif|webp|svg|avif)?$|\.(png|jpe?g|gif|webp|svg|avif)$/i;
const PLACEHOLDER_TEXT = [
  [/lorem ipsum|dolor sit amet|consectetur adipiscing/i, "MEDIUM", "lorem ipsum filler"],
  [/\b(your (company|name|email|business|brand|logo|text|tagline|website|product)( name)?( here)?|company name here|insert (text|image|title|description) here)\b/i, "MEDIUM", "template placeholder wording"],
  [/\b(john|jane) doe\b|\bfirstname lastname\b/i, "MEDIUM", "sample person name"],
  [/\b(acme (inc|corp|co)\b|acme company)/i, "LOW", "sample company name"],
  [/\[(?:[A-Z ]{4,}|[a-z ]{4,} here)\]|\{\{[^}]+\}\}|\bTODO\b|\bTBD\b|\bFIXME\b/, "MEDIUM", "unfilled template marker or TODO"],
  [/\bcoming soon\b/i, "LOW", '"coming soon" (confirm it is intentional)'],
  [/(?:^|\s)(?:123-456-7890|\(555\) ?\d{3}-\d{4}|555-01\d\d)(?:\s|$)/, "MEDIUM", "sample phone number"],
];
const NON_LABELLED = new Set(["hidden", "submit", "button", "reset", "image"]);

for (const page of site.pages.filter((p) => p.status === 200 && p.html)) {
  const tree = parseHtml(page.html);
  const at = (code, severity, evidence, message, extra = {}) => findings.push(finding(code, severity, evidence, message, { page: page.path, ...extra }));
  if (page.spaShell) {
    at("PAGE_NOT_RENDERED", "INFO", "UNKNOWN", "This page is an empty client-rendered shell as served; markup checks did not see the real UI. Re-run with --url and --render.");
    continue;
  }
  const html = findFirst(tree, "html");
  if (!html?.attrs.lang?.trim()) at("LANG_MISSING", "MEDIUM", "OBSERVED", "<html> has no lang attribute; screen readers cannot pick the right pronunciation.");
  const viewport = metaContent(tree, "name", "viewport");
  if (viewport === null) at("VIEWPORT_MISSING", "MEDIUM", "OBSERVED", "No <meta name=\"viewport\">; mobile browsers will render a zoomed-out desktop layout.");
  else if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(viewport)) at("VIEWPORT_ZOOM_DISABLED", "MEDIUM", "OBSERVED", `Viewport "${viewport}" blocks pinch-zoom, which low-vision users rely on.`);
  else if (!/width\s*=\s*device-width/i.test(viewport)) at("VIEWPORT_NOT_RESPONSIVE", "MEDIUM", "OBSERVED", `Viewport "${viewport}" does not set width=device-width.`);

  const bodyText = textOf(findFirst(tree, "body") ?? { tag: "#text", text: "" });
  const found = new Map();
  for (const [re, severity, label] of PLACEHOLDER_TEXT) {
    const m = bodyText.match(re);
    if (m) found.set(label, { severity, sample: m[0].trim().slice(0, 40) });
  }
  for (const [label, { severity, sample }] of found) at("PLACEHOLDER_TEXT", severity, "OBSERVED", `Visible page text contains ${label}: "${sample}".`, { target: label });

  // headings & landmarks
  const headings = findAll(tree, (n) => /^h[1-6]$/.test(n.tag)).map((n) => ({ level: Number(n.tag[1]), text: textOf(n) }));
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0) at("H1_MISSING", "LOW", "OBSERVED", "No <h1>.");
  if (h1s.length > 1) at("H1_MULTIPLE", "INFO", "OBSERVED", `${h1s.length} <h1> elements.`);
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) {
      at("HEADING_SKIP", "LOW", "OBSERVED", `Heading jumps from h${headings[i - 1].level} to h${headings[i].level} ("${headings[i].text.slice(0, 40)}").`);
      break;
    }
  }
  if (headings.some((h) => !h.text)) at("HEADING_EMPTY", "LOW", "OBSERVED", "An empty heading element exists.");
  if (!findFirst(tree, (n) => n.tag === "main" || n.attrs.role === "main")) at("LANDMARK_MAIN_MISSING", "LOW", "OBSERVED", "No <main> landmark.");
  const navLinks = findAll(tree, (n) => n.tag === "a" && closest(n, "nav")).length;
  if (navLinks > 5 && !findFirst(tree, (n) => n.tag === "a" && /^#(main|content|maincontent)/i.test(n.attrs.href ?? ""))) at("SKIP_LINK_MISSING", "INFO", "OBSERVED", "Navigation has several links and no skip-to-content link.");

  // images
  const imgs = findAll(tree, "img");
  const noAlt = imgs.filter((i) => !("alt" in i.attrs) && i.attrs.role !== "presentation");
  if (noAlt.length) at("IMG_ALT_MISSING", "MEDIUM", "OBSERVED", `${noAlt.length} image(s) have no alt attribute (decorative images need alt=""): ${noAlt.slice(0, 3).map((i) => i.attrs.src ?? "(no src)").join(", ")}.`);
  const badAlt = imgs.filter((i) => i.attrs.alt?.trim() && FILENAME_ALT.test(i.attrs.alt.trim()));
  if (badAlt.length) at("IMG_ALT_FILENAME", "LOW", "OBSERVED", `${badAlt.length} image(s) use a filename or generic word as alt: ${badAlt.slice(0, 3).map((i) => `"${i.attrs.alt}"`).join(", ")}.`);

  // links / buttons
  for (const a of findAll(tree, (n) => n.tag === "a" && "href" in n.attrs)) {
    const name = accessibleName(a);
    if (!name) at("LINK_NO_NAME", "MEDIUM", "OBSERVED", `Link to ${a.attrs.href} has no accessible name (icon-only or image without alt).`, { target: a.attrs.href });
    else if (GENERIC_LINK.test(name)) at("LINK_GENERIC_TEXT", "LOW", "OBSERVED", `Link text "${name}" says nothing out of context.`, { target: a.attrs.href });
  }
  for (const b of findAll(tree, (n) => n.tag === "button" || n.attrs.role === "button")) {
    if (!accessibleName(b)) at("BUTTON_NO_NAME", "MEDIUM", "OBSERVED", "Button has no accessible name (icon-only without aria-label).");
  }
  const fakeButtons = findAll(tree, (n) => ["div", "span"].includes(n.tag) && "onclick" in n.attrs && !n.attrs.role && !("tabindex" in n.attrs));
  if (fakeButtons.length) at("CLICKABLE_NON_SEMANTIC", "MEDIUM", "OBSERVED", `${fakeButtons.length} <div>/<span> element(s) have click handlers but no role or tabindex, so keyboard users cannot operate them.`);
  if (findAll(tree, (n) => Number(n.attrs.tabindex) > 0).length) at("TABINDEX_POSITIVE", "LOW", "OBSERVED", "Positive tabindex values override natural focus order.");
  const untitledFrames = findAll(tree, (n) => n.tag === "iframe" && !n.attrs.title?.trim() && !n.attrs["aria-label"]);
  if (untitledFrames.length) at("IFRAME_NO_TITLE", "MEDIUM", "OBSERVED", `${untitledFrames.length} iframe(s) without a title (${untitledFrames.slice(0, 2).map((f) => f.attrs.src ?? "").join(", ")}).`);
  const focusableHidden = findAll(tree, (n) => n.attrs["aria-hidden"] === "true" && ["a", "button", "input", "select", "textarea"].includes(n.tag) && n.attrs.tabindex !== "-1");
  if (focusableHidden.length) at("ARIA_HIDDEN_FOCUSABLE", "MEDIUM", "OBSERVED", `${focusableHidden.length} focusable element(s) are aria-hidden.`);
  const ids = new Map();
  for (const n of findAll(tree, (x) => x.attrs.id)) ids.set(n.attrs.id, (ids.get(n.attrs.id) ?? 0) + 1);
  const dup = [...ids].filter(([, c]) => c > 1).map(([id]) => id);
  if (dup.length) at("DUPLICATE_ID", "MEDIUM", "OBSERVED", `Duplicate id(s) break label and ARIA associations: ${dup.slice(0, 4).join(", ")}.`);
  const autoplay = findAll(tree, (n) => ["video", "audio"].includes(n.tag) && "autoplay" in n.attrs && !("muted" in n.attrs));
  if (autoplay.length) at("AUTOPLAY_WITH_SOUND", "MEDIUM", "OBSERVED", "Media autoplays without being muted.");
  if (findAll(tree, (n) => n.tag === "marquee" || n.tag === "blink").length) at("OBSOLETE_MOTION_ELEMENT", "LOW", "OBSERVED", "<marquee>/<blink> present.");
  if (findAll(tree, (n) => n.tag === "meta" && (n.attrs["http-equiv"] ?? "").toLowerCase() === "refresh").length) at("META_REFRESH", "LOW", "OBSERVED", "Page auto-refreshes or redirects via <meta refresh>.");

  // forms & controls
  const labelFor = new Set(findAll(tree, (n) => n.tag === "label" && n.attrs.for).map((l) => l.attrs.for));
  const allIds = new Set(ids.keys());
  for (const l of findAll(tree, (n) => n.tag === "label" && n.attrs.for)) if (!allIds.has(l.attrs.for)) at("LABEL_TARGET_MISSING", "LOW", "OBSERVED", `<label for="${l.attrs.for}"> points at no element.`);
  const unlabeled = [];
  const placeholderOnly = [];
  for (const c of findAll(tree, (n) => ["input", "select", "textarea"].includes(n.tag) && !NON_LABELLED.has((n.attrs.type ?? "").toLowerCase()))) {
    const labelled = (c.attrs.id && labelFor.has(c.attrs.id)) || closest(c, "label") || c.attrs["aria-label"]?.trim() || c.attrs["aria-labelledby"] || c.attrs.title?.trim();
    if (labelled) continue;
    (c.attrs.placeholder ? placeholderOnly : unlabeled).push(c.attrs.name ?? c.attrs.id ?? c.tag);
  }
  if (unlabeled.length) at("CONTROL_NO_LABEL", "MEDIUM", "OBSERVED", `${unlabeled.length} form control(s) have no label (${unlabeled.slice(0, 4).join(", ")}).`);
  if (placeholderOnly.length) at("PLACEHOLDER_ONLY_LABEL", "MEDIUM", "OBSERVED", `${placeholderOnly.length} control(s) use only a placeholder as their label (${placeholderOnly.slice(0, 4).join(", ")}); it disappears on input and is not a reliable name.`);
  for (const f of findAll(tree, "form")) {
    const method = (f.attrs.method ?? "get").toLowerCase();
    const action = f.attrs.action ?? "";
    const inputs = findAll(f, (n) => n.tag === "input");
    const hasPassword = inputs.some((i) => (i.attrs.type ?? "").toLowerCase() === "password");
    if (method === "get" && hasPassword) at("FORM_GET_WITH_PASSWORD", "HIGH", "OBSERVED", "A form containing a password field submits with GET; the password would appear in the URL, history, and logs.", { target: action || "(same page)" });
    if (/^http:\/\//i.test(action)) at("FORM_ACTION_HTTP", "MEDIUM", "OBSERVED", `Form posts over insecure http: ${action}.`, { target: action });
    if (!findAll(f, (n) => (n.tag === "button" && (n.attrs.type ?? "submit") === "submit") || (n.tag === "input" && ["submit", "image"].includes((n.attrs.type ?? "").toLowerCase()))).length) at("FORM_NO_SUBMIT", "LOW", "OBSERVED", "Form has no submit button; pressing Enter may be the only way to submit it.", { target: action || "(same page)" });
    for (const i of inputs) {
      const type = (i.attrs.type ?? "text").toLowerCase();
      const nm = `${i.attrs.name ?? ""} ${i.attrs.id ?? ""}`.toLowerCase();
      if (type === "text" && /e-?mail/.test(nm)) at("FORM_EMAIL_TYPE", "LOW", "OBSERVED", `Field "${i.attrs.name ?? i.attrs.id}" looks like an email field but is type="text"; mobile keyboards and native validation are lost.`);
      if (type === "text" && /(^|[^a-z])(tel|phone|mobile)/.test(nm)) at("FORM_TEL_TYPE", "LOW", "OBSERVED", `Field "${i.attrs.name ?? i.attrs.id}" looks like a phone field but is type="text".`);
      if (type === "password" && !i.attrs.autocomplete) at("FORM_PASSWORD_AUTOCOMPLETE", "LOW", "OBSERVED", "Password field has no autocomplete hint (current-password / new-password); password managers work worse.");
    }
  }
  const wide = findAll(tree, (n) => /(?:^|;)\s*(?:min-)?width\s*:\s*(\d{3,4})px/i.test(n.attrs.style ?? "") && Number((n.attrs.style.match(/width\s*:\s*(\d{3,4})px/i) ?? [])[1]) > 480);
  if (wide.length) at("FIXED_WIDTH_ELEMENT", "LOW", "SOURCE-INDICATED", `${wide.length} element(s) use a fixed inline width over 480px, a common cause of horizontal overflow on phones. Verify at 375px in a browser.`);
}
emit("audit-markup", { mode: site.mode, findings, notes }, args.json);
