import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

// A Next build can succeed while the deployed API function lacks runtime
// assets. Ensure the /api/scan function trace includes Playwright metadata.
const root = new URL("../.next/server/", import.meta.url);
const paths = await readdir(root, { recursive: true });
const traces = paths.filter(name => /(^|[\\/])api[\\/]scan[\\/]route\.js\.nft\.json$/.test(name));
assert.ok(traces.length, "No /api/scan file-trace manifest found after next build.");
for (const path of traces) {
  const payload = JSON.parse(await readFile(new URL("./" + path.replaceAll("\\", "/"), root), "utf8"));
  assert.ok(Array.isArray(payload.files), "Invalid Next.js file trace: " + path);
  assert.ok(
    payload.files.some(file => /(^|[\\/])playwright-core[\\/]browsers\.json$/.test(file)),
    "The /api/scan runtime is missing playwright-core/browsers.json from the trace: " + path,
  );
}
console.log("Verified playwright-core/browsers.json is traced for /api/scan.");
