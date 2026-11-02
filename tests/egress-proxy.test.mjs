import {test} from "node:test";
import assert from "node:assert/strict";
import {createConnection} from "node:net";
import {parseConnectTarget,resolvePinnedPublicIPv4,createRestrictedEgressProxy} from "../security/egress-proxy.mjs";
test("only HTTPS CONNECT port 443 to public-style authorities",()=>{
  assert.deepEqual(parseConnectTarget("example.com:443"),{hostname:"example.com",port:443});
  for(const raw of ["localhost:443","example.com:80","example.com:8080","[::1]:443","http://example.com:443","user@evil.com:443","example.com.:443","x:443","example.com/a:443"])
    assert.throws(()=>parseConnectTarget(raw),undefined,raw);
});
test("block private/metadata DNS answers and rebinding mixes before opening socket",async()=>{
  const forbidden=[
    [{address:"10.0.0.1",family:4}],
    [{address:"8.8.8.8",family:4},{address:"169.254.169.254",family:4}],
    [{address:"93.184.215.14",family:4},{address:"::1",family:6}],
    [],
  ];
  for(const records of forbidden)await assert.rejects(()=>resolvePinnedPublicIPv4("example.com",async()=>records),/FORBIDDEN_DESTINATION/);
  assert.equal(await resolvePinnedPublicIPv4("example.com",async()=>[{address:"93.184.215.14",family:4}]),"93.184.215.14");
  await assert.rejects(()=>resolvePinnedPublicIPv4("127.0.0.1"),/FORBIDDEN_DESTINATION/);
});
test("real denied CONNECT does not create an outbound socket",async()=>{
  let outbound=0;
  const server=createRestrictedEgressProxy({resolver:async()=>[{address:"127.0.0.1",family:4}],connect:()=>{outbound++;throw Error("No");}});
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  try {
    const port=server.address().port;
    const reply=await new Promise((resolve,reject)=>{
      const socket=createConnection({host:"127.0.0.1",port});
      let text="";
      socket.setTimeout(3000,()=>{socket.destroy();reject(Error("timeout"));});
      socket.on("connect",()=>socket.write("CONNECT metadata.example:443 HTTP/1.1\r\nHost: metadata.example:443\r\n\r\n"));
      socket.on("data",data=>text+=data.toString());
      socket.on("end",()=>resolve(text));
      socket.on("error",reject);
    });
    assert.match(reply,/403 Forbidden/);assert.equal(outbound,0);
  } finally {await new Promise(resolve=>server.close(resolve));}
});
