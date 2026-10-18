/**
 * Deployment-only managed-browser smoke check.
 * A passing Next build alone does NOT prove the remote scanning service works.
 * This connects through the same native Playwright protocol and verifies routing
 * and axe-core on example.com. It intentionally never prints secrets.
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

if (process.env.MANAGED_BROWSER_ENABLED !== "true") {
  console.log("[managed-browser-smoke] skipped: managed-browser preview is disabled.");
} else {
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("[managed-browser-smoke] Refusing managed-browser scanning in production.");
  }
  const token = process.env.BROWSERLESS_TOKEN;
  if (!token) throw new Error("[managed-browser-smoke] Preview browser token is missing.");
  const url = new URL("wss://production-ams.browserless.io/chromium/playwright");
  url.searchParams.set("token", token);
  url.searchParams.set("timeout", "55000");

  let browser;
  let stage = "CONNECT";
  try {
    browser = await chromium.connect(url.toString(), { timeout: 15000 });
    stage = "CONTEXT";
    const context = await browser.newContext({ serviceWorkers: "block" });
    stage = "REQUEST_ROUTING";
    await context.route("**/*", async route => {
      const target = new URL(route.request().url());
      if (target.protocol !== "https:" || target.hostname !== "example.com") {
        await route.abort();
      } else {
        await route.continue();
      }
    });
    stage = "NAVIGATE";
    const page = await context.newPage();
    const response = await page.goto("https://example.com/", {
      waitUntil: "domcontentloaded", timeout: 20000,
    });
    if (!response?.ok()) throw new Error("TEST_PAGE_NOT_READY");
    stage = "AXE";
    const data = await new AxeBuilder({ page }).analyze();
    if (!Array.isArray(data.passes) || !Array.isArray(data.violations)) {
      throw new Error("INVALID_AXE_RESULTS");
    }
    console.log("[managed-browser-smoke] Browserless CONNECT, REQUEST_ROUTING, NAVIGATE and AXE passed.");
  } catch {
    // The original WebSocket error can contain the credential-bearing endpoint.
    throw new Error("[managed-browser-smoke] Failed at stage: " + stage);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
