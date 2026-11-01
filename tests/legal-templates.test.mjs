import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = join(root, "docs/references/legal-templates");
const scenarioPath = join(root, "fixtures/legal-sites/scenarios.json");
const scenarios = JSON.parse(readFileSync(scenarioPath, "utf8"));
const files = {
  terms: ["01-terms-of-service.md", "# Terms of Service", "## 3. Completion and publishing checklist"],
  privacy: ["02-privacy-policy.md", "# Privacy Policy", "## Publication checks"],
  cookie: ["03-cookie-policy.md", "# Cookie Policy", "## Publication checks"],
  returns: ["04-returns-refunds-cancellations.md", "# Returns, Refunds and Cancellation Policy", "## Publication checks"],
};

function draftBody(kind) {
  const [file, start, end] = files[kind];
  const source = readFileSync(join(canonical, file), "utf8");
  const from = source.indexOf(`\n${start}\n`);
  const to = source.indexOf(`\n${end}\n`, from + 1);
  assert.notEqual(from, -1, `${file} has its drafting section`);
  assert.notEqual(to, -1, `${file} has its publication checklist`);
  return source.slice(from + 1, to).trim();
}

function assemble(source, enabledConditions) {
  const enabled = new Set(enabledConditions);
  const stack = [];
  const output = [];
  for (const line of source.split("\n")) {
    const open = line.match(/^\[\[IF (.+)\]\]$/);
    if (open) {
      stack.push(enabled.has(open[1]));
      continue;
    }
    if (line === "[[END IF]]") {
      assert.ok(stack.length, "conditional section has a matching IF");
      stack.pop();
      continue;
    }
    if (stack.every(Boolean)) output.push(line);
  }
  assert.equal(stack.length, 0, "conditional sections are closed");
  return output.join("\n");
}

const bundles = Object.fromEntries(Object.keys(files).map((kind) => [kind, draftBody(kind)]));

describe("conditional legal templates", () => {
  test("all four source templates have balanced condition blocks and explicit publication gates", () => {
    for (const [kind, source] of Object.entries(bundles)) {
      assert.equal((source.match(/^\[\[IF .+\]\]$/gm) ?? []).length, (source.match(/^\[\[END IF\]\]$/gm) ?? []).length, `${kind} conditional markers balance`);
      assert.match(source, /\{\{[^}]+\}\}/, `${kind} uses verified-value markers`);
      assert.match(source, /\[\[REVIEW REQUIRED:/, `${kind} flags unresolved reviews`);
    }
    const guide = readFileSync(join(canonical, "README.md"), "utf8");
    assert.match(guide, /AUTO → OWNER CONFIRM/);
    assert.match(guide, /OWNER REQUIRED/);
    assert.match(guide, /LEGAL REVIEW/);
    assert.match(guide, /Never infer the legal operator/);
    assert.match(guide, /All `\{\{\.\.\.\}\}`, `\[\[IF \.\.\.\]\]`, `\[\[END IF\]\]` and `\[\[REVIEW REQUIRED:/);
    assert.match(guide, /not a guarantee of legal compliance or a substitute for jurisdiction-specific legal advice/i);
  });

  for (const scenario of scenarios) {
    test(`${scenario.name}: only applicable conditional modules remain`, () => {
      for (const kind of Object.keys(files)) {
        const rendered = assemble(bundles[kind], scenario.enabled[kind]);
        for (const heading of scenario.include[kind]) assert.ok(rendered.includes(heading), `${kind} should include ${heading}`);
        for (const heading of scenario.exclude[kind]) assert.ok(!rendered.includes(heading), `${kind} should omit ${heading}`);
        for (const phrase of scenario.mustContain?.[kind] ?? []) assert.ok(rendered.includes(phrase), `${kind} should retain ${phrase}`);
      }
    });
  }

  test("launch and specialist instructions gate publication, preserve evidence labels, and implement real pages", () => {
    const paths = [
      "skills/core/launch-all/SKILL.md",
      "skills/core/compliance-all/SKILL.md",
      "skills/compliance/terms-of-service/SKILL.md",
      "skills/compliance/privacy-policy/SKILL.md",
      "skills/compliance/consent-management/SKILL.md",
      "skills/compliance/consumer-protection-readiness/SKILL.md",
      "skills/compliance/policy-consistency/SKILL.md",
      "skills/commerce/subscription-readiness/SKILL.md",
      "skills/quality/legal-navigation/SKILL.md",
      "skills/internationalization/multilingual-readiness/SKILL.md",
    ];
    const all = paths.map((p) => readFileSync(join(root, p), "utf8")).join("\n");
    assert.match(all, /AUTO → OWNER CONFIRMATION/);
    assert.match(all, /OWNER REQUIRED/);
    assert.match(all, /Never infer the operator/);
    assert.match(all, /DRAFT — REVIEW REQUIRED/);
    assert.match(all, /never publish/i);
    assert.match(all, /design system/);
    assert.match(all, /contact destinations/);
    assert.match(all, /mobile/i);
    assert.match(all, /matching locale/);
    assert.match(all, /policy alone is not proof|policy wording alone is not proof/i);
    assert.match(all, /never add a cookie banner solely because a template/i);
  });

  test("the eight scenario profiles cover routing and no-banner expectations", () => {
    assert.equal(scenarios.length, 8);
    const multilingual = scenarios.find((x) => x.name === "multilingual site");
    assert.deepEqual(multilingual.locales, ["en", "ar"]);
    assert.equal(scenarios.find((x) => x.name === "site without non-essential trackers").expectedBanner, false);
    const staticSite = scenarios.find((x) => x.name === "static informational site");
    assert.deepEqual(staticSite.enabled.terms, []);
    assert.deepEqual(staticSite.enabled.returns, []);
  });

  test("the pruned companion fallbacks carry legal routing when specialists are absent", () => {
    const launchFallback = readFileSync(join(root, "skills/core/launch-all/references/companion-methods.md"), "utf8");
    const complianceFallback = readFileSync(join(root, "skills/core/compliance-all/references/companion-methods.md"), "utf8");
    assert.match(launchFallback, /### compliance-all[\s\S]*private draft\/review report/);
    assert.match(complianceFallback, /### privacy-policy[\s\S]*No unresolved markers or internal notes may be published/);
    assert.match(complianceFallback, /### terms-of-service[\s\S]*never publish template markers/);
    assert.match(complianceFallback, /### consumer-protection-readiness[\s\S]*Cancellation of future renewal is not a refund/);
  });
});

describe("installed reference declarations", () => {
  const needed = {
    "launch-all": ["README", "01-terms-of-service", "02-privacy-policy", "03-cookie-policy", "04-returns-refunds-cancellations"],
    "compliance-all": ["README", "01-terms-of-service", "02-privacy-policy", "03-cookie-policy", "04-returns-refunds-cancellations"],
    "terms-of-service": ["README", "01-terms-of-service", "04-returns-refunds-cancellations"],
    "privacy-policy": ["README", "02-privacy-policy", "03-cookie-policy"],
    "consent-management": ["README", "03-cookie-policy"],
    "consumer-protection-readiness": ["README", "01-terms-of-service", "04-returns-refunds-cancellations"],
    "subscription-readiness": ["README", "01-terms-of-service", "04-returns-refunds-cancellations"],
    "policy-consistency": ["README", "01-terms-of-service", "02-privacy-policy", "03-cookie-policy", "04-returns-refunds-cancellations"],
  };

  for (const [skill, names] of Object.entries(needed)) {
    test(`${skill} declares and carries its installed legal references`, () => {
      const skillDir = join(root, "skills", skill === "launch-all" || skill === "compliance-all" ? "core" : skill === "subscription-readiness" ? "commerce" : skill === "consumer-protection-readiness" ? "compliance" : "compliance", skill);
      const skillText = readFileSync(join(skillDir, "SKILL.md"), "utf8");
      const references = skillText.match(/^\s+references: "([^"]*)"/m)?.[1].split(",") ?? [];
      for (const name of names) {
        const id = `legal-templates/${name}`;
        const canonicalFile = join(canonical, `${name}.md`);
        const installedFile = join(skillDir, "references", `${id}.md`);
        assert.ok(references.includes(id), `${skill} metadata.references includes ${id}`);
        assert.ok(readFileSync(installedFile).equals(readFileSync(canonicalFile)), `${skill} carries the current ${name}.md`);
      }
    });
  }
});
