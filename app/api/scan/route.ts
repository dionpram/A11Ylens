import { scanWebsite } from "@/lib/scanner";
import { scanWithPageSpeed } from "@/lib/pagespeed";
import { authenticateWorker, readLimitedJson, scanMode, workerEndpoint } from "@/lib/scan-gateway";

export const runtime = "nodejs";
export const maxDuration = 60;

// Development/single-process throttling only. Public traffic must also be
// protected by an external persistent rate limiter and job concurrency policy.
const visitors = new Map<string, number[]>();
let scanning = false;
const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers: noStore });

export async function POST(request: Request) {
  const mode = scanMode();
  if (process.env.SCANNER_SECURITY_HOLD === "true") {
    return Response.json({ error: "Scanning is paused for security verification.", code: "SCANNER_SECURITY_HOLD" }, { status: 503, headers: noStore });
  }
  if (mode === "disabled") return fail("Scanning is not configured on this preview. Try the sample report for now.", 503);

  // The browser-worker endpoint is never usable without a long shared secret.
  if (mode === "worker" && !authenticateWorker(request.headers.get("x-a11ylens-worker-token"), process.env.SCAN_WORKER_TOKEN)) {
    return fail("Unauthorized.", 401);
  }

  // Hard request-body cap; do not parse unbounded user-supplied payloads.
  if (Number(request.headers.get("content-length") || 0) > 4096) return fail("Request is too large.", 413);
  let url = "";
  try {
    const text = await request.text();
    if (text.length > 4096) return fail("Request is too large.", 413);
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || !("url" in body) || typeof body.url !== "string") throw Error("Invalid URL");
    url = body.url.trim();
    if (!url || url.length > 2048) throw Error("Invalid URL");
  } catch { return fail("Enter a valid website URL.", 400); }

  // Treat browser-supplied forwarding headers as advisory only. This is not
  // adequate identity or rate-limiting for a multi-instance public service.
  if (mode !== "worker") {
    if (visitors.size > 5000) visitors.clear();
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const key = ip.trim().slice(0, 128);
    const now = Date.now();
    const recent = (visitors.get(key) || []).filter(t => now - t < 10 * 60 * 1000);
    if (recent.length >= 3) return fail("Rate limit reached. Please try again later.", 429);
    recent.push(now);
    visitors.set(key, recent);
  }

  if (mode === "proxy") {
    if (!process.env.SCAN_WORKER_TOKEN || process.env.SCAN_WORKER_TOKEN.length < 32) return fail("Scanner service credentials are not configured.", 503);
    try {
      const endpoint = workerEndpoint(process.env.SCAN_WORKER_URL!);
      const result = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-a11ylens-worker-token": process.env.SCAN_WORKER_TOKEN },
        body: JSON.stringify({ url }),
        cache: "no-store",
        signal: AbortSignal.timeout(55_000),
      });
      const report = await readLimitedJson(result);
      if (!report || typeof report !== "object") throw new Error("Invalid report format");
      if (!result.ok) {
        const value = report as { error?: unknown };
        return fail(typeof value.error === "string" ? value.error.slice(0, 220) : "The scanner could not complete this request.", [400, 408, 413, 429, 503].includes(result.status) ? result.status : 502);
      }
      if (!("id" in report) || !("failures" in report) || !("passes" in report)) throw new Error("Invalid report format");
      return Response.json(report, { headers: noStore });
    } catch {
      return fail("The scanning service is unavailable or returned an invalid report. Please try again later.", 502);
    }
  }

  if (mode === "pagespeed") {
    try {
      // The backend contacts only Google's fixed HTTPS API endpoint.
      // Google, not this application's browser, fetches the supplied URL.
      const report = await scanWithPageSpeed(url);
      return Response.json(report, { headers: noStore });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The remote accessibility audit failed.";
      return fail(message.slice(0, 260), 503);
    }
  }

  if (scanning) return fail("The scanner is busy. Please try again shortly.", 503);
  scanning = true;
  try {
    const report = await scanWebsite(url);
    return Response.json(report, { headers: noStore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The scan could not be completed.";
    return fail(message.slice(0, 260), 400);
  } finally {
    scanning = false;
  }
}
