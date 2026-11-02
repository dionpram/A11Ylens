import { allowAnyPublicBetaHost, scanMode } from "@/lib/scan-gateway";

export const dynamic = "force-dynamic";

export function GET() {
  const mode = scanMode();
  // Safe diagnostic metadata: no provider identifiers, tokens or user data.
  // Preview capability is determined at request time by the branch-scoped environment.
  const scanAvailable = mode !== "disabled";
  const urlScope = mode === "managed-browser"
    ? (allowAnyPublicBetaHost() ? "public-https-preview" : "approved-beta-sites")
    : scanAvailable ? "configured-scanner" : "paused";
  return Response.json({ status: "ok", scanAvailable, urlScope, scanEngine: mode === "pagespeed" ? "lighthouse" : mode === "managed-browser" ? "axe-core" : "unavailable" }, { headers: { "Cache-Control": "no-store" } });
}
