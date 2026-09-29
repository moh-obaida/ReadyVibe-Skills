#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluate, launchState, observeHttp, reconStatic, renderReport } from "@readyvibe/engine";
import { seal, writeArtifact } from "@readyvibe/schemas";

const [command, ...args] = process.argv.slice(2);
const flags = new Map<string, string>();
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg?.startsWith("--")) flags.set(arg.slice(2), args[i + 1] && !args[i + 1]!.startsWith("--") ? args[++i]! : "true");
}

const root = resolve(flags.get("root") ?? process.cwd());
const asOf = flags.get("as-of") ?? new Date().toISOString().slice(0, 10);
const engineProducer = { name: "@readyvibe/engine", version: "0.1.0", type: "ENGINE" as const };

function runId(): string {
  return `${asOf.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8)}`;
}

async function main(): Promise<void> {
  if (command === "doctor") {
    console.log(JSON.stringify({ ok: true, engine: "0.1.0", node: process.version, scope: "@readyvibe/cli" }));
    return;
  }
  if (command === "init") {
    mkdirSync(resolve(root, ".readyvibe"), { recursive: true });
    writeFileSync(
      resolve(root, ".readyvibe", "config.yaml"),
      "schemaVersion: 1\nproject:\n  productName: null\noperator:\n  legalName: null\n  country: null\ntargets:\n  markets: []\n",
    );
    writeFileSync(resolve(root, ".readyvibe", ".gitignore"), "runs/\ncache/\n");
    console.log(JSON.stringify({ ok: true, wrote: ".readyvibe/config.yaml" }));
    return;
  }
  if (command === "recon" || command === "report" || command === "ci") {
    const id = runId();
    const { model, evidence } = reconStatic(root);
    if (flags.get("url")) await observeHttp(flags.get("url")!, model, evidence);
    const findings = evaluate(model, evidence);
    const state = launchState(findings);
    const markdown = renderReport({
      launchState: state.state,
      conditions: state.conditions,
      findings,
      evaluatedAsOf: asOf,
      commit: "working-tree",
    });
    const runDir = resolve(root, ".readyvibe", "runs", id);
    writeArtifact(
      resolve(runDir, "reality-model.json"),
      seal({
        schemaVersion: "1.0",
        kind: "reality-model",
        producer: engineProducer,
        runId: id,
        createdAt: new Date().toISOString(),
        data: {
          project: model.project,
          routes: model.routes,
          capabilities: model.capabilities,
          coverage: model.coverage,
          vendors: model.vendors,
          declarations: model.declarations,
          dataElements: model.dataElements,
          facts: [],
        },
      }),
      root,
    );
    writeArtifact(
      resolve(runDir, "findings.json"),
      seal({
        schemaVersion: "1.0",
        kind: "findings",
        producer: engineProducer,
        runId: id,
        createdAt: new Date().toISOString(),
        data: { findings },
      }),
      root,
    );
    writeArtifact(
      resolve(runDir, "report.json"),
      seal({
        schemaVersion: "1.0",
        kind: "report",
        producer: engineProducer,
        runId: id,
        createdAt: new Date().toISOString(),
        data: { launchState: state.state, launchStateConditions: state.conditions, counts: {}, findings, evaluatedAsOf: asOf, markdown },
      }),
      root,
    );
    const payload = { ok: true, runId: id, launchState: state.state, findings: findings.map((f) => ({ controlId: f.controlId, status: f.status })) };
    console.log(flags.get("json") === "true" || command !== "report" ? JSON.stringify(payload, null, 2) : markdown);
    if (command === "ci" && state.state === "BLOCKED") process.exitCode = 1;
    return;
  }
  if (command === "diff") {
    console.log(JSON.stringify({ ok: true, command: "diff", note: "Library API: complianceDiff(base, head) in @readyvibe/engine." }));
    return;
  }
  console.error("usage: readyvibe <doctor|init|recon|report|ci|diff> [--root .] [--url http://127.0.0.1:PORT] [--json true]");
  process.exitCode = 2;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
