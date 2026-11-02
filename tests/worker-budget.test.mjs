import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {calculateScanBudget,opaqueVisitorId} from "../lib/worker-budget.mjs";

test("hard daily cap is shared across visitors and survives state reload",()=>{
  let state=null;let result;
  for(let i=0;i<30;i++){
    result=calculateScanBudget(state,Date.UTC(2026,9,19)+i*1000,opaqueVisitorId("ip"+i,"test"),30);
    assert.equal(result.allowed,true);state=result.next;
  }
  result=calculateScanBudget(state,Date.UTC(2026,9,19)+40_000,opaqueVisitorId("another","test"),30);
  assert.equal(result.allowed,false);assert.equal(result.reason,"DAILY_LIMIT");
  assert.equal(result.next.count,30);
  const reset=calculateScanBudget(state,Date.UTC(2026,9,20),opaqueVisitorId("another","test"),30);
  assert.equal(reset.allowed,true);assert.equal(reset.next.count,1);
});

test("per-visitor protection does not persist raw IPs",()=>{
  const id=opaqueVisitorId("203.0.113.9","private");
  assert.match(id,/^[a-f0-9]{24}$/);
  let state=null;
  for(let i=0;i<4;i++){const r=calculateScanBudget(state,1_000_000+i*1000,id);assert.equal(r.allowed,true);state=r.next;}
  assert.equal(calculateScanBudget(state,1_010_000,id).reason,"VISITOR_LIMIT");
  assert.equal(calculateScanBudget(state,1_650_000,id).allowed,true);
  assert.doesNotMatch(JSON.stringify(state),/203\.0\.113\.9/);
});

test("budgets cannot reserve to arbitrary filesystem destinations",async()=>{
  const {reserveScanSlot}=await import("../lib/worker-budget.mjs");
  assert.throws(()=>reserveScanSlot({path:"/etc/passwd",visitor:"anonymous"}),/PERSISTENT_BUDGET_NOT_CONFIGURED/);
  assert.throws(()=>reserveScanSlot({path:"/tmp/anything",visitor:"anonymous"}),/PERSISTENT_BUDGET_NOT_CONFIGURED/);
});
