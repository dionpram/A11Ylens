import { scanWebsite } from "@/lib/scanner";

export const runtime = "nodejs";
export const maxDuration = 60;

const visitors = new Map<string, number[]>();
let scanning = false;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = ip.slice(0, 128);
  const now = Date.now();
  const recent = (visitors.get(key) || []).filter(t => now - t < 10 * 60 * 1000);
  if (recent.length >= 3) {
    return Response.json({ error: "Rate limit reached. Please try again later." }, { status: 429 });
  }
  if (scanning) return Response.json({ error: "The scanner is busy. Please try again shortly." }, { status: 503 });

  let url = "";
  try {
    const body = await request.json();
    if (typeof body?.url !== "string") throw new Error("Enter a valid website URL.");
    url = body.url.trim();
  } catch {
    return Response.json({ error: "Enter a valid website URL." }, { status: 400 });
  }

  recent.push(now);
  visitors.set(key, recent);
  scanning = true;
  try {
    const report = await scanWebsite(url);
    return Response.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The scan could not be completed.";
    return Response.json({ error: message.slice(0, 260) }, { status: 400, headers: { "Cache-Control": "no-store" } });
  } finally {
    scanning = false;
  }
}
