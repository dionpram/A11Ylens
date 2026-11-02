import { allowAnyPublicBetaHost, scanMode } from "@/lib/scan-gateway";

export const dynamic = "force-dynamic";

export function GET() {
  const mode = scanMode();
  // Safe diagnostic metadata: no provider identifiers, tokens or user data.
  const scanAvailable = mode !== "disabled";
  const urlScope = mode === "managed-browser"
    ? (allowAnyPublicBetaHost() ? "public-https-preview" : "approved-beta-sites")
    : scanAvailable ? "configured-scanner" : "paused";
  return Response.json({ status: "ok", scanAvailable, urlScope }, { headers: { "Cache-Control": "no-store" } });
}
