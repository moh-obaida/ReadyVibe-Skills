/** Patterns that must never appear in committed artifacts. Values are synthetic-looking on purpose. */
const SECRET_PATTERNS: { id: string; re: RegExp }[] = [
  { id: "private-key", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { id: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { id: "slack-token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { id: "stripe-secret", re: /\bsk_live_[A-Za-z0-9]{10,}\b/ },
  { id: "generic-secret-assignment", re: /(?:api[_-]?key|secret|password)\s*[:=]\s*['"][^'"]{12,}['"]/i },
];

export function findSecret(value: unknown): string | null {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.re.test(text)) return pattern.id;
  }
  return null;
}
