// The unified ReadyVibe Skills marketplace bundle (dist/agensi/ReadyVibe-Skills.zip).
// Everything here is deterministic: no model is run. The extracted bundle is exercised in isolation, away from this repository.
import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { parse } from "yaml";
import { BUNDLE_SLUG, ZIP_NAME, buildBundle, discoverPublicSkills, extractArchive, matchRoutes, readRoutes, splitFrontmatter, validateArchive, validateBundleDir } from "../tools/lib/bundle.mjs";
import { assertHelpersStart, freshProject, strip } from "../tools/lib/install-check.mjs";

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CI = Boolean(process.env.CI);
const scratch = mkdtempSync(join(tmpdir(), "rv-bundle-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) (e.isDirectory() ? walk(join(dir, e.name), out) : out.push(join(dir, e.name)));
  return out;
}
const treeHash = (dir) => sha(walk(dir).sort().map((f) => `${relative(dir, f)}:${sha(readFileSync(f))}`).join("\n"));

// Independent reading of the canonical skills (does not use the code under test).
const canonical = [];
for (const category of readdirSync(join(root, "skills"))) {
  for (const name of readdirSync(join(root, "skills", category))) {
    const file = join(root, "skills", category, name, "SKILL.md");
    if (!existsSync(file)) continue;
    const front = parse(readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---\n/)[1]);
    if (front.metadata?.internal === true) continue;
    canonical.push({ name, category, dir: join(root, "skills", category, name) });
  }
}
const names = canonical.map((s) => s.name).sort();

const skillsBefore = treeHash(join(root, "skills"));
const outDir = join(scratch, "out");
const built = await buildBundle({ root, outDir });
const zipPath = join(outDir, ZIP_NAME);
const extractedParent = join(scratch, "extracted");
const bundle = await extractArchive(zipPath, extractedParent);
const manifest = JSON.parse(readFileSync(join(bundle, "manifest.json"), "utf8"));
const routes = await readRoutes(root);

describe("archive shape", () => {
  test("the build writes dist-style output: ReadyVibe-Skills.zip with one top-level folder", () => {
    assert.ok(existsSync(zipPath));
    const members = execFileSync("unzip", ["-Z", "-1", zipPath], { encoding: "utf8" }).trim().split("\n");
    assert.deepEqual([...new Set(members.map((m) => m.split("/")[0]))], [BUNDLE_SLUG]);
    assert.equal(built.report.topLevelFolder, "readyvibe-skills");
  });

  test("exactly one SKILL.md exists in the whole archive, at the bundle root", () => {
    const members = execFileSync("unzip", ["-Z", "-1", zipPath], { encoding: "utf8" }).trim().split("\n");
    const skillFiles = members.filter((m) => m.split("/").pop().toLowerCase() === "skill.md");
    assert.deepEqual(skillFiles, ["readyvibe-skills/SKILL.md"]);
  });

  test("the archive passes the unsafe-path, hidden-file, symlink and duplicate checks", async () => {
    const members = await validateArchive(zipPath);
    assert.equal(members.length, built.report.files);
    assert.ok(members.every((m) => !m.split("/").some((p) => p.startsWith("."))));
  });

  test("the extracted bundle contains no symlinks or hidden files", () => {
    for (const f of walk(bundle)) {
      assert.ok(!lstatSync(f).isSymbolicLink(), f);
      assert.ok(!relative(bundle, f).split("/").some((p) => p.startsWith(".")), f);
    }
  });

  test("the archive is reproducible: the same inputs give the same bytes", async () => {
    const again = await buildBundle({ root, check: true });
    assert.equal(again.report.sha256, built.report.sha256);
  });
});

describe("identity and licensing", () => {
  const { data, body } = splitFrontmatter(readFileSync(join(bundle, "SKILL.md"), "utf8"), "SKILL.md");

  test("the entry point identifies ReadyVibe Skills, not a specialist", () => {
    assert.equal(data.name, "readyvibe-skills");
    assert.equal(data.metadata["display-name"], "ReadyVibe Skills");
    assert.equal(data.license, "Apache-2.0");
    assert.match(body, /^# ReadyVibe Skills$/m);
    assert.ok(!names.includes(data.name), "the bundle slug must not collide with a specialist");
    assert.match(data.description, /^Use when /);
    assert.match(data.description, /Do not use/);
    assert.ok(data.description.length <= 1024);
    for (const area of ["security", "accessibility", "SEO", "performance", "privacy", "forms"]) assert.ok(data.description.toLowerCase().includes(area.toLowerCase()), `description should cover ${area}`);
    assert.ok(data.description.includes(String(names.length)));
  });

  test("LICENSE and NOTICE are the repository's own, byte for byte", () => {
    assert.ok(readFileSync(join(bundle, "LICENSE")).equals(readFileSync(join(root, "LICENSE"))));
    assert.ok(readFileSync(join(bundle, "NOTICE")).equals(readFileSync(join(root, "NOTICE"))));
    assert.match(readFileSync(join(bundle, "LICENSE"), "utf8"), /Apache License/);
    assert.match(readFileSync(join(bundle, "README.md"), "utf8"), /Apache-2\.0/);
    assert.match(readFileSync(join(bundle, "README.md"), "utf8"), /github\.com\/moh-obaida\/ReadyVibe-Skills/);
    assert.equal(manifest.license, "Apache-2.0");
  });
});

describe("every public skill is packaged exactly once", () => {
  test("the manifest, the modules, and the canonical skills agree", () => {
    assert.ok(names.length >= 55, `expected at least 55 public skills, found ${names.length}`);
    assert.deepEqual(manifest.skills.map((s) => s.name).sort(), names);
    assert.equal(manifest.skillCount, names.length);
    const methods = walk(join(bundle, "modules")).filter((f) => f.endsWith("/METHOD.md"));
    assert.equal(methods.length, names.length);
    for (const s of canonical) assert.ok(existsSync(join(bundle, "modules", s.category, s.name, "METHOD.md")), `${s.name} missing`);
  });

  test("internal skills are excluded, and so are skills outside skills/", async () => {
    const fake = mkdtempSync(join(scratch, "internal-"));
    writeFileSync(join(fake, "package.json"), '{"version":"1.2.3"}');
    for (const [name, internal] of [["public-one", false], ["private-one", true]]) {
      const dir = join(fake, "skills", "quality", name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: "Use when x. Do not use y."\nmetadata:\n  internal: ${internal}\n---\n# ${name}\n`);
    }
    const { skills, internal } = await discoverPublicSkills(fake);
    assert.deepEqual(skills.map((s) => s.name), ["public-one"]);
    assert.deepEqual(internal, ["private-one"]);
    assert.ok(!manifest.skills.some((s) => s.name === "private-one"));
  });

  test("each METHOD.md is its canonical SKILL.md: same frontmatter, same body, plus the bundle banner", () => {
    for (const s of canonical) {
      const original = readFileSync(join(s.dir, "SKILL.md"), "utf8");
      const packed = readFileSync(join(bundle, "modules", s.category, s.name, "METHOD.md"), "utf8");
      const front = original.match(/^---\n[\s\S]*?\n---\n/)[0];
      assert.ok(packed.startsWith(front), `${s.name}: frontmatter changed`);
      const origBody = original.slice(front.length).replaceAll("SKILL.md", "METHOD.md");
      assert.ok(packed.endsWith(origBody), `${s.name}: body changed`);
      assert.match(packed.slice(front.length, packed.length - origBody.length), /ReadyVibe Skills bundle: packaged method/);
    }
  });

  test("every canonical references/ and scripts/ file is packaged byte for byte, and nothing extra is", () => {
    for (const s of canonical) {
      for (const part of ["references", "scripts"]) {
        const src = join(s.dir, part);
        const dest = join(bundle, "modules", s.category, s.name, part);
        const want = existsSync(src) ? walk(src).map((f) => relative(src, f)).sort() : [];
        const have = existsSync(dest) ? walk(dest).map((f) => relative(dest, f)).sort() : [];
        assert.deepEqual(have, want, `${s.name}/${part}`);
        for (const f of want) assert.ok(readFileSync(join(src, f)).equals(readFileSync(join(dest, f))), `${s.name}/${part}/${f}`);
      }
    }
  });

  test("the generated bundle does not change the canonical skills", () => {
    assert.equal(treeHash(join(root, "skills")), skillsBefore);
  });
});

describe("catalog and routing", () => {
  const catalog = readFileSync(join(bundle, "references", "skill-catalog.md"), "utf8");
  const master = readFileSync(join(bundle, "SKILL.md"), "utf8");

  test("every catalog entry exists once and every method path resolves", () => {
    for (const s of canonical) {
      assert.equal((catalog.match(new RegExp(`^### ${s.name}$`, "gm")) ?? []).length, 1, s.name);
      const link = `](../modules/${s.category}/${s.name}/METHOD.md)`;
      assert.ok(catalog.includes(link), `${s.name}: catalog link missing`);
      assert.ok(existsSync(join(bundle, "modules", s.category, s.name, "METHOD.md")));
    }
  });

  test("no method is unreachable: every skill is on a route, and the master points at the catalog", () => {
    const routed = new Set(routes.flatMap((r) => r.load));
    for (const n of names) assert.ok(routed.has(n), `${n} is on no route`);
    for (const r of routes) for (const n of r.load) assert.ok(names.includes(n), `route ${r.id} names unknown skill ${n}`);
    assert.match(master, /references\/skill-catalog\.md/);
    assert.match(master, /references\/routing-guide\.md/);
  });

  test("the catalog reflects the skills' own declared metadata", () => {
    for (const entry of manifest.skills) {
      const front = parse(readFileSync(join(root, entry.canonicalSource, "SKILL.md"), "utf8").match(/^---\n([\s\S]*?)\n---\n/)[1]);
      assert.equal(entry.kind, front.metadata.kind);
      assert.deepEqual(entry.helpers, String(front.metadata.helpers ?? "").split(",").map((x) => x.trim()).filter(Boolean));
      assert.deepEqual(entry.companions, String(front.metadata.companions ?? "").split(",").map((x) => x.trim()).filter(Boolean));
    }
    assert.equal(manifest.launchChecks, 40);
    assert.equal(manifest.complianceDomains, 12);
  });

  // Representative routes. The first skill of the route's load list is the entry method.
  const scenarios = [
    ["Make my entire website ready to launch.", "full-launch", "launch-all"],
    ["Fix my website's SEO.", "seo", "seo-readiness"],
    ["Make my website accessible with a keyboard and screen reader.", "accessibility", "wcag-readiness"],
    ["Audit my authentication security.", "security", "web-security"],
    ["Check that my signup form submits correctly.", "forms", "forms-readiness"],
    ["Make my website mobile-friendly.", "mobile", "mobile-readiness"],
  ];
  for (const [request, routeId, entry] of scenarios) {
    test(`route: "${request}" -> ${entry}`, () => {
      const [top] = matchRoutes(request, routes);
      assert.equal(top.id, routeId);
      assert.equal(top.load[0], entry);
      const s = canonical.find((x) => x.name === entry);
      const method = join(bundle, "modules", s.category, s.name, "METHOD.md");
      assert.ok(existsSync(method));
      assert.ok(master.includes(`modules/${s.category}/${s.name}/METHOD.md`), "the master's route table names this method");
    });
  }

  test("whole-site launch uses launch-all, which declares and can reach its lanes inside the bundle", () => {
    const launch = manifest.skills.find((s) => s.name === "launch-all");
    assert.equal(launch.launchChecks.length, 40);
    for (const c of launch.companions) {
      assert.ok(manifest.skills.some((s) => s.name === c), `${c} is bundled`);
      assert.match(readFileSync(join(bundle, "modules/core/launch-all/references/companion-methods.md"), "utf8"), new RegExp(`^### ${c}$`, "m"));
    }
  });

  test("a specialist with a companion fallback resolves both the full method and the reduced-depth entry", () => {
    const mobile = manifest.skills.find((s) => s.name === "mobile-readiness");
    assert.deepEqual(mobile.companions, ["design-system-reconnaissance"]);
    const fallback = readFileSync(join(bundle, "modules/quality/mobile-readiness/references/companion-methods.md"), "utf8");
    assert.match(fallback, /^### design-system-reconnaissance$/m);
    assert.ok(existsSync(join(bundle, "modules/core/design-system-reconnaissance/METHOD.md")));
    const method = readFileSync(join(bundle, "modules/quality/mobile-readiness/METHOD.md"), "utf8");
    assert.match(method, /## Working alone/);
  });
});

describe("the extracted bundle is self-contained", () => {
  test("links, helpers, imports, references, companions and checksums all resolve inside the bundle", async () => {
    assert.deepEqual(await validateBundleDir(bundle, { expected: names }), []);
  });

  test("no packaged text points at a path that exists only in the source repository", () => {
    for (const f of walk(bundle).filter((x) => x.endsWith(".md") && x.includes("/modules/"))) {
      const text = readFileSync(f, "utf8").replace(/https?:\/\/\S+/g, "");
      assert.ok(!/(^|[^\w/.~-])(?:docs\/references|tools\/(?:sync|lint)-skills|skills\/(?:core|compliance|quality|security)\/)/.test(text), relative(bundle, f));
    }
  });

  test("every module's helpers start from the extracted bundle with the source repository absent from the working directory", async () => {
    const cwd = mkdtempSync(join(scratch, "cwd-"));
    for (const entry of manifest.skills) {
      if (!entry.helpers.length) continue;
      await assertHelpersStart(entry.name, join(bundle, "modules", entry.category, entry.name), entry.helpers, cwd);
    }
  });

  test("bundled helpers do real work from the extracted bundle", async () => {
    const cwd = mkdtempSync(join(scratch, "work-"));
    const site = join(cwd, "leaky-site");
    cpSync(join(root, "fixtures", "leaky-site"), site, { recursive: true });
    const seo = await run(process.execPath, [join(bundle, "modules/discoverability/seo-readiness/scripts/inspect-metadata.mjs"), "--dir", site, "--json"], { cwd });
    assert.ok(JSON.parse(seo.stdout).findings.some((f) => f.code === "CANONICAL_LOCALHOST"));
    const links = await run(process.execPath, [join(bundle, "modules/quality/link-integrity/scripts/check-links.mjs"), "--dir", site, "--json"], { cwd });
    assert.ok(JSON.parse(links.stdout).findings.some((f) => f.code === "LINK_BROKEN"));
    const markup = await run(process.execPath, [join(bundle, "modules/accessibility/wcag-readiness/scripts/audit-markup.mjs"), "--dir", join(root, "fixtures", "mobile-bad"), "--json"], { cwd }).catch((e) => e);
    assert.ok(String(markup.stdout ?? "").includes("findings"), "audit-markup ran from the bundle");
    const secrets = await run(process.execPath, [join(bundle, "modules/security/web-security/scripts/scan-secrets.mjs"), "--root", site, "--json"], { cwd }).catch((e) => e);
    assert.ok(String(secrets.stdout ?? "").includes("findings"), "scan-secrets ran from the bundle");
  });
});

describe("listing draft", () => {
  const listing = readFileSync(join(root, "docs", "marketplace", "agensi-listing.md"), "utf8");

  test("states the real counts, free pricing, license, and source", () => {
    assert.match(listing, new RegExp(`${names.length} (specialist|launch-readiness)`));
    assert.match(listing, new RegExp(`${manifest.launchChecks} launch checks`));
    assert.match(listing, new RegExp(`${manifest.complianceDomains} (conditional )?compliance domains`));
    assert.match(listing, /^Free\.$/m);
    assert.match(listing, /Apache-2\.0/);
    assert.match(listing, /github\.com\/moh-obaida\/ReadyVibe-Skills/);
    assert.match(listing, /^# Agensi listing draft: ReadyVibe Skills$/m);
  });

  test("leaves the demo and media pending instead of inventing them", () => {
    assert.match(listing, /Demonstration output: PENDING/);
    assert.match(listing, /\*\*PENDING\.\*\* The repository contains no ReadyVibe logo/);
  });

  test("names only skills that exist", () => {
    for (const m of listing.matchAll(/--skill ([a-z0-9-]+)/g)) assert.ok(names.includes(m[1]), m[1]);
  });
});

describe("validation rejects broken bundles", () => {
  function copyBundle() {
    const dest = join(mkdtempSync(join(scratch, "mut-")), BUNDLE_SLUG);
    cpSync(bundle, dest, { recursive: true });
    return dest;
  }
  const problemsOf = (dir) => validateBundleDir(dir, { expected: names });

  test("a second SKILL.md", async () => {
    const dir = copyBundle();
    writeFileSync(join(dir, "modules/quality/mobile-readiness/SKILL.md"), "---\nname: x\n---\n");
    assert.ok((await problemsOf(dir)).some((p) => /exactly one SKILL\.md/.test(p)));
  });
  test("a missing helper script", async () => {
    const dir = copyBundle();
    rmSync(join(dir, "modules/discoverability/seo-readiness/scripts/inspect-metadata.mjs"));
    assert.ok((await problemsOf(dir)).some((p) => /inspect-metadata/.test(p)));
  });
  test("a broken relative link", async () => {
    const dir = copyBundle();
    const f = join(dir, "modules/core/launch-all/METHOD.md");
    writeFileSync(f, `${readFileSync(f, "utf8")}\n[gone](references/not-there.md)\n`);
    assert.ok((await problemsOf(dir)).some((p) => /broken relative link/.test(p)));
  });
  test("a broken import", async () => {
    const dir = copyBundle();
    rmSync(join(dir, "modules/discoverability/seo-readiness/scripts/lib/html.mjs"));
    assert.ok((await problemsOf(dir)).some((p) => /does not resolve|not packaged|missing file/.test(p)));
  });
  test("a symlink and a hidden file", async () => {
    const dir = copyBundle();
    symlinkSync(join(dir, "LICENSE"), join(dir, "references", "link.md"));
    await assert.rejects(() => problemsOf(dir), /symlink/);
    rmSync(join(dir, "references", "link.md"));
    writeFileSync(join(dir, ".env"), "x");
    assert.ok((await problemsOf(dir)).some((p) => /hidden/.test(p)));
  });
  test("a modified method (checksum drift) and a skill that is not listed", async () => {
    const dir = copyBundle();
    writeFileSync(join(dir, "modules/core/launch-all/METHOD.md"), `${readFileSync(join(dir, "modules/core/launch-all/METHOD.md"), "utf8")}\ntampered\n`);
    assert.ok((await problemsOf(dir)).some((p) => /checksum mismatch/.test(p)));
    assert.ok((await validateBundleDir(dir, { expected: [...names, "ghost-skill"] })).some((p) => /ghost-skill/.test(p)));
  });
  test("a wrong master identity", async () => {
    const dir = copyBundle();
    const f = join(dir, "SKILL.md");
    writeFileSync(f, readFileSync(f, "utf8").replace("name: readyvibe-skills", "name: wcag-readiness"));
    assert.ok((await problemsOf(dir)).some((p) => /name must be readyvibe-skills/.test(p)));
  });
  test("archives with a symlink or a second SKILL.md are refused", async () => {
    const make = (setup) => {
      const dir = mkdtempSync(join(scratch, "zip-"));
      const top = join(dir, BUNDLE_SLUG);
      cpSync(bundle, top, { recursive: true });
      setup(top, dir);
      const zip = join(dir, "bad.zip");
      return { zip, dir, top };
    };
    let t = make((top) => symlinkSync(join(top, "LICENSE"), join(top, "link.md")));
    execFileSync("zip", ["-q", "-r", "-y", t.zip, BUNDLE_SLUG], { cwd: t.dir });
    await assert.rejects(() => validateArchive(t.zip), /symlink/);
    t = make((top) => writeFileSync(join(top, "modules", "skill.md"), "x"));
    execFileSync("zip", ["-q", "-r", t.zip, BUNDLE_SLUG], { cwd: t.dir });
    await assert.rejects(() => validateArchive(t.zip), /exactly one SKILL\.md/);
  });
  test("a wrong top-level folder name is refused", async () => {
    const dir = mkdtempSync(join(scratch, "zip-"));
    cpSync(bundle, join(dir, "ReadyVibe"), { recursive: true });
    execFileSync("zip", ["-q", "-r", "wrong.zip", "ReadyVibe"], { cwd: dir });
    await assert.rejects(() => validateArchive(join(dir, "wrong.zip")), /top-level folder/);
  });
});

describe("the build fails clearly instead of repairing canonical content", () => {
  function repoCopy() {
    const dest = mkdtempSync(join(scratch, "repo-"));
    for (const p of ["skills", "scripts", "tools", "marketplace", "package.json", "LICENSE", "NOTICE"]) cpSync(join(root, p), join(dest, p), { recursive: true });
    mkdirSync(join(dest, "docs"));
    cpSync(join(root, "docs", "references"), join(dest, "docs", "references"), { recursive: true });
    symlinkSync(join(root, "node_modules"), join(dest, "node_modules"));
    return dest;
  }

  test("a copy of the repository builds the same archive (the build does not depend on this checkout's location)", async () => {
    const copy = repoCopy();
    const result = await buildBundle({ root: copy, check: true });
    assert.equal(result.report.sha256, built.report.sha256);
  });

  test("a stale vendored helper fails the build and is not silently fixed", async () => {
    const copy = repoCopy();
    const file = join(copy, "skills/discoverability/seo-readiness/scripts/inspect-metadata.mjs");
    writeFileSync(file, `${readFileSync(file, "utf8")}\n// drift\n`);
    await assert.rejects(() => buildBundle({ root: copy, check: true }), /out of sync/);
    assert.match(readFileSync(file, "utf8"), /\/\/ drift/, "the canonical content was left alone");
  });

  test("a canonical skill that fails lint fails the build", async () => {
    const copy = repoCopy();
    const file = join(copy, "skills/quality/error-pages/SKILL.md");
    writeFileSync(file, readFileSync(file, "utf8").replace(/Do not use/g, "Avoid"));
    await assert.rejects(() => buildBundle({ root: copy, check: true, preflight: { sync: false, lint: true } }), /lint failed/);
  });

  test("a public skill with no route fails the build", async () => {
    const copy = repoCopy();
    const file = join(copy, "marketplace/bundle/routes.json");
    const json = JSON.parse(readFileSync(file, "utf8"));
    for (const r of json.routes) r.load = r.load.filter((n) => n !== "faq-readiness");
    json.routes = json.routes.filter((r) => r.load.length);
    writeFileSync(file, JSON.stringify(json));
    await assert.rejects(() => buildBundle({ root: copy, check: true, preflight: { sync: false, lint: false } }), /faq-readiness/);
  });

  test("an unexpected file inside a skill folder fails the build", async () => {
    const copy = repoCopy();
    writeFileSync(join(copy, "skills/quality/error-pages/notes.md"), "stray");
    await assert.rejects(() => buildBundle({ root: copy, check: true, preflight: { sync: false, lint: false } }), /unexpected entry "notes\.md"/);
  });

  test("a symlink or a hidden file inside a skill fails the build", async () => {
    let copy = repoCopy();
    symlinkSync(join(copy, "LICENSE"), join(copy, "skills/quality/error-pages/references/link.md"));
    await assert.rejects(() => buildBundle({ root: copy, check: true, preflight: { sync: false, lint: false } }), /symlink/);
    copy = repoCopy();
    writeFileSync(join(copy, "skills/quality/error-pages/references/.secret"), "x");
    await assert.rejects(() => buildBundle({ root: copy, check: true, preflight: { sync: false, lint: false } }), /hidden file/);
  });

  test("a stray SKILL.md outside skills/<category>/<name>/ fails the build", async () => {
    const copy = repoCopy();
    mkdirSync(join(copy, "skills/quality/error-pages/references/deep"), { recursive: true });
    writeFileSync(join(copy, "skills/quality/error-pages/references/deep/SKILL.md"), "---\nname: x\n---\n");
    await assert.rejects(() => buildBundle({ root: copy, check: true, preflight: { sync: false, lint: false } }), /SKILL\.md outside/);
  });
});

// Real Skills CLI. Locally these are skipped when the CLI cannot be fetched (offline); in CI they are mandatory.
// `listSkills` in install-check.mjs expects the plural "Found N skills"; a single skill prints "Found 1 skill".
async function listBundle(spec) {
  const { stdout, stderr } = await run("npx", ["-y", "skills", "add", spec, "--list"], { timeout: 240000, maxBuffer: 30_000_000 });
  const raw = strip(`${stdout}${stderr}`);
  const found = raw.match(/Found (\d+) skills?/);
  assert.ok(found, `the Skills CLI did not list skills for ${spec}:\n${raw.slice(0, 400)}`);
  return { count: Number(found[1]), names: [...raw.matchAll(/^│\s{4}([a-z0-9]+(?:-[a-z0-9]+)*)\s*$/gm)].map((m) => m[1]) };
}
let listing = null;
try {
  listing = await listBundle(bundle);
} catch {
  listing = null;
}
const available = listing !== null;
const skip = available || CI ? false : "The Skills CLI could not be run (offline?). Not run.";

describe("Skills CLI against the extracted bundle", () => {
  test("the Skills CLI is available (mandatory in CI)", () => {
    if (CI) assert.ok(available);
  });

  test("auto-detection finds exactly one skill, named readyvibe-skills", { skip }, () => {
    assert.equal(listing.count, 1);
    assert.deepEqual(listing.names, ["readyvibe-skills"]);
  });

  test("a real install keeps every file, and the routed methods and helpers work from the installed copy", { skip }, async () => {
    const project = freshProject("rv-bundle-install-");
    await run("npx", ["-y", "skills", "add", bundle, "-y", "--agent", "claude-code"], { cwd: project, timeout: 240000, maxBuffer: 30_000_000 });
    const installed = join(project, ".claude", "skills", BUNDLE_SLUG);
    assert.ok(existsSync(join(installed, "SKILL.md")));
    assert.deepEqual(walk(installed).map((f) => relative(installed, f)).sort(), walk(bundle).map((f) => relative(bundle, f)).sort());
    assert.deepEqual(await validateBundleDir(installed, { expected: names }), []);

    // Follow the router's path for a narrow request from the installed copy.
    const [top] = matchRoutes("Fix my website's SEO.", routes);
    const seo = manifest.skills.find((s) => s.name === top.load[0]);
    assert.ok(existsSync(join(installed, seo.method)));
    const site = mkdtempSync(join(scratch, "site-"));
    cpSync(join(root, "fixtures", "leaky-site"), site, { recursive: true });
    const out = await run(process.execPath, [join(installed, "modules", seo.category, seo.name, "scripts", "inspect-metadata.mjs"), "--dir", site, "--json"], { cwd: project });
    assert.ok(JSON.parse(out.stdout).findings.some((f) => f.code === "CANONICAL_LOCALHOST"));
  });
});
