#!/usr/bin/env node
// Create independently installable Agensi archives without changing public Skills CLI distribution.
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildMarketplace } from "./lib/marketplace.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const hasAll = args.includes("--all");
const check = args.includes("--check");
const skillIndex = args.indexOf("--skill");
const only = skillIndex < 0 ? null : args[skillIndex + 1];
const outIndex = args.indexOf("--out");
const out = outIndex < 0 ? null : args[outIndex + 1];

if (args.includes("--help")) {
  console.log("Usage: node tools/package-marketplace.mjs (--all | --skill <slug>) [--out <dir>] [--check]");
  console.log("ZIP contents: <slug>/SKILL.md, vendored files, README, LICENSE, NOTICE.");
  process.exit(0);
}
if ((!hasAll && !only) || (hasAll && only) || (skillIndex >= 0 && !only) || (outIndex >= 0 && !out)) {
  throw new Error("Choose exactly one of --all or --skill <slug>; --out requires a directory.");
}
const manifest = await buildMarketplace({
  root,
  only,
  check,
  outDir: out ? resolve(out) : join(root, "dist", "agensi")
});
console.log((check ? "Validated " : "Built ") + manifest.length + " standalone marketplace archive(s).");
if (!check) console.log("Output: " + (out ? resolve(out) : join(root, "dist", "agensi")));
