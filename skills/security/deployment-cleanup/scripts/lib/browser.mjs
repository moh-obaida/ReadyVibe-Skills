// Optional headless-browser access for the ReadyVibe helper scripts.
// Nothing here calls a model. It only drives a local Chromium through Playwright.
// Playwright is NOT a dependency of the skills: it is resolved from the project being
// inspected (or globally). If it is absent, callers get a clear, actionable error and
// should fall back to static mode or ask the user to install it.

import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const PLAYWRIGHT_HELP =
  "Playwright is not available. In the project being inspected run `npm i -D playwright-core` (and `npx playwright install chromium` if no Chrome is installed), or pass --chrome-path to an existing Chrome/Chromium. Static mode still works without it.";

async function importPlaywright() {
  const anchors = [join(process.cwd(), "noop.js"), import.meta.url.startsWith("file:") ? new URL(import.meta.url).pathname : ""];
  for (const name of ["playwright", "playwright-core"]) {
    for (const anchor of anchors) {
      if (!anchor) continue;
      try {
        const resolved = createRequire(anchor).resolve(name);
        return await import(pathToFileURL(resolved).href);
      } catch {
        /* try next */
      }
    }
    try {
      return await import(name);
    } catch {
      /* try next */
    }
  }
  return null;
}

function candidateExecutables() {
  const out = [];
  if (process.env.READYVIBE_CHROME) out.push(process.env.READYVIBE_CHROME);
  const os = platform();
  const cacheRoot = os === "darwin" ? join(homedir(), "Library/Caches/ms-playwright") : join(homedir(), ".cache/ms-playwright");
  if (existsSync(cacheRoot)) {
    for (const dir of readdirSync(cacheRoot).filter((d) => d.startsWith("chromium-")).sort().reverse()) {
      out.push(
        join(cacheRoot, dir, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
        join(cacheRoot, dir, "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
        join(cacheRoot, dir, "chrome-linux/chrome"),
        join(cacheRoot, dir, "chrome-win/chrome.exe"),
      );
    }
  }
  out.push(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  );
  return out.filter((p) => existsSync(p));
}

/** Launch headless Chromium. Returns { browser, chromium } or throws an Error with PLAYWRIGHT_HELP. */
export async function launchBrowser({ chromePath } = {}) {
  const pw = await importPlaywright();
  const chromium = pw?.chromium ?? pw?.default?.chromium;
  if (!chromium) throw new Error(PLAYWRIGHT_HELP);
  const attempts = chromePath ? [chromePath] : [undefined, ...candidateExecutables()];
  let lastError;
  for (const executablePath of attempts) {
    try {
      const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
      return { browser, chromium };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`${PLAYWRIGHT_HELP}\nLast launch error: ${lastError?.message?.split("\n")[0] ?? "unknown"}`);
}
