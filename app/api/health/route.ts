import { scanMode } from "@/lib/scan-gateway";

export const dynamic = "force-dynamic";

export function GET() {
  const mode = scanMode();
  return Response.json({ status: "ok", scanAvailable: mode !== "disabled" }, { headers: { "Cache-Control": "no-store" } });
}
