/** Run INSIDE the scanner container after docker compose up.
 * Requires no cloud account. Fails if direct egress unexpectedly works.
 */
import net from "node:net";
import assert from "node:assert/strict";

function connectDirect(host,port,timeout=2500){
  return new Promise(resolve=>{
    const socket=net.connect({host,port});
    let settled=false;
    const done=ok=>{if(settled)return;settled=true;socket.destroy();resolve(ok);};
    socket.once("connect",()=>done(true));
    socket.once("error",()=>done(false));
    socket.setTimeout(timeout,()=>done(false));
  });
}
async function connectThroughProxy(authority){
  return new Promise((resolve,reject)=>{
    const socket=net.connect({host:"egress",port:3128});
    let output="";
    socket.setTimeout(3000,()=>{socket.destroy();reject(Error("proxy timeout"));});
    socket.on("connect",()=>socket.write("CONNECT "+authority+" HTTP/1.1\r\nHost: "+authority+"\r\n\r\n"));
    socket.on("data",bytes=>output+=bytes.toString());
    socket.on("end",()=>resolve(output));
    socket.on("error",reject);
  });
}
assert.equal(await connectDirect("1.1.1.1",443),false,"SECURITY FAILURE: worker can reach internet without proxy");
assert.equal(await connectDirect("169.254.169.254",80),false,"SECURITY FAILURE: worker reached metadata link-local");
for(const target of ["169.254.169.254:443","127.0.0.1:443","10.0.0.1:443","example.com:80"]){
  const result=await connectThroughProxy(target);
  assert.match(result,/403 Forbidden/, "Proxy did not deny "+target);
}
console.log("PASS: worker has no direct public/metadata route; proxy rejects forbidden destinations.");
