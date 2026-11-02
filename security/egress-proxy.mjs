/** Restrictive outbound HTTPS-only CONNECT proxy for isolated browser network.
 * Resolve + verify DNS here, at the network boundary; connect to a pinned IP.
 * No HTTP forwarding, local addresses, alternative ports, or direct egress.
 */
import http from "node:http";
import net, { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { fileURLToPath } from "node:url";
import { isPublicAddress } from "../lib/safety.ts";

const MAX_CONNECTIONS=24, MAX_BYTES=24*1024*1024, MAX_AGE_MS=45_000;
export function parseConnectTarget(value) {
  if(typeof value!=="string" || value.length>260 || !/^[a-zA-Z0-9.-]+:443$/.test(value)) throw Error("BAD_AUTHORITY");
  const hostname=value.slice(0,-4).toLowerCase();
  if(!hostname || hostname.endsWith(".") || hostname.startsWith("-") || hostname.includes("..")
    || hostname.length>253 || hostname.split(".").some(x=>x.length>63||x.endsWith("-"))
    || (isIP(hostname)!==4 && !hostname.includes("."))) throw Error("BAD_HOST");
  return {hostname,port:443};
}
export async function resolvePinnedPublicIPv4(host, resolver=lookup) {
  const addresses=isIP(host)?[{address:host,family:isIP(host)}]:await resolver(host,{all:true,verbatim:true});
  if(!Array.isArray(addresses)||!addresses.length||addresses.some(x=>!x?.address||!isPublicAddress(x.address))) throw Error("FORBIDDEN_DESTINATION");
  const ipv4=addresses.find(x=>x.family===4&&isIP(x.address)===4);
  if(!ipv4)throw Error("IPV4_REQUIRED");
  return ipv4.address;
}
function refuse(socket,status=403) {
  if(socket.destroyed)return;
  try {socket.end("HTTP/1.1 "+status+(status===429?" Too Many Requests":" Forbidden")+"\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");}
  catch{socket.destroy();}
}
export function createRestrictedEgressProxy({resolver=lookup,connect=net.connect,maxConnections=MAX_CONNECTIONS}={}) {
  let active=0;
  const server=http.createServer((_,res)=>{res.writeHead(405,{"Content-Length":"0",Connection:"close"});res.end();});
  server.on("connect",async(req,client,head)=>{
    client.on("error",()=>{});
    if(active>=maxConnections){refuse(client,429);return;}
    active++;
    client.once("close",()=>{active--;});
    let remote;
    try {
      const {hostname,port}=parseConnectTarget(req.url);
      const pinned=await resolvePinnedPublicIPv4(hostname,resolver);
      if(client.destroyed)return;
      remote=connect({host:pinned,port,family:4});
      remote.on("error",()=>{client.destroy();});
      client.on("close",()=>remote?.destroy());
      remote.setTimeout(MAX_AGE_MS,()=>remote.destroy());
      client.setTimeout(MAX_AGE_MS,()=>client.destroy());
      remote.once("connect",()=>{
        if(client.destroyed){remote.destroy();return;}
        client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        if(head?.length)remote.write(head);
        let incoming=head?.length??0,outgoing=0;
        client.on("data",chunk=>{incoming+=chunk.length;if(incoming>MAX_BYTES)client.destroy();});
        remote.on("data",chunk=>{outgoing+=chunk.length;if(outgoing>MAX_BYTES)remote.destroy();});
        client.pipe(remote);remote.pipe(client);
      });
    } catch {refuse(client);remote?.destroy();}
  });
  server.on("clientError",(_,socket)=>socket.destroy());
  return server;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const port=Number(process.env.EGRESS_PORT||3128);
  createRestrictedEgressProxy().listen(port,"0.0.0.0",()=>console.log("Restricted HTTPS proxy on port "+port));
}
