import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScanFailure, safeScannerFailure, ScanStepError } from "../lib/scan-errors.ts";

test("provider/Vercel error objects are never displayed as [object Object]", () => {
  assert.deepEqual(parseScanFailure({error:{message:"Upstream request failed",code:"BAD_REQUEST"}},503),{
    message:"Upstream request failed",code:"HTTP_503"
  });
  const unknown = parseScanFailure({error:{details:{stack:"private"}}},502);
  assert.match(unknown.message,/HTTP 502/);
  assert.doesNotMatch(unknown.message,/object Object|stack/);
});

test("client respects safe structured scan stage and handles malformed bodies", () => {
  const fromServer = parseScanFailure({error:"Couldn't connect to browser",code:"SCAN_CONNECT_BROWSER"},503);
  assert.equal(fromServer.code,"SCAN_CONNECT_BROWSER");
  assert.equal(fromServer.message,"Couldn't connect to browser");
  assert.match(parseScanFailure(null,500).message,/HTTP 500/);
  assert.match(parseScanFailure("html",503).message,/HTTP 503/);
});

test("runtime paths and token-bearing URLs aren't exposed by the parser", () => {
  for (const sensitive of ["/var/task/node_modules/playwright-core/browsers.json",
    "wss://production-ams.browserless.io/?token=secret-value",
    "provider stack trace detail"]) {
    const result = parseScanFailure({error:sensitive},503);
    assert.doesNotMatch(result.message,/var\/task|token=|stack trace/i);
  }
});

test("server errors identify which stage failed without leaking inner errors", () => {
  const publicValue = safeScannerFailure(new ScanStepError("CONNECT_BROWSER"));
  assert.equal(publicValue.code,"SCAN_CONNECT_BROWSER");
  assert.match(publicValue.message,/connect/);
  assert.deepEqual(safeScannerFailure(new Error("secret")), {
    code:"SCAN_UNKNOWN",message:"The scanning service couldn't complete the request."
  });
});
