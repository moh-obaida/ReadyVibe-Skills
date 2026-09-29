import { createHash } from "node:crypto";

/** Deterministic JSON (sorted keys, no insignificant whitespace). Sufficient for artifact hashes. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error("Non-finite numbers cannot be canonicalized");
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const child = (value as Record<string, unknown>)[key];
    if (child === undefined) continue;
    out[key] = canonicalize(child);
  }
  return out;
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function contentHash(data: unknown): string {
  return `sha256:${sha256(canonicalJson(data))}`;
}
