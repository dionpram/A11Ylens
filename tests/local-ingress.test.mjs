import {test} from "node:test";
import assert from "node:assert/strict";
import {createLocalIngress} from "../security/local-ingress.mjs";

test("local gateway refuses requests without secret, cross-origin requests and oversized bodies",async()=>{
  const secret="a".repeat(64);
  const server=createLocalIngress({token:secret});
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port+"/api/scan";
  try{
    const missing=await fetch(base,{method:"POST",headers:{"content-type":"application/json"},body:'{"url":"https://example.com"}'});
    assert.equal(missing.status,401);
    const wrong=await fetch(base,{method:"POST",headers:{"content-type":"application/json","x-a11ylens-local-token":"bad"},body:'{"url":"https://example.com"}'});
    assert.equal(wrong.status,401);
    const cross=await fetch(base,{method:"POST",headers:{"origin":"https://evil.example","content-type":"application/json","x-a11ylens-local-token":secret},body:'{"url":"https://example.com"}'});
    assert.equal(cross.status,403);
    const huge=await fetch(base,{method:"POST",headers:{"content-type":"application/json","x-a11ylens-local-token":secret},body:"x".repeat(4100)});
    assert.equal(huge.status,413);
  } finally{await new Promise(resolve=>server.close(resolve));}
});
