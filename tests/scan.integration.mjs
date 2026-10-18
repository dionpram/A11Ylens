/**
 * Opt-in end-to-end smoke test of the *real* URL -> browser -> axe -> report path.
 * Runs a local fixture and starts Next.js in development mode. In production,
 * ALLOW_LOCAL_SCANS must always remain false.
 * CI invokes this after installing Chromium.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const TEST_TIMEOUT_MS = 125_000;
const fixture = await readFile(new URL('../fixtures/contrast.html', import.meta.url));
const fixtureServer = createServer((req, res) => {
  if (req.url !== '/contrast') { res.writeHead(404).end(); return; }
  res.writeHead(200, {'content-type': 'text/html; charset=utf-8'}).end(fixture);
});
await new Promise(resolve => fixtureServer.listen(0, '127.0.0.1', resolve));
const fixturePort = fixtureServer.address().port;
const appPort = 3187;
let appLog = '';
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(appPort)], {
  cwd: new URL('..', import.meta.url),
  env: {...process.env, ALLOW_LOCAL_SCANS: 'true', NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1'},
  detached: process.platform !== 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});
for (const stream of [app.stdout, app.stderr]) stream.on('data', chunk => { appLog = (appLog + String(chunk)).slice(-6000); });

async function untilServerReady() {
  const until = Date.now() + 80_000;
  while (Date.now() < until) {
    if (app.exitCode !== null) throw new Error(`Next.js exited early: ${appLog}`);
    try {
      const response = await fetch(`http://127.0.0.1:${appPort}`, { signal: AbortSignal.timeout(2500) });
      if (response.ok) return;
    } catch { /* server still starting */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Next.js did not start in time.\n${appLog}`);
}

let watchdog;
try {
  await Promise.race([
    (async () => {
      await untilServerReady();
      const response = await fetch(`http://127.0.0.1:${appPort}/api/scan`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({url: `http://127.0.0.1:${fixturePort}/contrast`}),
        signal: AbortSignal.timeout(85_000),
      });
      const json = await response.json();
      assert.equal(response.status, 200, `Scanner HTTP ${response.status}: ${JSON.stringify(json)}\n${appLog}`);
      assert.equal(json.pageTitle, 'Contrast test page');
      assert.equal(json.demo, undefined, 'Real scan must not be labeled as a demo');
      assert.equal(json.environment.engine, 'axe-core');
      assert(json.failures.some(issue => issue.id === 'color-contrast'), 'Fixture should fail contrast');
      assert(json.passes.length > 0, 'Fixture should have passing checks');
      assert(json.failures.find(issue => issue.id === 'color-contrast').recommendation, 'Issues must include actionable guidance');
      assert(json.previews.length > 0, 'Fixture should produce an actual before/after image');
      assert.match(json.previews[0].beforeImage, /^data:image\/png;base64,/);
      assert.match(json.previews[0].afterImage, /^data:image\/png;base64,/);
      assert(json.previews[0].afterRatio >= json.previews[0].threshold, 'The suggested contrast must meet the numeric target');
      console.log('E2E passed: URL -> browser -> axe findings -> dynamic visual fix -> report');
    })(),
    new Promise((_, reject) => { watchdog = setTimeout(() => reject(new Error(`E2E timed out.\n${appLog}`)), TEST_TIMEOUT_MS); }),
  ]);
} finally {
  clearTimeout(watchdog);
  if (process.platform === 'win32') app.kill('SIGTERM');
  else { try { process.kill(-app.pid, 'SIGTERM'); } catch { app.kill('SIGTERM'); } }
  fixtureServer.close();
  await once(fixtureServer, 'close');
}
