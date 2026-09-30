#!/usr/bin/env node
// sync-skill-assets.mjs - vendor helper scripts into the skills that use them.
//
// Why: `npx skills add` copies ONLY a skill's own folder. A top-level scripts/ directory is never
// installed, so every skill that runs a helper must carry its own copy. The canonical source stays in
// scripts/ (where it is tested); this script copies it into skills/<category>/<name>/scripts/.
//
//   node scripts/sync-skill-assets.mjs           copy helpers into each skill (creates/updates/removes)
//   node scripts/sync-skill-assets.mjs --check   exit 1 if any vendored copy is missing, stale, or extra
//
// A skill declares what it needs in SKILL.md frontmatter:  metadata.helpers: "check-links,inspect-metadata"
// Transitive imports of ./lib/*.mjs are followed automatically.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
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
  for (const rel of have) {
    if (wanted.has(rel)) continue;
    problems++;
    if (check) console.error(`unexpected vendored file: ${join(dest, rel).replace(`${root}/`, "")}`);
    else rmSync(join(dest, rel));
  }
}
if (check) {
  if (problems) {
    console.error(`${problems} vendored file problem(s). Run: node scripts/sync-skill-assets.mjs`);
    process.exit(1);
  }
  console.log("vendored helpers are in sync");
} else console.log(`synced: ${copied} file(s) copied`);
