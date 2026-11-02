// Manual, opt-in multi-site test. No provider key. Tests one URL at a time.
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
const file=process.argv[2], token=process.env.SCAN_WORKER_TOKEN;
if(!file||!token||token.length<32){console.error("Usage: export SCAN_WORKER_TOKEN=...; node scripts/test-public-sites.mjs urls.txt");process.exit(2);}
const urls=(await readFile(file,"utf8")).split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith("#"));
if(!urls.length||urls.length>10||new Set(urls).size!==urls.length)throw Error("Provide 1-10 unique public websites.");
for(const text of urls){const u=new URL(text);if(u.protocol!=="https:"||u.username||u.password)throw Error("Only public HTTPS URLs without credentials.");}
let completed=0;
for(let i=0;i<urls.length;i++){
  const u=urls[i], host=new URL(u).hostname, start=Date.now();
  try{
    const result=await fetch("http://127.0.0.1:3001/api/scan",{
      method:"POST",headers:{
        "Content-Type":"application/json",
        "x-a11ylens-local-token":token,
        "x-a11ylens-visitor-id":createHash("sha256").update("operator-"+i).digest("hex").slice(0,24)
      },body:JSON.stringify({url:u}),signal:AbortSignal.timeout(59000)
    });
    const data=await result.json();
    const valid=result.ok&&typeof data.id==="string"&&data.environment?.engine==="axe-core"&&
      Array.isArray(data.passes)&&Array.isArray(data.failures)&&Array.isArray(data.review);
    if(valid)completed++;
    console.log(JSON.stringify({host,http:result.status,valid,seconds:Math.round((Date.now()-start)/1000),
      fails:valid?data.failures.length:null,passes:valid?data.passes.length:null,
      code:typeof data.code==="string"?data.code:undefined}));
  }catch{console.log(JSON.stringify({host,valid:false,code:"REQUEST_FAILED",seconds:Math.round((Date.now()-start)/1000)}));}
  if(i<urls.length-1)await new Promise(r=>setTimeout(r,1000));
}
console.log("Verified "+completed+" of "+urls.length+" scanned websites.");
if(completed!==urls.length)process.exitCode=1;
