/**
 * Validate a pasted public website address BEFORE the beta-domain allowlist.
 * Reject tokens, short identifiers and malformed URLs with actionable errors.
 * DNS / SSRF validation still runs on the scanner for approved URLs.
 */
export function normalizeWebsiteInput(value: string): string {
  const cleaned = value.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!cleaned || cleaned.length > 2048) throw new Error("Invalid website address");
  if (/\s/.test(cleaned)) throw new Error("Invalid website address");
  const candidate = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
  let address: URL;
  try { address = new URL(candidate); }
  catch { throw new Error("Invalid website address"); }
  if (!["http:","https:"].includes(address.protocol) || address.username || address.password)
    throw new Error("Invalid website address");
  if (address.port && !["80","443"].includes(address.port))
    throw new Error("Invalid website address");
  const host = address.hostname.toLowerCase();
  if (!host.includes(".") || host.endsWith(".") || host.length > 253 || host.includes("_") || /[^a-z0-9.\-]/.test(host))
    throw new Error("Invalid website address");
  if (host.split(".").some(label => !label || label.length > 63 || label.startsWith("-") || label.endsWith("-")))
    throw new Error("Invalid website address");
  return address.toString();
}
