import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const port = 34721;
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port)], {
  cwd: new URL("../", import.meta.url),
  env: {
    ...process.env,
    NODE_ENV: "production",
    PAGESPEED_API_ENABLED: "true",
    SCAN_WORKER_ENABLED: "false",
    SCAN_WORKER_URL: "",
    ALLOW_LOCAL_SCANS: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", chunk => output += chunk.toString().slice(-2000));
child.stderr.on("data", chunk => output += chunk.toString().slice(-2000));

const target = "http://127.0.0.1:" + port;
async function call(path, opts = {}) {
  return fetch(target + path, { ...opts, signal: AbortSignal.timeout(4000) });
}
try {
  let started = false;
  for (let i=0; i<35; i++) {
    if (child.exitCode !== null) throw Error("Next.js exited: " + output.slice(-1000));
    try {
      const res = await call("/api/health");
      if (res.ok) { started=true; break; }
    } catch {}
    await delay(600);
  }
  assert.ok(started, "Next.js did not start: " + output.slice(-1000));

  // The invalid target is rejected locally, so no call to Google is required.
  // The API must boot and return structured JSON rather than HTTP 500 HTML.
  const res = await call("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({url:"http://127.0.0.1/latest/meta-data"}),
  });
  const body = await res.text();
  assert.equal(res.status, 503, "Unexpected HTTP " + res.status + ": " + body.slice(0,300));
  const json = JSON.parse(body);
  assert.match(json.error, /restricted|non-public|local/i);
  console.log("Production API boot smoke test passed");
} finally {
  child.kill("SIGTERM");
  await delay(350);
  if (child.exitCode === null) child.kill("SIGKILL");
}
