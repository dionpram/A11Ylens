import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicAddress, validatePublicUrl } from '../lib/safety.ts';

test('allows native public IPv4 and IPv6', () => {
  for (const ip of ['1.1.1.1', '8.8.8.8', '93.184.215.14', '2606:4700:4700::1111']) {
    assert.equal(isPublicAddress(ip), true, ip);
  }
});

test('blocks private, metadata, loopback and special IPv4 ranges', () => {
  for (const ip of ['127.0.0.1','10.0.0.1','172.16.0.5','192.168.1.2','169.254.169.254',
    '100.100.100.200','100.64.0.1','0.0.0.0','198.18.0.1','192.0.0.9',
    '192.0.2.1','198.51.100.2','203.0.113.9','255.255.255.255']) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
});

test('blocks local and tunneled IPv6 ranges', () => {
  for (const ip of ['::1','fe80::1','fd00::1','2001:db8::1','2001:0::1',
    '2002:c0a8:101::','::ffff:192.168.1.2']) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
});

test('rejects unsupported, credentialed, private and unusual URL targets', async () => {
  for (const url of ['file:///etc/passwd','http://127.0.0.1/',
    'http://169.254.169.254/latest/meta-data/', 'http://10.0.0.1',
    'http://example.com:8080/','http://user:pass@example.com/',
    'http://[::1]/','http://[2002:c0a8:101::]/',
    'http://0x7f000001/','http://2130706433/','http://127.1/']) {
    await assert.rejects(() => validatePublicUrl(url), undefined, url);
  }
});

test('isolated-worker URL validation defers DNS to network egress proxy, never permits private literals', async () => {
  const previous={proxy:process.env.SECURE_EGRESS_PROXY_URL,worker:process.env.SCAN_WORKER_ENABLED,mode:process.env.NODE_ENV};
  try {
    process.env.SECURE_EGRESS_PROXY_URL='http://egress:3128';
    process.env.SCAN_WORKER_ENABLED='true';
    process.env.NODE_ENV='production';
    assert.equal(await validatePublicUrl('https://example.com/test?q=1'),'https://example.com/test?q=1');
    for (const url of ['http://127.0.0.1/','https://169.254.169.254/','https://10.0.0.1/','https://[::1]/','https://[fd00::1]/']) {
      await assert.rejects(() => validatePublicUrl(url),undefined,url);
    }
  } finally {
    for(const [key,value] of [['SECURE_EGRESS_PROXY_URL',previous.proxy],['SCAN_WORKER_ENABLED',previous.worker],['NODE_ENV',previous.mode]]) {
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
  }
});
