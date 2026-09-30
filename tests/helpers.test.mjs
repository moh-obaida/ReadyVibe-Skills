// Deterministic tests for the helper scripts the skills bundle. No model calls, no external network:
// URL-mode tests use local servers; browser tests use local pages and --block-third-party.
import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, dirname } from "node:path";
import { before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { findPlanted, plantIdentity } from "../scripts/lib/canary.mjs";
import { parseHtml, findAll, accessibleName } from "../scripts/lib/html.mjs";
import { isLocalHost } from "../scripts/lib/pages.mjs";
import { classifyUrl } from "../scripts/lib/trackers.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scripts = join(here, "..", "scripts");
const fixtures = join(here, "..", "fixtures");

// Async on purpose: URL-mode tests serve pages from THIS process, so a blocking spawn would deadlock.
function run(script, args) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [join(scripts, script), ...args, "--json"], { encoding: "utf8", timeout: 120000, maxBuffer: 20_000_000 }, (error, stdout, stderr) => {
      if (!stdout) return reject(new Error(`${script} produced no output. stderr: ${stderr}`));
      resolve({ json: JSON.parse(stdout), raw: stdout });
    });
  });
}
const codes = (json) => new Set(json.findings.map((f) => f.code));
const bad = (json) => json.findings.filter((f) => f.severity === "HIGH" || f.severity === "MEDIUM");

function serve(root, { overrides = {} } = {}) {
  const types = { ".html": "text/html", ".xml": "application/xml", ".txt": "text/plain", ".svg": "image/svg+xml", ".png": "image/png" };
  const server = createServer((req, res) => {
    const path = new URL(req.url, "http://x").pathname;
    if (overrides[path]) return overrides[path](res);
    const candidates = [path, `${path}.html`, join(path, "index.html")];
    for (const c of candidates) {
      try {
        const body = readFileSync(join(root, c));
        res.writeHead(200, { "content-type": types[extname(c)] ?? "application/octet-stream" });
        return res.end(body);
      } catch {
        /* next */
      }
    }
    res.writeHead(404, { "content-type": "text/html" });
    res.end("<html><head><title>Not found</title></head><body>404</body></html>");
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

describe("html parser", () => {
  test("reads attributes, nesting, raw-text elements, and accessible names", async () => {
    const tree = parseHtml(`<a href="/x"><img alt="Logo"></a><button aria-label="Close"><svg></svg></button><script>if (a<b) {}</script><p>one<p>two`);
    assert.equal(accessibleName(findAll(tree, "a")[0]), "Logo");
    assert.equal(accessibleName(findAll(tree, "button")[0]), "Close");
    assert.equal(findAll(tree, "p").length, 2);
    assert.equal(findAll(tree, "script")[0].children[0].text, "if (a<b) {}");
  });
});

describe("planted data and vendor classification", () => {
  test("finds a planted email in raw, URL-encoded, base64, sha256, and md5 forms", async () => {
    const id = plantIdentity("abcd1234");
    const norm = id.email.toLowerCase();
    for (const payload of [`x=${id.email}`, `x=${encodeURIComponent(id.email)}`, `x=${Buffer.from(id.email).toString("base64")}`, `h=${createHash("sha256").update(norm).digest("hex")}`, `h=${createHash("md5").update(norm).digest("hex")}`]) {
      assert.ok(findPlanted(payload, id).some((h) => h.field === "email"), payload);
    }
    assert.equal(findPlanted("nothing here", id).length, 0);
  });
  test("classifies known vendors by host and leaves unknown hosts unclassified", async () => {
    assert.equal(classifyUrl("https://www.googletagmanager.com/gtag/js?id=G-1").category, "TAG_MANAGER");
    assert.equal(classifyUrl("https://static.hotjar.com/c/hotjar.js").category, "SESSION_REPLAY");
    assert.equal(classifyUrl("https://fonts.gstatic.com/x.woff2").category, "FONTS");
    assert.equal(classifyUrl("https://example-cdn.internal/x.js"), null);
  });
});

describe("live-submit guard", () => {
  test("only loopback and reserved dev/test hosts count as safe to submit forms against", () => {
    for (const h of ["localhost", "127.0.0.1", "app.localhost", "shop.test", "[::1]"]) assert.ok(isLocalHost(h), h);
    for (const h of ["example.org", "ledgerly.app", "staging.ledgerly.app", "localhost.evil.com", "test.com"]) assert.ok(!isLocalHost(h), h);
  });
});

describe("inspect-metadata", () => {
  test("finds contradictions between canonical, robots, sitemap, and noindex", async () => {
    const { json } = await run("inspect-metadata.mjs", ["--dir", join(fixtures, "leaky-site")]);
    const found = codes(json);
    for (const code of ["CANONICAL_LOCALHOST", "META_TITLE_STARTER", "META_TITLE_DUPLICATE", "META_DESCRIPTION_MISSING", "ROBOTS_SITEMAP_LOCALHOST", "ROBOTS_BLOCKS_ASSETS", "SITEMAP_PRIVATE_ROUTE", "SITEMAP_NOINDEX_LISTED", "SITEMAP_ROBOTS_BLOCKED", "SITEMAP_DUPLICATE_URL", "CANONICAL_DUPLICATE_TARGET", "ROBOTS_BLOCKS_PAGE", "OG_IMAGE_RELATIVE", "CANONICAL_HOST_INCONSISTENT", "FAVICON_MISSING"]) {
      assert.ok(found.has(code), `expected ${code}, got ${[...found].join(", ")}`);
    }
  });
  test("a correct site has no HIGH or MEDIUM findings", async () => {
    const { json } = await run("inspect-metadata.mjs", ["--dir", join(fixtures, "clean-site")]);
    assert.deepEqual(bad(json), []);
  });
  test("a private route in a noindex, dashboard-style page is INFO, not a launch blocker", async () => {
    const { json } = await run("inspect-metadata.mjs", ["--dir", join(fixtures, "leaky-site")]);
    assert.equal(json.findings.find((f) => f.code === "NOINDEX_PAGE" && f.page === "/dashboard").severity, "INFO");
  });
});

describe("check-links", () => {
  test("static mode finds broken nav/footer links, dead hrefs, placeholders, dev hosts, and sitemap targets", async () => {
    const { json } = await run("check-links.mjs", ["--dir", join(fixtures, "leaky-site")]);
    const broken = json.findings.filter((f) => f.code === "LINK_BROKEN").map((f) => f.target);
    assert.deepEqual(broken.sort(), ["/pricing", "/privacy", "/terms"]);
    for (const code of ["LINK_DEAD_HREF", "LINK_PLACEHOLDER_TARGET", "LINK_DEV_HOST", "LINK_FRAGMENT_MISSING", "SITEMAP_URL_BROKEN"]) assert.ok(codes(json).has(code), code);
    assert.equal(json.findings.find((f) => f.code === "LINK_BROKEN" && f.target === "/privacy").context, "footer");
  });
  test("a correct site has no findings", async () => {
    assert.deepEqual((await run("check-links.mjs", ["--dir", join(fixtures, "clean-site")])).json.findings, []);
  });
  test("url mode separates confirmed 404s and soft-404s from transient failures", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rv-links-"));
    writeFileSync(join(dir, "index.html"), `<html><head><title>Home</title></head><body><nav><a href="/gone">Gone</a><a href="/soft">Soft</a><a href="/flaky">Flaky</a><a href="/ok">Ok</a></nav></body></html>`);
    writeFileSync(join(dir, "ok.html"), "<html><head><title>OK</title></head><body>ok</body></html>");
    const { server, url } = await serve(dir, {
      overrides: {
        "/soft": (res) => (res.writeHead(200, { "content-type": "text/html" }), res.end("<html><head><title>Page not found</title></head><body><h1>404</h1></body></html>")),
        "/flaky": (res) => (res.writeHead(503, { "content-type": "text/html" }), res.end("<html>try later</html>")),
      },
    });
    try {
      const { json } = await run("check-links.mjs", ["--url", url]);
      const by = (code) => json.findings.filter((f) => f.code === code).map((f) => f.target);
      assert.deepEqual(by("LINK_BROKEN"), ["/gone"]);
      assert.deepEqual(by("LINK_SOFT_404"), ["/soft"]);
      assert.deepEqual(by("LINK_UNVERIFIED"), ["/flaky"]);
      assert.equal(json.findings.find((f) => f.code === "LINK_UNVERIFIED").evidence, "UNKNOWN");
    } finally {
      server.close();
    }
  });
});

describe("scan-secrets", () => {
  const dir = mkdtempSync(join(tmpdir(), "rv-secrets-"));
  const git = (...a) => spawnSync("git", ["-C", dir, ...a], { encoding: "utf8" });
  git("init", "-q");
  const stripe = ["sk", "live", "A1b2C3d4E5f6G7h8I9j0K1l2"].join("_");
  const jwt = (payload) => `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${"s".repeat(20)}`;
  mkdirSync(join(dir, "src"), { recursive: true });
  mkdirSync(join(dir, "dist"), { recursive: true });
  writeFileSync(join(dir, ".env"), `NEXT_PUBLIC_ADMIN_SECRET=super-private-value-1234\nDATABASE_PASSWORD=hunter2hunter2hunter2\n`);
  writeFileSync(join(dir, "src/pay.ts"), `const key = "${stripe}";\nconst url = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;\n`);
  writeFileSync(join(dir, "src/db.ts"), `const supa = "${jwt({ role: "service_role" })}";\nconst anon = "${jwt({ role: "anon" })}";\n`);
  writeFileSync(join(dir, "dist/app.js"), `fetch("http://localhost:3000/api");\n//# sourceMappingURL=app.js.map\n`);
  writeFileSync(join(dir, "dist/app.js.map"), "{}");
  git("add", "-A");
  let json, raw, found;
  before(async () => {
    ({ json, raw } = await run("scan-secrets.mjs", ["--root", dir]));
    found = codes(json);
  });
  test("finds live keys, service-role JWTs, client-exposed secret env names, tracked .env, source maps, and localhost in output", async () => {
    for (const code of ["SECRET_STRIPE_LIVE", "SECRET_SUPABASE_SERVICE_ROLE", "CLIENT_ENV_SECRET_NAME", "ENV_FILE_TRACKED", "SOURCEMAP_EXPOSED", "DEV_URL_IN_SHIPPED_OUTPUT"]) assert.ok(found.has(code), `${code} in ${[...found].join(", ")}`);
  });
  test("never prints a full secret value, and never reads .env values into output", async () => {
    assert.ok(!raw.includes(stripe), "stripe key leaked into report");
    assert.ok(!raw.includes("super-private-value-1234"));
    assert.ok(!raw.includes("hunter2hunter2hunter2"));
  });
  test("anon Supabase keys are not flagged (they are public by design)", async () => {
    assert.equal(json.findings.filter((f) => f.code === "SECRET_SUPABASE_SERVICE_ROLE").length, 1);
  });
});

describe("planted-defect projects (source-level fixtures)", () => {
  test("a client-exposed secret-named env variable is found in source", async () => {
    const { json } = await run("scan-secrets.mjs", ["--root", join(fixtures, "projects", "secret-in-client")]);
    assert.ok(codes(json).has("CLIENT_ENV_SECRET_NAME"));
  });
  test("a private route listed in a sitemap is found without any pages to crawl", async () => {
    const { json } = await run("inspect-metadata.mjs", ["--dir", join(fixtures, "projects", "private-sitemap")]);
    assert.ok(codes(json).has("SITEMAP_PRIVATE_ROUTE"));
  });
});

describe("inventory-data-model", () => {
  const col = (json, entity, name) => json.entities.find((e) => e.name === entity).columns.find((c) => c.name === name);
  test("reads Prisma models: entities, flags, stack, UI kit, existing admin routes, and unreadable stores", async () => {
    const { json } = await run("inventory-data-model.mjs", ["--root", join(fixtures, "data-model-prisma")]);
    assert.deepEqual(json.entities.map((e) => e.name).sort(), ["Order", "Session", "User"]);
    assert.ok(col(json, "User", "email").flags.includes("PERSONAL_DATA_HINT"));
    assert.ok(col(json, "User", "role").flags.includes("ROLE"));
    assert.ok(col(json, "User", "active").flags.includes("STATE_FLAG"));
    assert.ok(col(json, "Order", "deletedAt").flags.includes("SOFT_DELETE"));
    assert.ok(col(json, "Order", "userId").flags.includes("OWNER_REF"));
    assert.ok(!col(json, "User", "passwordHash").flags.includes("SECRET_HINT"), "a hashed password column is not a stored secret");
    assert.ok(col(json, "Session", "token").flags.includes("SECRET_HINT"));
    assert.ok(!json.entities.find((e) => e.name === "User").columns.some((c) => c.name === "orders"), "relation fields are not columns");
    assert.ok(json.stack.ui.includes("tailwindcss") && json.stack.tables.includes("@tanstack/react-table") && json.stack.payments.includes("stripe"));
    assert.deepEqual(json.adminRoutes, ["app/admin/page.tsx"]);
    assert.ok(json.unsupported.includes("firebase"));
    assert.ok(codes(json).has("SECRET_LIKE_COLUMN") && codes(json).has("SOFT_DELETE_COLUMN"));
  });
  test("reads SQL migrations and Drizzle tables, and says when there is no role model or no schema at all", async () => {
    const { json } = await run("inventory-data-model.mjs", ["--root", join(fixtures, "data-model-sql")]);
    assert.deepEqual(json.entities.map((e) => `${e.kind}:${e.name}`).sort(), ["drizzle:subscribers", "sql:posts", "sql:profiles"]);
    assert.ok(col(json, "profiles", "is_admin").flags.includes("ROLE"));
    assert.ok(!json.entities.find((e) => e.name === "posts").columns.some((c) => /constraint|check/i.test(c.name)), "table constraints are not columns");
    assert.ok(col(json, "subscribers", "api_key").flags.includes("SECRET_HINT"));
    const empty = await run("inventory-data-model.mjs", ["--root", join(fixtures, "clean-site")]);
    assert.equal(empty.json.findings.find((f) => f.code === "NO_DATA_MODEL_FOUND").evidence, "UNKNOWN");
  });
});

describe("audit-markup", () => {
  test("finds label, alt, viewport, GET-with-password, and semantic problems", async () => {
    const { json } = await run("audit-markup.mjs", ["--dir", join(fixtures, "leaky-site")]);
    for (const code of ["PLACEHOLDER_TEXT", "FORM_GET_WITH_PASSWORD", "CONTROL_NO_LABEL", "PLACEHOLDER_ONLY_LABEL", "IMG_ALT_MISSING", "LINK_NO_NAME", "LANG_MISSING", "VIEWPORT_MISSING", "CLICKABLE_NON_SEMANTIC", "HEADING_SKIP"]) assert.ok(codes(json).has(code), code);
  });
  test("a correct site has no findings", async () => {
    assert.deepEqual((await run("audit-markup.mjs", ["--dir", join(fixtures, "clean-site")])).json.findings, []);
  });
  test("an empty client-rendered shell is reported as unknown, not as clean", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rv-spa-"));
    writeFileSync(join(dir, "index.html"), `<!doctype html><html><head><title>App</title></head><body><div id="root"></div><script src="/a.js"></script></body></html>`);
    const { json } = await run("audit-markup.mjs", ["--dir", dir]);
    assert.equal(json.findings.find((f) => f.code === "PAGE_NOT_RENDERED").evidence, "UNKNOWN");
  });
});

describe("audit-assets", () => {
  test("flags insecure and unpinned third-party scripts", async () => {
    const { json } = await run("audit-assets.mjs", ["--dir", join(fixtures, "leaky-site")]);
    for (const code of ["INSECURE_SUBRESOURCE", "CDN_SCRIPT_NO_INTEGRITY", "CDN_SCRIPT_UNPINNED"]) assert.ok(codes(json).has(code), code);
    assert.equal(json.findings.find((f) => f.code === "INSECURE_SUBRESOURCE").severity, "HIGH");
  });
  test("flags oversized images and render-blocking scripts", async () => {
    const dir = mkdtempSync(join(tmpdir(), "rv-assets-"));
    writeFileSync(join(dir, "big.png"), Buffer.alloc(1_600_000, 7));
    writeFileSync(join(dir, "app.js"), "console.log(1)");
    writeFileSync(join(dir, "index.html"), `<html lang="en"><head><title>x</title><script src="/app.js"></script></head><body><img src="/big.png" alt="big"></body></html>`);
    const { json } = await run("audit-assets.mjs", ["--dir", dir]);
    assert.ok(codes(json).has("ASSET_OVERSIZED_IMAGE"));
    assert.ok(codes(json).has("RENDER_BLOCKING_SCRIPT"));
    assert.ok(codes(json).has("IMG_NO_DIMENSIONS"));
  });
});

async function browserAvailable() {
  const { launchBrowser } = await import("../scripts/lib/browser.mjs");
  try {
    const { browser } = await launchBrowser();
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

describe("observe-runtime (real headless browser, local pages only)", async () => {
  const available = await browserAvailable();
  const skip = available ? false : "No Playwright/Chromium available. Not run.";
  const steps = join(fixtures, "steps");
  test("flags tracking before interaction and a Reject that does not stop it", { skip }, async () => {
    const { server, url } = await serve(join(fixtures, "consent-bad"));
    try {
      const { json } = await run("observe-runtime.mjs", ["--url", url, "--block-third-party", "--settle", "300", "--steps", join(steps, "consent-reject.json")]);
      assert.ok(codes(json).has("TRACKING_BEFORE_INTERACTION"));
      assert.ok(codes(json).has("CHOICE_NOT_HONORED"));
      assert.equal(json.findings.find((f) => f.code === "TRACKING_BEFORE_INTERACTION").review, true, "applicability must stay a review question");
    } finally {
      server.close();
    }
  });
  test("a correct gate produces no tracking findings, and reject stays rejected across reload", { skip }, async () => {
    const { server, url } = await serve(join(fixtures, "consent-good"));
    try {
      const { json } = await run("observe-runtime.mjs", ["--url", url, "--block-third-party", "--settle", "300", "--steps", join(steps, "consent-reject.json")]);
      const found = codes(json);
      assert.ok(!found.has("TRACKING_BEFORE_INTERACTION") && !found.has("CHOICE_NOT_HONORED") && !found.has("TRACKING_COOKIE_BEFORE_INTERACTION"), [...found].join(", "));
    } finally {
      server.close();
    }
  });
  test("forced API failure and delay are applied and reported so error states can be observed", { skip }, async () => {
    const { server, url } = await serve(join(fixtures, "states"), { overrides: { "/api/items": (res) => (res.writeHead(200, { "content-type": "application/json" }), res.end("[]")) } });
    try {
      const failed = (await run("observe-runtime.mjs", ["--url", url, "--settle", "300", "--fail", "**/api/items=500"])).json;
      assert.ok(codes(failed).has("REQUEST_FAILURES"));
      assert.match(failed.findings.find((f) => f.code === "REQUEST_FAILURES").message, /500/);
      const healthy = (await run("observe-runtime.mjs", ["--url", url, "--settle", "300"])).json;
      assert.ok(!codes(healthy).has("REQUEST_FAILURES"));
    } finally {
      server.close();
    }
  });
  test("planted form data sent to an analytics host is detected; a clean form is not", { skip }, async () => {
    const bad = await serve(join(fixtures, "consent-bad"));
    const good = await serve(join(fixtures, "consent-good"));
    try {
      const leaked = (await run("observe-runtime.mjs", ["--url", bad.url, "--block-third-party", "--settle", "300", "--canary", "--steps", join(steps, "form-canary.json")])).json;
      assert.equal(leaked.findings.find((f) => f.code === "CANARY_SENT_TO_THIRD_PARTY")?.severity, "HIGH");
      const clean = (await run("observe-runtime.mjs", ["--url", good.url, "--block-third-party", "--settle", "300", "--canary", "--steps", join(steps, "form-canary.json")])).json;
      assert.ok(!codes(clean).has("CANARY_SENT_TO_THIRD_PARTY"));
    } finally {
      bad.server.close();
      good.server.close();
    }
  });
});
