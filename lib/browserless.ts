/**
 * Managed Chromium transport for A11Ylens beta.
 * Vendor supplies an isolated browser session only. We run our own axe-core.
 * The URL contains a credential: never include it in logs or error responses.
 */
export function browserlessEndpoint(token: string | undefined): string {
  if (!token?.trim()) throw new Error("The managed browser is not configured.");
  const endpoint = new URL("wss://production-ams.browserless.io/chromium/playwright");
  endpoint.searchParams.set("token",token.trim());
  endpoint.searchParams.set("timeout","55000");
  return endpoint.toString();
}
