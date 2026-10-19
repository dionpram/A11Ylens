import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authenticateWorker, scanMode, workerEndpoint, isAllowedBetaUrl, readLimitedJson } from '../lib/scan-gateway.ts';
import { browserlessEndpoint } from '../lib/browserless.ts';

const token = 'a-secure-32-character-minimum-scanner-token-123';

test('scans are disabled in production until a worker is explicitly configured', () => {
  assert.equal(scanMode({ NODE_ENV: 'production' }), 'disabled');
  assert.equal(scanMode({ NODE_ENV: 'development' }), 'development');
  assert.equal(scanMode({ NODE_ENV: 'production', SCAN_WORKER_ENABLED: 'true' }), 'disabled');
  assert.equal(scanMode({ NODE_ENV: 'production', SCAN_WORKER_ENABLED: 'true', SCAN_WORKER_TOKEN: token }), 'worker');
  assert.equal(scanMode({ NODE_ENV: 'production', SCAN_WORKER_URL: 'https://scanner.example', SCAN_WORKER_TOKEN: token }), 'proxy');
  assert.equal(scanMode({ NODE_ENV: 'production', PAGESPEED_API_ENABLED: 'true' }), 'pagespeed');
  assert.equal(scanMode({ NODE_ENV: 'production', PAGESPEED_API_ENABLED: 'true', SCAN_WORKER_URL: 'https://worker.example' }), 'proxy');
});

test('emergency security hold disables every scanner mode, including configured workers', () => {
  for (const mode of [
    { NODE_ENV:'production', MANAGED_BROWSER_ENABLED:'true', BROWSERLESS_TOKEN:'example' },
    { NODE_ENV:'production', SCAN_WORKER_URL:'https://scanner.example', SCAN_WORKER_TOKEN:token },
    { NODE_ENV:'production', SCAN_WORKER_ENABLED:'true', SCAN_WORKER_TOKEN:token },
    { NODE_ENV:'production', PAGESPEED_API_ENABLED:'true' },
    { NODE_ENV:'development', ALLOW_LOCAL_SCANS:'true' },
  ]) {
    assert.equal(scanMode({...mode, SCANNER_SECURITY_HOLD:'true'}), 'disabled');
  }
});

test('worker requires exact long shared token', () => {
  assert.equal(authenticateWorker(token, token), true);
  assert.equal(authenticateWorker('bad', token), false);
  assert.equal(authenticateWorker(token, 'short'), false);
  assert.equal(authenticateWorker(null, token), false);
});

test('remote scanner must use HTTPS with clean origin', () => {
  assert.equal(workerEndpoint('https://scanner.example/', { NODE_ENV:'production' }), 'https://scanner.example/api/scan');
  for (const candidate of ['http://scanner.example', 'https://user:pass@scanner.example', 'https://scanner.example/path', 'https://scanner.example/?x=1']) {
    assert.throws(() => workerEndpoint(candidate, {NODE_ENV:'production'}));
  }
  assert.equal(workerEndpoint('http://127.0.0.1:3333/', { NODE_ENV:'development' }), 'http://127.0.0.1:3333/api/scan');
});

test('upstream reports enforce a byte cap, not only content-length', async () => {
  const ok = new Response(JSON.stringify({id:'scan-1'}));
  assert.deepEqual(await readLimitedJson(ok, 80), {id:'scan-1'});
  const tooLarge = new Response(JSON.stringify({data:'x'.repeat(1000)}));
  await assert.rejects(() => readLimitedJson(tooLarge, 80), /oversized/);
  await assert.rejects(() => readLimitedJson(new Response('not json')), /invalid response/);
});

test('managed browser is opt-in, and scanner/worker proxy take priority', () => {
  assert.equal(scanMode({NODE_ENV:'production', MANAGED_BROWSER_ENABLED:'true'}), 'disabled');
  assert.equal(scanMode({NODE_ENV:'production', MANAGED_BROWSER_ENABLED:'true', BROWSERLESS_TOKEN:'test-token'}), 'managed-browser');
  assert.equal(scanMode({NODE_ENV:'production', MANAGED_BROWSER_ENABLED:'true', BROWSERLESS_TOKEN:'test-token', SCAN_WORKER_URL:'https://worker.example'}), 'proxy');
});

test('closed beta allowlist uses exact host matches only', () => {
  const allow='pramadion.com,www.pramadion.com,example.com,riderguide.com,www.riderguide.com';
  assert.equal(isAllowedBetaUrl('https://pramadion.com/work', allow), true);
  assert.equal(isAllowedBetaUrl('https://www.pramadion.com/', allow), true);
  assert.equal(isAllowedBetaUrl('https://example.com/', allow), true);
  assert.equal(isAllowedBetaUrl('https://riderguide.com/best-rated/best-electric-bikes?ref=example', allow), true);
  assert.equal(isAllowedBetaUrl('https://www.riderguide.com/reviews', allow), true);
  for(const url of [
    'https://evil-pramadion.com/',
    'https://pramadion.com.evil.com/',
    'http://localhost/',
    'file:///etc/passwd',
    'https://example.com.evil/',
    'https://riderguide.com.evil.com/',
  ]) assert.equal(isAllowedBetaUrl(url, allow), false, url);
  assert.equal(isAllowedBetaUrl('https://pramadion.com/', ''), false);
});

test('managed browser connection goes to fixed Amsterdam provider, not user-supplied URL', () => {
  const endpoint = new URL(browserlessEndpoint('test-secret'));
  assert.equal(endpoint.protocol,'wss:');
  assert.equal(endpoint.hostname, 'production-ams.browserless.io');
  assert.equal(endpoint.searchParams.get('token'), 'test-secret');
  assert.equal(endpoint.searchParams.get('timeout'), '55000');
  assert.throws(()=>browserlessEndpoint(''), /not configured/);
});
