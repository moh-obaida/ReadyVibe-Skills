import { readFileSync, renameSync, writeFileSync, realpathSync, mkdirSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv, type ValidateFunction } from "ajv";
import { ArtifactError } from "./errors.js";
import { canonicalJson, contentHash } from "./canonical.js";
import { findSecret } from "./secrets.js";
import type { ArtifactEnvelope, ArtifactKind } from "./types.js";

const SUPPORTED: Record<string, number> = { "1": 0 };
const STATUS_KINDS = new Set<ArtifactKind>(["findings", "report", "launch-manifest", "baseline"]);

const schemaDir = fileURLToPath(new URL("../schemas/", import.meta.url));

function loadSchema(name: string): object {
  return JSON.parse(readFileSync(resolve(schemaDir, name), "utf8")) as object;
}

const ajv = new Ajv({ allErrors: true, strict: false });
const envelopeValidate = ajv.compile(loadSchema("envelope.schema.json"));
const dataValidators: Partial<Record<ArtifactKind, ValidateFunction>> = {
  questions: ajv.compile(loadSchema("questions.schema.json")),
  findings: ajv.compile(loadSchema("findings.schema.json")),
  report: ajv.compile(loadSchema("report.schema.json")),
  "reality-model": ajv.compile(loadSchema("reality-model.schema.json")),
  "launch-manifest": ajv.compile(loadSchema("launch-manifest.schema.json")),
  baseline: ajv.compile(loadSchema("baseline.schema.json")),
  "evidence-index": ajv.compile(loadSchema("evidence-index.schema.json")),
  plan: ajv.compile(loadSchema("plan.schema.json")),
  ledger: ajv.compile(loadSchema("ledger.schema.json")),
};

export interface ReadOptions {
  /** When set, the file must resolve inside `<root>/.readyvibe`. */
  readyvibeRoot?: string;
  /** Skip hash check only for tests that construct envelopes before hashing. */
  expectHash?: boolean;
}

export function assertInsideReadyvibe(filePath: string, projectRoot: string): void {
  const readyvibe = resolve(projectRoot, ".readyvibe");
  const realRoot = realpathSync(readyvibe);
  const real = realpathSync(filePath);
  if (!(real === realRoot || real.startsWith(realRoot + sep))) {
    throw new ArtifactError("ARTIFACT_PATH_ESCAPE", `Path escapes .readyvibe: ${filePath}`);
  }
}

export function validateArtifact(raw: unknown, options: { checkHash?: boolean } = {}): ArtifactEnvelope {
  const warnings: string[] = [];
  if (!envelopeValidate(raw)) {
    const pointer = envelopeValidate.errors?.[0]?.instancePath || "/";
    throw new ArtifactError(
      "ARTIFACT_INVALID",
      `Envelope is invalid: ${ajv.errorsText(envelopeValidate.errors)}`,
      pointer,
    );
  }
  const envelope = raw as ArtifactEnvelope;
  const [majorText, minorText] = envelope.schemaVersion.split(".");
  const major = majorText ?? "";
  const minor = Number(minorText);
  const supportedMinor = SUPPORTED[major];
  if (supportedMinor === undefined) {
    throw new ArtifactError(
      "ARTIFACT_MAJOR_UNSUPPORTED",
      `Unsupported schema major ${major}. Run readyvibe migrate.`,
    );
  }
  const secret = findSecret(envelope.data);
  if (secret) {
    throw new ArtifactError(
      "ARTIFACT_CONTAINS_SECRET",
      `Artifact data matches secret pattern ${secret} (value redacted)`,
    );
  }
  if (STATUS_KINDS.has(envelope.kind) && envelope.producer.type !== "ENGINE") {
    throw new ArtifactError(
      "ARTIFACT_STATUS_AUTHORITY",
      `${envelope.kind} artifacts may only be produced by the engine`,
    );
  }
  const dataValidate = dataValidators[envelope.kind];
  if (!dataValidate) {
    throw new ArtifactError("ARTIFACT_INVALID", `No schema registered for kind ${envelope.kind}`, "/kind");
  }
  if (minor > supportedMinor) {
    warnings.push("ARTIFACT_NEWER_MINOR");
  } else if (!dataValidate(envelope.data)) {
    const err = dataValidate.errors?.[0];
    const unknown = err?.keyword === "additionalProperties";
    throw new ArtifactError(
      "ARTIFACT_INVALID",
      unknown
        ? `Unknown property in data: ${err?.params ? JSON.stringify(err.params) : err?.message}`
        : `Data is invalid: ${ajv.errorsText(dataValidate.errors)}`,
      err?.instancePath || "/data",
      warnings,
    );
  }
  if (options.checkHash !== false) {
    const expected = contentHash(envelope.data);
    if (envelope.contentHash !== expected) {
      throw new ArtifactError("ARTIFACT_HASH_MISMATCH", "contentHash does not match canonical data");
    }
  }
  if (warnings.length) {
    (envelope as ArtifactEnvelope & { warnings?: string[] }).warnings = warnings;
  }
  return envelope;
}

export function seal<T>(partial: Omit<ArtifactEnvelope<T>, "contentHash"> & { contentHash?: string }): ArtifactEnvelope<T> {
  const envelope: ArtifactEnvelope<T> = {
    ...partial,
    contentHash: contentHash(partial.data),
  };
  return validateArtifact(envelope) as ArtifactEnvelope<T>;
}

export function readArtifact(filePath: string, projectRoot?: string): ArtifactEnvelope {
  if (projectRoot) assertInsideReadyvibe(filePath, projectRoot);
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  return validateArtifact(raw);
}

export function writeArtifact(filePath: string, envelope: ArtifactEnvelope, projectRoot?: string): void {
  const sealed = seal(envelope);
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  writeFileSync(tmp, `${canonicalJson(sealed)}\n`);
  renameSync(tmp, filePath);
  if (projectRoot) assertInsideReadyvibe(filePath, projectRoot);
}

export { canonicalJson, contentHash };
