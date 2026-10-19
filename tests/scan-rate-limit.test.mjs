import {test} from "node:test";
import assert from "node:assert/strict";
import {scanRateLimitPolicy, consumeScanBudget} from "../lib/scan-rate-limit.ts";

test("private managed-browser beta allows 12 attempts in 10 minutes; ordinary modes remain at 3",()=>{
  assert.equal(scanRateLimitPolicy("managed-browser").limit,12);
  for(const mode of ["proxy","pagespeed","development","disabled"]) assert.equal(scanRateLimitPolicy(mode).limit,3);
});

test("beta attempt 13 returns a retry interval, without registering a new scan",()=>{
  const policy=scanRateLimitPolicy("managed-browser");
  const start=1_000_000;
  let values=[];
  for(let i=0;i<12;i++){
    const decision=consumeScanBudget(values,start+i*1000,policy);
    assert.equal(decision.allowed,true);
    values=decision.timestamps;
  }
  const blocked=consumeScanBudget(values,start+12_000,policy);
  assert.equal(blocked.allowed,false);
  assert.equal(blocked.retryAfterSeconds,588);
  assert.equal(blocked.timestamps.length,12);
});

test("old requests expire from window and allow retry without disabling limits",()=>{
  const policy=scanRateLimitPolicy("managed-browser");
  const now=1_000_000;
  const prior=Array.from({length:12},(_,i)=>now-policy.windowMs-1000+i);
  const res=consumeScanBudget(prior,now,policy);
  assert.equal(res.allowed,true);
  assert.deepEqual(res.timestamps,[now]);
});
