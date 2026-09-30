// Planted ("canary") identity values and detection of their raw and encoded forms in captured traffic.
// Used to learn where a form submission actually sends personal data, without using anyone's real data.
import { createHash, randomBytes } from "node:crypto";

export function plantIdentity(runId = randomBytes(4).toString("hex")) {
  const id = runId.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "run";
  return {
    email: `rv-${id}-canary@example.test`,
    name: `Zyxqorin Canarywell-${id.slice(0, 4)}`,
    phone: "+15550100123",
    text: `rvcanary-${id}-freetext`,
  };
}

export function encodings(value) {
  const norm = value.trim().toLowerCase();
  return [
    ["raw", value],
    ["url", encodeURIComponent(value)],
    ["base64", Buffer.from(value).toString("base64")],
    ["sha256", createHash("sha256").update(norm).digest("hex")],
    ["md5", createHash("md5").update(norm).digest("hex")],
  ];
}

export function findPlanted(payload, identity) {
  const hits = [];
  const haystack = payload ?? "";
  for (const [field, value] of Object.entries(identity)) {
    for (const [encoding, form] of encodings(value)) {
      if (form.length >= 8 && haystack.includes(form)) hits.push({ field, encoding });
      else if (encoding === "raw" && form.length >= 8 && decodeSafe(haystack).includes(form)) hits.push({ field, encoding: "url" });
    }
  }
  return hits;
}

function decodeSafe(s) {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
}
