import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const port=34341,base="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--port",String(port)],{env:{...process.env,NODE_ENV:"production",SCANNER_SECURITY_HOLD:"true"},stdio:"ignore"});
let browser;
try {
  let ready=false;
  for(let i=0;i<40;i++){
    try {const r=await fetch(base);if(r.ok){ready=true;break;}}catch{}
    await delay(500);
  }
  assert.ok(ready,"Next server did not become ready for PDF layout test");
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  await page.goto(base,{waitUntil:"domcontentloaded"});
  await page.getByRole("button",{name:/Take a look at a sample report/i}).click();
  await page.locator(".pdf-cover").waitFor({state:"attached"});
  assert.equal(await page.locator(".pdf-report").count(),1);
  assert.equal(await page.locator(".pdf-priority").count(),3);
  assert.ok(await page.locator(".pdf-finding").count()>=3);
  assert.ok(await page.locator(".pdf-table").count()>=2);
  await page.emulateMedia({media:"print"});
  const details=await page.locator(".pdf-report").evaluate(el=>{
    const top=el.querySelector(".pdf-cover");
    return {printed:getComputedStyle(el).display,cover:getComputedStyle(top).backgroundColor,coverSize:top.getBoundingClientRect().height};
  });
  assert.equal(details.printed,"block");
  assert.notEqual(details.cover,"rgba(0, 0, 0, 0)");
  const pdf=await page.pdf({printBackground:true,preferCSSPageSize:true});
  assert.ok(pdf.length>14000,"PDF missing rich report content");
  await mkdir("artifacts",{recursive:true});
  await writeFile("artifacts/a11ylens-sample-report.pdf",pdf);
  const text=execFileSync("pdftotext",["artifacts/a11ylens-sample-report.pdf","-"],{encoding:"utf8"});
  for(const section of ["Executive summary","Recommended priorities","What needs fixing","What's working well","What needs review","About this assessment","SAMPLE REPORT"]) {
    assert.ok(text.includes(section),"Missing PDF section: "+section);
  }
  const meta=execFileSync("pdfinfo",["artifacts/a11ylens-sample-report.pdf"],{encoding:"utf8"});
  const match=meta.match(/^Pages:\s+(\d+)/m);
  assert.ok(match,"PDF page count missing");
  assert.ok(Number(match[1])>=2&&Number(match[1])<=14,"Unexpected PDF length: "+match[1]);
  console.log("PDF EXPORT PASS: "+match[1]+" A4 pages; summary, priorities, findings, passed checks, review and method present.");
} finally {
  if(browser)await browser.close().catch(()=>{});
  server.kill("SIGTERM");
}
