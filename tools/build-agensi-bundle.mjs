#!/usr/bin/env node
// Build (or just validate) the unified ReadyVibe Skills marketplace bundle: dist/agensi/ReadyVibe-Skills.zip.
// The Skills CLI distribution of the individual skills is unaffected.
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBundle } from "./lib/bundle.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

if (args.includes("--help")) {
  console.log("Usage: node tools/build-agensi-bundle.mjs [--check] [--out <dir>]");
  console.log("  (default)  build dist/agensi/ReadyVibe-Skills.zip and bundle-report.json");
  console.log("  --check    run every check and validate the archive, but write nothing");
  process.exit(0);
}
const unknown = args.filter((a, i) => !["--check", "--out"].includes(a) && args[i - 1] !== "--out");
const outIndex = args.indexOf("--out");
if (unknown.length || (outIndex >= 0 && !args[outIndex + 1])) {
  console.error("Unknown or incomplete arguments. See --help.");
  process.exit(2);
}
const check = args.includes("--check");

try {
  const { report, outPath } = await buildBundle({ root, check, outDir: outIndex >= 0 ? resolve(args[outIndex + 1]) : undefined });
  console.log(`ReadyVibe Skills marketplace bundle ${check ? "check" : "build"}: OK`);
  for (const s of report.steps) console.log(`  ✓ ${s}`);
  console.log(`  skills: ${report.skills}   launch checks: ${report.launchChecks}   compliance domains: ${report.complianceDomains}`);
  console.log(`  files: ${report.files}   size: ${(report.sizeBytes / 1024).toFixed(0)} KiB   sha256: ${report.sha256}`);
  console.log(outPath ? `  output: ${outPath}` : "  (check mode: nothing written)");
} catch (error) {
  console.error(`ReadyVibe Skills marketplace bundle ${check ? "check" : "build"}: FAILED\n${error.message}`);
  process.exit(1);
}
