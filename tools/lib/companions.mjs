// Companion methods: a canonical library (docs/references/companion-methods.md) holds a minimum inline
// method for each skill. Every skill that DECLARES companions (metadata.companions) gets a generated,
// pruned copy containing only those entries, so an installed skill carries exactly the fallbacks it needs.
//
// A companion is a skill whose method this skill actually relies on. Routing tables, escalation
// hand-offs, and documentation mentions are NOT companions and are never declared.

/** Split the canonical library into its intro and a Map of skill name -> entry text. */
export function parseCompanionLibrary(text) {
  const firstSection = text.search(/^## /m);
  const intro = (firstSection === -1 ? text : text.slice(0, firstSection)).trimEnd();
  const entries = new Map();
  const re = /^### (\S+)\s*\n([\s\S]*?)(?=^### |^## |(?![\s\S]))/gm;
  let m;
  while ((m = re.exec(text))) entries.set(m[1], m[2].trim());
  return { intro, entries };
}

/** Build the per-skill file: the shared intro plus only the declared companions' entries, in library order. */
export function buildCompanionFile(library, companions) {
  const wanted = new Set(companions);
  const blocks = [...library.entries].filter(([name]) => wanted.has(name)).map(([name, body]) => `### ${name}\n${body}`);
  return `${library.intro}\n\nThis file contains only the entries for this skill's declared companions: ${companions.map((c) => `\`${c}\``).join(", ")}.\n\n${blocks.join("\n\n")}\n`;
}
