#!/usr/bin/env node
import { readArtifact } from "../artifact.js";
import { ArtifactError } from "../errors.js";

const file = process.argv[2];
const root = process.argv[3];
if (!file) {
  console.error("usage: rv-validate <file> [projectRoot]");
  process.exit(2);
}
try {
  const artifact = readArtifact(file, root);
  console.log(JSON.stringify({ ok: true, kind: artifact.kind, hash: artifact.contentHash }));
} catch (error) {
  if (error instanceof ArtifactError) {
    console.error(JSON.stringify({ ok: false, code: error.code, message: error.message, pointer: error.pointer }));
    process.exit(1);
  }
  throw error;
}
