/** Localhost-only HTTP gateway to an isolated scanner on a Docker internal network.
 * This gateway has no browser and never accepts a user-selected upstream URL.
 * The browser worker remains unable to route directly to the internet.
 */
import http from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";

function matches(token, secret) {
  if(!token||!secret||secret.length<32)return false;
  const a=createHash("sha256").update(token).digest();
  const b=createHash("sha256").update(secret).digest();
  return timingSafeEqual(a,b);
}
function reply(res,status,message) {
  res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
  res.end(JSON.stringify({error:message}));
}
export function createLocalIngress({ token=process.env.SCAN_WORKER_TOKEN }={}) {
  const server=http.createServer(async (req,res)=>{
    if(req.method==="GET"&&req.url==="/api/health"){
      res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});
      res.end(JSON.stringify({status:"ok",localOnly:true}));return;
    }
    if(req.method!=="POST"||req.url!=="/api/scan"){reply(res,404,"Not found");return;}
    if(req.headers.origin){reply(res,403,"Cross-origin browser requests are not supported.");return;}
    const localToken=req.headers["x-a11ylens-local-token"];
    if(typeof localToken!=="string"||!matches(localToken,token)){reply(res,401,"Unauthorized local request.");return;}
    if(!/^application\/json(?:;|$)/i.test(req.headers["content-type"]||"")){reply(res,415,"JSON body required.");return;}
    if(Number(req.headers["content-length"]||0)>4096){reply(res,413,"Request too large.");return;}
    let body="";
    try {
      for await (const chunk of req){body+=chunk.toString("utf8");if(body.length>4096)throw Error("large");}
      const parsed=JSON.parse(body);
      if(typeof parsed?.url!=="string"||parsed.url.length>2048)throw Error("bad");
    } catch {reply(res,400,"Invalid scan request.");return;}
    // Worker token is never given to the browser or forwarded from visitors.
    const visitor=req.headers["x-a11ylens-visitor-id"];
    const visitorId=typeof visitor==="string"&&/^[0-9a-f]{16,64}$/i.test(visitor)?visitor:"anonymous";
    const upstream=http.request({
      host:"scanner",port:3000,path:"/api/scan",method:"POST",
      headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body),
        "x-a11ylens-worker-token":token,"x-a11ylens-visitor-id":visitorId},
      timeout:56_000,
    },response=>{
      let size=0;const chunks=[];
      response.on("data",part=>{
        size+=part.length;
        if(size>2_500_000){response.destroy();return;}
        chunks.push(part);
      });
      response.on("end",()=>{
        if(res.writableEnded)return;
        res.writeHead(response.statusCode||502,{"Content-Type":"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
        res.end(Buffer.concat(chunks));
      });
    });
    upstream.on("timeout",()=>upstream.destroy());
    upstream.on("error",()=>{if(!res.writableEnded)reply(res,502,"Local scanner unavailable.");});
    upstream.end(body);
  });
  server.on("clientError",(_err,socket)=>socket.destroy());
  return server;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  createLocalIngress().listen(3002,"0.0.0.0",()=>console.log("Local scan ingress on port 3002"));
}
