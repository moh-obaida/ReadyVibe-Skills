// Tolerant HTML parser used by the ReadyVibe helper scripts. Zero dependencies.
// It is not a spec-complete parser. It is good enough to read tags, attributes,
// visible text, and nesting from real-world (and vibe-coded) markup without throwing.

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW_TEXT = new Set(["script", "style", "textarea", "title"]);
const AUTO_CLOSE = {
  li: ["li"],
  p: ["p"],
  option: ["option"],
  tr: ["tr", "td", "th"],
  td: ["td", "th"],
  th: ["td", "th"],
  dt: ["dt", "dd"],
  dd: ["dt", "dd"],
};

const TAG_RE = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\?[\s\S]*?\?>|<(\/?)([a-zA-Z][^\s/>]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

export function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&");
}

function parseAttrs(raw) {
  const attrs = {};
  let match;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(raw))) {
    const name = match[1].toLowerCase();
    if (name === "/") continue;
    const value = match[2] ?? match[3] ?? match[4];
    if (!(name in attrs)) attrs[name] = value === undefined ? "" : decodeEntities(value);
  }
  return attrs;
}

/** Parse HTML into a tree: { tag, attrs, children, parent, start }. Text nodes are { tag: "#text", text }. */
export function parseHtml(html) {
  const root = { tag: "#root", attrs: {}, children: [], parent: null, start: 0 };
  const stack = [root];
  let cursor = 0;
  let match;
  TAG_RE.lastIndex = 0;
  const pushText = (text) => {
    if (!text) return;
    const parent = stack[stack.length - 1];
    parent.children.push({ tag: "#text", text: decodeEntities(text), parent, start: 0 });
  };
  while ((match = TAG_RE.exec(html))) {
    pushText(html.slice(cursor, match.index));
    cursor = TAG_RE.lastIndex;
    if (!match[2]) continue; // comment, doctype, cdata
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    if (closing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const closes = AUTO_CLOSE[tag];
    if (closes) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (closes.includes(stack[i].tag)) {
          stack.length = i;
          break;
        }
        if (["ul", "ol", "table", "select", "div", "section", "form"].includes(stack[i].tag)) break;
      }
    }
    const rawAttrs = match[3] ?? "";
    const node = { tag, attrs: parseAttrs(rawAttrs), children: [], parent: stack[stack.length - 1], start: match.index };
    node.parent.children.push(node);
    const selfClosing = /\/\s*$/.test(rawAttrs);
    if (VOID.has(tag) || (selfClosing && !RAW_TEXT.has(tag))) continue;
    if (RAW_TEXT.has(tag)) {
      const end = html.toLowerCase().indexOf(`</${tag}`, cursor);
      const stop = end === -1 ? html.length : end;
      const body = html.slice(cursor, stop);
      if (body) node.children.push({ tag: "#text", text: tag === "title" || tag === "textarea" ? decodeEntities(body) : body, parent: node, start: cursor });
      const close = html.indexOf(">", stop);
      cursor = close === -1 ? html.length : close + 1;
      TAG_RE.lastIndex = cursor;
      continue;
    }
    stack.push(node);
  }
  pushText(html.slice(cursor));
  return root;
}

export function walk(node, visit) {
  for (const child of node.children ?? []) {
    visit(child);
    if (child.children) walk(child, visit);
  }
}

export function findAll(root, predicate) {
  const out = [];
  const test = typeof predicate === "string" ? (n) => n.tag === predicate : predicate;
  walk(root, (n) => {
    if (n.tag !== "#text" && test(n)) out.push(n);
  });
  return out;
}

export function findFirst(root, predicate) {
  return findAll(root, predicate)[0] ?? null;
}

/** Visible-ish text of a node. Skips script, style, and hidden subtrees. */
export function textOf(node) {
  if (node.tag === "#text") return node.text;
  if (["script", "style", "noscript"].includes(node.tag)) return "";
  if ("hidden" in (node.attrs ?? {})) return "";
  return (node.children ?? []).map(textOf).join(" ").replace(/\s+/g, " ").trim();
}

/** Text a screen reader would use for a link or button: aria-label, text, image alt, or title. */
export function accessibleName(node) {
  const a = node.attrs ?? {};
  if (a["aria-label"]?.trim()) return a["aria-label"].trim();
  const text = textOf(node);
  if (text) return text;
  const parts = [];
  walk(node, (n) => {
    if (n.tag === "img" && n.attrs.alt?.trim()) parts.push(n.attrs.alt.trim());
    if (n.tag === "svg" && n.attrs["aria-label"]?.trim()) parts.push(n.attrs["aria-label"].trim());
    if (n.tag === "title" && n.parent?.tag === "svg") parts.push(textOf(n));
  });
  if (parts.length) return parts.join(" ");
  if (a["aria-labelledby"]) return `#${a["aria-labelledby"]}`;
  return (a.title ?? "").trim();
}

export function closest(node, predicate) {
  const test = typeof predicate === "string" ? (n) => n.tag === predicate : predicate;
  for (let cur = node.parent; cur; cur = cur.parent) if (cur.tag !== "#root" && test(cur)) return cur;
  return null;
}

export function lineOf(html, index) {
  let line = 1;
  for (let i = 0; i < index && i < html.length; i++) if (html.charCodeAt(i) === 10) line++;
  return line;
}

export function metaContent(root, key, value) {
  const node = findFirst(root, (n) => n.tag === "meta" && (n.attrs[key] ?? "").toLowerCase() === value.toLowerCase());
  return node ? (node.attrs.content ?? "") : null;
}
