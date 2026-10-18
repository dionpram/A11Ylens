import { createHash, timingSafeEqual } from "node:crypto";

/**
 * An explicit execution mode prevents accidentally launching Chromium inside
 * a publicly exposed Next.js frontend. The worker must be isolated at the
 * network/container layer; application checks alone cannot stop SSRF.
 */
export type ScanMode = "proxy" | "worker" | "pagespeed" | "development" | "disabled";

export function scanMode(env: NodeJS.ProcessEnv = process.env): ScanMode {
  if (env.SCAN_WORKER_URL?.trim()) return "proxy";
  if (env.SCAN_WORKER_ENABLED === "true" && env.SCAN_WORKER_TOKEN?.trim()) return "worker";
  if (env.PAGESPEED_API_ENABLED === "true") return "pagespeed";
  if (env.NODE_ENV !== "production" && env.SCAN_WORKER_ENABLED !== "true") return "development";
  return "disabled";
}

export function authenticateWorker(received: string | null, configured: string | undefined): boolean {
  if (!configured || configured.length < 32 || !received || received.length > 512) return false;
  const a = createHash("sha256").update(received).digest();
  const b = createHash("sha256").update(configured).digest();
  return timingSafeEqual(a, b);
}

export function workerEndpoint(input: string, env: NodeJS.ProcessEnv = process.env): string {
  const url = new URL(input);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("The scanner service URL must be an origin without credentials, paths or query parameters.");
  }
  if (url.protocol !== "https:" && !(env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("The scanner service must use HTTPS.");
  }
  return new URL("/api/scan", url).toString();
}

export async function readLimitedJson(response: Response, maxBytes = 2_500_000): Promise<unknown> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error("The scanner returned an oversized report.");
  if (!response.body) throw new Error("The scanner returned an empty response.");
  const chunks: Uint8Array[] = [];
  let received = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      received += next.value.byteLength;
      if (received > maxBytes) throw new Error("The scanner returned an oversized report.");
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
    if (received > maxBytes) await response.body.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new Error("The scanner returned an invalid response."); }
}
