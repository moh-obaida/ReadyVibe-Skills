export interface HeadEdit {
  key: string;
  html: string;
}

export interface FrameworkAdapter {
  id: string;
  head(edit: HeadEdit): string;
  notFoundStatus: number;
}

export const adapters: Record<string, FrameworkAdapter> = {
  nextjs: {
    id: "nextjs",
    head: (edit) => `export const metadata = ${JSON.stringify({ title: edit.html })}`,
    notFoundStatus: 404,
  },
  "vite-react": {
    id: "vite-react",
    head: (edit) => `<!-- ${edit.key} -->\n${edit.html}`,
    notFoundStatus: 200,
  },
  "static-html": {
    id: "static-html",
    head: (edit) => edit.html,
    notFoundStatus: 404,
  },
};

export function adapterFor(frameworks: { id: string }[]): FrameworkAdapter {
  const id = frameworks[0]?.id ?? "static-html";
  return adapters[id] ?? adapters["static-html"]!;
}

export interface HostingFacts {
  id: string;
  headerFile: string | null;
  unknownRoutes: "FRAMEWORK" | "SPA_FALLBACK_200" | "HOST_404";
}

export function hostingFrom(signals: { vercel: boolean; netlify: boolean; cloudflare: boolean; spaFallback: boolean }): HostingFacts {
  if (signals.vercel) return { id: "vercel", headerFile: "vercel.json", unknownRoutes: signals.spaFallback ? "SPA_FALLBACK_200" : "FRAMEWORK" };
  if (signals.netlify) return { id: "netlify", headerFile: "netlify.toml", unknownRoutes: signals.spaFallback ? "SPA_FALLBACK_200" : "HOST_404" };
  if (signals.cloudflare) return { id: "cloudflare", headerFile: "wrangler.toml", unknownRoutes: "FRAMEWORK" };
  return { id: "generic", headerFile: null, unknownRoutes: signals.spaFallback ? "SPA_FALLBACK_200" : "HOST_404" };
}
