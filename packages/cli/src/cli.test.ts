import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("readyvibe doctor", () => {
  it("prints engine identity as JSON", () => {
    const pkg = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const tsc = spawnSync(process.execPath, [require.resolve("typescript/bin/tsc"), "-p", "tsconfig.json"], {
      cwd: pkg,
      encoding: "utf8",
    });
    expect(tsc.status).toBe(0);
    const result = spawnSync(process.execPath, [resolve(pkg, "dist/cli.js"), "doctor"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: true, scope: "@readyvibe/cli" });
  });
});
