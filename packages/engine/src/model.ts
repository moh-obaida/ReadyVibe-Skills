export type CapabilityState = "PRESENT" | "ABSENT" | "SUSPECTED" | "UNKNOWN";

export interface RouteFact {
  path: string;
  file?: string;
  auth: "PUBLIC" | "REQUIRED" | "UNKNOWN";
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  status?: number;
  inSitemap: boolean;
  htmlLang: string | null;
}

export interface RealityModel {
  project: {
    name: string | null;
    frameworks: { id: string; version: string | null }[];
    packageManager: string | null;
    hosting: string | null;
  };
  routes: RouteFact[];
  capabilities: Record<string, CapabilityState>;
  coverage: { scope: string; files: number; routes: number; blindSpots: string[] }[];
  clientStorage: { name: string; mechanism: string; purpose: string; beforeConsent: boolean }[];
  networkDestinations: { origin: string; phase: "PRE_INTERACTION" | "POST_REJECT" | "POST_ACCEPT" | "UNKNOWN"; vendorId: string | null }[];
  vendors: { id: string; name: string; categories: string[] }[];
  declarations: { kind: string; quote: string; file?: string }[];
  dataElements: { name: string; dataClass: string; source: string }[];
  forms: { purpose: string; fields: string[]; precheckedMarketing: boolean }[];
  secrets: { file: string; kind: string; line: number }[];
  headers: Record<string, string>;
  design: { tokens: string[]; components: string[]; cssStrategy: string | null };
  identity: { surfaces: { surface: string; value: string }[]; residue: string[] };
  deletion: { uiCopy: string | null; setsActiveFalse: boolean; hardDelete: boolean } | null;
  email: { marketing: boolean; unsubscribeLink: boolean; suppressionEnforced: boolean } | null;
}

export interface EvidenceItem {
  id: string;
  type: string;
  file?: string;
  lines?: [number, number];
  url?: string;
  observedValue: unknown;
  confidence: "CONFIRMED" | "HIGH" | "MEDIUM" | "LOW";
}
