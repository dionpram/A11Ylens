import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import { createHash } from "node:crypto";

/** Single-process, file-backed hard budget for the ONE local scanner worker.
 * This is never a rate limiter for a distributed/auto-scaling deployment.
 */
function dayAt(now){return new Date(now).toISOString().slice(0,10);}
function sanitizeVisitor(value){return /^[a-f0-9]{16,64}$/i.test(value||"") ? value : "anonymous";}

export function calculateScanBudget(state, now, visitor, dailyLimit=30, intervalMs=600_000, perVisitorLimit=4) {
  const day=dayAt(now);
  const current=state && state.day===day ? state : {day,count:0,visitors:{}};
  const clean={};
  for(const [key,entries] of Object.entries(current.visitors||{}).slice(0,2000)){
    if(!Array.isArray(entries))continue;
    const fresh=entries.filter(t=>Number.isFinite(t)&&t<=now&&t>now-intervalMs);
    if(fresh.length)clean[key]=fresh;
  }
  const id=sanitizeVisitor(visitor);
  const recent=clean[id]||[];
  if(current.count>=dailyLimit) return {allowed:false,reason:"DAILY_LIMIT",next:{day,count:current.count,visitors:clean}};
  if(recent.length>=perVisitorLimit)return {allowed:false,reason:"VISITOR_LIMIT",next:{day,count:current.count,visitors:clean}};
  clean[id]=[...recent,now];
  return {allowed:true,reason:null,next:{day,count:current.count+1,visitors:clean}};
}

export function reserveScanSlot({path,now=Date.now(),visitor,dailyLimit=30}) {
  if(!path || !path.startsWith("/state/")) throw Error("PERSISTENT_BUDGET_NOT_CONFIGURED");
  let current;
  try{current=JSON.parse(readFileSync(path,"utf8"));}
  catch(error){if(error?.code!=="ENOENT")throw error; current=null;}
  const decision=calculateScanBudget(current,now,visitor,dailyLimit);
  if(!decision.allowed)return decision;
  const tmp=join(dirname(path),"."+basename(path)+".tmp");
  writeFileSync(tmp,JSON.stringify(decision.next),{mode:0o600});
  renameSync(tmp,path);
  return decision;
}

/** Hash remote IP with a server-only secret; never persist IP itself. */
export function opaqueVisitorId(ip,secret) {
  return createHash("sha256").update(String(secret||"")).update("|").update(String(ip||"anonymous")).digest("hex").slice(0,24);
}
