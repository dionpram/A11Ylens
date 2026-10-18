/**
 * Stable, non-sensitive scanner error contract. Never send a provider response
 * or WebSocket URL to visitors: Browserless URLs contain an API token.
 */
export type ScanStep = "VALIDATE_URL" | "CONNECT_BROWSER" | "CREATE_CONTEXT" | "INTERCEPT_REQUESTS" | "NAVIGATE_PAGE" | "RUN_AXE" | "BUILD_PREVIEW" | "FORMAT_REPORT";

export class ScanStepError extends Error {
  constructor(public readonly step: ScanStep) {
    super("The scanner could not complete the " + step.toLowerCase().replaceAll("_", " ") + " stage.");
    this.name = "ScanStepError";
  }
}

export function safeScannerFailure(error: unknown): { message: string; code: string } {
  const step = error instanceof ScanStepError ? error.step : "UNKNOWN";
  const messages: Record<string, string> = {
    VALIDATE_URL: "The webpage URL could not be verified as a public address.",
    CONNECT_BROWSER: "We couldn't connect to the scanning browser. The website was not analyzed.",
    CREATE_CONTEXT: "The scanning browser couldn't start a page session.",
    INTERCEPT_REQUESTS: "The browser couldn't set up safe request handling.",
    NAVIGATE_PAGE: "The scanning browser couldn't open this page reliably.",
    RUN_AXE: "The automated accessibility checks couldn't complete.",
    BUILD_PREVIEW: "The report could not finish building its visual recommendation.",
    FORMAT_REPORT: "The scanned results could not be assembled into a report.",
    UNKNOWN: "The scanning service couldn't complete the request.",
  };
  return { code: "SCAN_" + step, message: messages[step] };
}

function asObject(data: unknown): Record<string, unknown> | null {
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : null;
}

/** Converts arbitrary errors/HTTP responses into a useful, non-object-string UX. */
export function parseScanFailure(data: unknown, status: number): { message: string; code: string } {
  const obj = asObject(data);
  const error = obj?.error;
  const nested = asObject(error);
  const raw = typeof error === "string" ? error :
    typeof nested?.message === "string" ? nested.message :
    typeof obj?.message === "string" ? obj.message : "";
  const code = typeof obj?.code === "string" && /^[A-Z0-9_]{2,60}$/.test(obj.code)
    ? obj.code : "HTTP_" + String(Number.isFinite(status) ? status : 0);
  const message = raw && raw !== "[object Object]" && raw.length <= 300 && !/\/var\/task|node_modules|token=|wss:\/\/|stack trace/i.test(raw)
    ? raw
    : "The scan service returned an unexpected error (HTTP " + status + "). The page has not been evaluated.";
  return { message, code };
}
