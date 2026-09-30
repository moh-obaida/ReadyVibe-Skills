#!/usr/bin/env node
// sync-skills.mjs - vendor shared helper scripts and reference docs into the skills that use them.
//
// Why: `npx skills add` copies ONLY a skill's own folder. Top-level scripts/ and docs/ are never
// installed, so every skill that runs a helper or cites a shared reference must carry its own copy.
// Canonical sources: scripts/ (tested) and docs/references/. Copies: skills/<cat>/<name>/scripts/ and
// skills/<cat>/<name>/references/.
//
//   node tools/sync-skills.mjs                  copy helpers into each skill (creates/updates/removes)
//   node tools/sync-skills.mjs --check          exit 1 if any vendored copy is missing, stale, or extra
//
// A skill declares what it needs in SKILL.md frontmatter:
//   metadata.helpers:    "check-links,inspect-metadata"     -> scripts/<name>.mjs (+ its lib/ imports)
//   metadata.references: "official-sources"                 -> docs/references/<name>.md
//   metadata.companions: "data-flow-mapping,data-rights"    -> references/companion-methods.md, GENERATED from
//                        docs/references/companion-methods.md with only those skills' entries
// Transitive imports of ./lib/*.mjs are followed automatically.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildCompanionFile, parseCompanionLibrary } from "./lib/companions.mjs";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = join(root, "scripts");
const check = process.argv.includes("--check");

function skillDirs() {
  const out = [];
  for (const cat of readdirSync(join(root, "skills"))) {
    const catDir = join(root, "skills", cat);
    if (!statSync(catDir).isDirectory()) continue;
    for (const name of readdirSync(catDir)) {
      if (existsSync(join(catDir, name, "SKILL.md"))) out.push(join(catDir, name));
    }
  }
  return out;
}

function helpersOf(skillMd) {
  const front = skillMd.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const m = front.match(/^\s*helpers:\s*"([^"]*)"/m);
  return m ? m[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
}

function referencesOf(skillMd) {
  const front = skillMd.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const m = front.match(/^\s*references:\s*"([^"]*)"/m);
  return m ? m[1].split(",").map((x) => x.trim()).filter(Boolean) : [];
}

function companionsOf(skillMd) {
  const front = skillMd.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const m = front.match(/^\s*companions:\s*"([^"]*)"/m);
  return m ? m[1].split(",").map((x) => x.trim()).filter(Boolean) : [];
}

const libraryPath = join(root, "docs", "references", "companion-methods.md");
const library = existsSync(libraryPath) ? parseCompanionLibrary(readFileSync(libraryPath, "utf8")) : null;

function closure(helpers) {
  const files = new Set();
  const visit = (rel) => {
    if (files.has(rel)) return;
    const abs = join(canonical, rel);
    if (!existsSync(abs)) throw new Error(`helper file not found: scripts/${rel}`);
    files.add(rel);
    for (const m of readFileSync(abs, "utf8").matchAll(/from\s+"(\.{1,2}\/[^"]+\.mjs)"/g)) {
      const target = join(dirname(rel), m[1]).replace(/\\/g, "/");
      visit(target);
    }
  };
  for (const h of helpers) visit(`${h}.mjs`);
  return files;
}

function existing(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const abs = join(dir, e);
    if (statSync(abs).isDirectory()) existing(abs, base, out);
    else out.push(abs.slice(base.length + 1).replace(/\\/g, "/"));
  }
  return out;
}

let problems = 0;
let copied = 0;
for (const dir of skillDirs()) {
  const wanted = closure(helpersOf(readFileSync(join(dir, "SKILL.md"), "utf8")));
  const dest = join(dir, "scripts");
  const have = new Set(existing(dest));
  for (const rel of wanted) {
    const src = join(canonical, rel);
    const dst = join(dest, rel);
    const same = existsSync(dst) && readFileSync(src).equals(readFileSync(dst));
    if (same) continue;
    problems++;
    if (check) console.error(`out of date: ${dst.replace(`${root}/`, "")}`);
    else {
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      copied++;
    }
  }
  for (const ref of referencesOf(readFileSync(join(dir, "SKILL.md"), "utf8"))) {
    const src = join(root, "docs", "references", `${ref}.md`);
    const dst = join(dir, "references", `${ref}.md`);
    if (!existsSync(src)) throw new Error(`reference not found: docs/references/${ref}.md`);
    if (existsSync(dst) && readFileSync(src).equals(readFileSync(dst))) continue;
    problems++;
    if (check) console.error(`out of date: ${dst.replace(`${root}/`, "")}`);
    else {
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
      copied++;
    }
  }
  const companions = companionsOf(readFileSync(join(dir, "SKILL.md"), "utf8"));
  const companionDst = join(dir, "references", "companion-methods.md");
  if (companions.length) {
    if (!library) throw new Error("docs/references/companion-methods.md not found");
    const missing = companions.filter((c) => !library.entries.has(c));
    if (missing.length) throw new Error(`${dir.replace(`${root}/`, "")}: no companion-methods entry for ${missing.join(", ")}`);
    const built = buildCompanionFile(library, companions);
    if (!existsSync(companionDst) || readFileSync(companionDst, "utf8") !== built) {
      problems++;
      if (check) console.error(`out of date (generated): ${companionDst.replace(`${root}/`, "")}`);
      else {
        mkdirSync(dirname(companionDst), { recursive: true });
        writeFileSync(companionDst, built);
        copied++;
      }
    }
  } else if (existsSync(companionDst)) {
    problems++;
    if (check) console.error(`unexpected (no companions declared): ${companionDst.replace(`${root}/`, "")}`);
    else rmSync(companionDst);
  }
  for (const rel of have) {
    if (wanted.has(rel)) continue;
    problems++;
    if (check) console.error(`unexpected vendored file: ${join(dest, rel).replace(`${root}/`, "")}`);
    else rmSync(join(dest, rel));
  }
}
if (check) {
  if (problems) {
    console.error(`${problems} vendored file problem(s). Run: node tools/sync-skills.mjs`);
    process.exit(1);
  }
  console.log("vendored helpers are in sync");
} else console.log(`synced: ${copied} file(s) copied`);
