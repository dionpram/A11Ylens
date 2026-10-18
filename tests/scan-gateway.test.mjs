import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authenticateWorker, scanMode, workerEndpoint, readLimitedJson } from '../lib/scan-gateway.ts';

const token = 'a-secure-32-character-minimum-scanner-token-123';

test('scans are disabled in production until a worker is explicitly configured', () => {
  assert.equal(scanMode({ NODE_ENV: 'production' }), 'disabled');
  assert.equal(scanMode({ NODE_ENV: 'development' }), 'development');
  assert.equal(scanMode({ NODE_ENV: 'production', SCAN_WORKER_ENABLED: 'true' }), 'disabled');
  assert.equal(scanMode({ NODE_ENV: 'production', SCAN_WORKER_ENABLED: 'true', SCAN_WORKER_TOKEN: token }), 'worker');
  assert.equal(scanMode({ NODE_ENV: 'production', SCAN_WORKER_URL: 'https://scanner.example', SCAN_WORKER_TOKEN: token }), 'proxy');
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
