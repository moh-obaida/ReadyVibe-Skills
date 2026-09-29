#!/usr/bin/env node
import { resolve } from "node:path";
import { lintRepository } from "./lint.js";

const root = resolve(process.argv[2] ?? ".");
const issues = lintRepository(root);
if (issues.length === 0) {
  console.log(JSON.stringify({ ok: true, issues: [] }));
  process.exit(0);
}
console.error(JSON.stringify({ ok: false, issues }, null, 2));
process.exit(1);
