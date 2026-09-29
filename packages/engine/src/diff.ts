import type { RealityModel } from "./model.js";

export interface SemanticDelta {
  kind: string;
  subject: string;
  summary: string;
  affects: string[];
}

export function complianceDiff(base: RealityModel, head: RealityModel): SemanticDelta[] {
  const deltas: SemanticDelta[] = [];
  const baseVendors = new Set(base.vendors.map((v) => v.id));
  for (const vendor of head.vendors) {
    if (!baseVendors.has(vendor.id)) {
      deltas.push({
        kind: "VENDOR_ADDED",
        subject: vendor.id,
        summary: `Adds ${vendor.name} (${vendor.categories.join(", ")}). Consent, CSP, and privacy disclosures may need updates.`,
        affects: ["CONSENT", "CSP", "PRIVACY_POLICY", "VENDOR_INVENTORY"],
      });
    }
  }
  const baseData = new Set(base.dataElements.map((d) => d.name));
  for (const element of head.dataElements) {
    if (!baseData.has(element.name)) {
      deltas.push({
        kind: "DATA_ELEMENT_ADDED",
        subject: element.name,
        summary: `Starts collecting ${element.name} (${element.dataClass}).`,
        affects: ["DATA_INVENTORY", "PRIVACY_POLICY", "MINORS"],
      });
    }
  }
  const baseRoutes = new Set(base.routes.map((r) => r.path));
  for (const route of head.routes) {
    if (!baseRoutes.has(route.path) && route.path !== "/readyvibe-missing-route") {
      deltas.push({
        kind: "ROUTE_ADDED",
        subject: route.path,
        summary: `New route ${route.path} (${route.auth}).`,
        affects: ["INDEXABILITY", "SITEMAP"],
      });
    }
  }
  return deltas;
}
