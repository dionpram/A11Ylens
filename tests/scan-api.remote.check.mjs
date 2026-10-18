import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

// This runs after the Next.js production build. No secrets in logs.
if (process.env.MANAGED_BROWSER_ENABLED !== "true") {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "remote-browser-beta")
    throw new Error("[scan-api-remote] Managed browser mode not configured.");
  console.log("[scan-api-remote] skipped outside beta.");
} else {
  if (process.env.VERCEL_ENV === "production")
    throw new Error("[scan-api-remote] Refusing live scans during production build.");
  if (!process.env.BROWSERLESS_TOKEN)
    throw new Error("[scan-api-remote] Missing provider token.");

  const port = 34723;
  let stage = "START_SERVER";
  const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port)], {
    cwd: new URL("../", import.meta.url),
    env: {...process.env, NODE_ENV:"production"},
    stdio: "ignore",
  });
  const base = "http://127.0.0.1:" + port;
  try {
    let ready = false;
    for (let i=0;i<40;i++) {
      if (app.exitCode !== null) break;
      try {
        const r = await fetch(base + "/api/health", {signal:AbortSignal.timeout(1500)});
        if (r.ok) {ready=true;break;}
      } catch {}
      await delay(500);
    }
    if (!ready) throw new Error("NOT_READY");
    stage = "SCAN_HTTP";
    const response = await fetch(base + "/api/scan", {
      method:"POST", headers:{"Content-Type":"application/json",Accept:"application/json"},
      body:JSON.stringify({url:"https://example.com/"}),
      signal:AbortSignal.timeout(58000),
    });
    let payload;
    try { payload=await response.json(); }
    catch { throw new Error("NON_JSON_HTTP_" + response.status); }
    if (!response.ok) {
      const code = typeof payload?.code === "string" && /^[A-Z0-9_]+$/.test(payload.code)
        ? payload.code : "HTTP_" + response.status;
      throw new Error(code);
    }
    stage = "VERIFY_REPORT";
    if (typeof payload.id !== "string" || !Array.isArray(payload.passes)
      || !Array.isArray(payload.failures) || payload.environment?.engine !== "axe-core")
      throw new Error("INVALID_REPORT");
    console.log("[scan-api-remote] PASS: real axe-core report returned for example.com.");
  } catch (error) {
    const code = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "FAILED";
    throw new Error("[scan-api-remote] FAILED at " + stage + " (" + code + ").");
  } finally {
    app.kill("SIGTERM");
    await delay(350);
    if (app.exitCode === null) app.kill("SIGKILL");
  }
}
