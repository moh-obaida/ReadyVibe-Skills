import { createHash } from "node:crypto";

export interface PlantedIdentity {
  email: string;
  name: string;
  phone: string;
  freeText: string;
}

export function plantIdentity(runId: string): PlantedIdentity {
  const id = runId.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "run";
  return {
    email: `rv-${id}-canary@example.test`,
    name: `Zyxqorin Canarywell-${id.slice(0, 4)}`,
    phone: "+15550100",
    freeText: `rvcanary-${id}-freetext`,
  };
}

export function encodings(value: string): string[] {
  return [
    value,
    encodeURIComponent(value),
    Buffer.from(value).toString("base64"),
    createHash("sha256").update(value.trim().toLowerCase()).digest("hex"),
    createHash("md5").update(value.trim().toLowerCase()).digest("hex"),
  ];
}

export function findPlanted(payload: string, identity: PlantedIdentity): { field: string; encoding: string }[] {
  const hits: { field: string; encoding: string }[] = [];
  for (const [field, value] of Object.entries(identity)) {
    const forms = encodings(value);
    forms.forEach((form, index) => {
      if (form.length >= 8 && payload.includes(form)) {
        hits.push({ field, encoding: ["raw", "url", "base64", "sha256", "md5"][index] ?? "raw" });
      }
    });
  }
  return hits;
}
