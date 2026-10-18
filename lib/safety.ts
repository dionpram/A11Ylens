import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const blockedHost = /(^|\.)(localhost|local|internal|localhost\.localdomain)$/i;

function isPublicIPv4(ip: string): boolean {
  const q = ip.split(".").map(Number);
  if (q.length !== 4 || q.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b, c] = q;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 168 || b === 0 || (b === 0 && c === 2))) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  return a >= 1 && a <= 223;
}

// Permit only native IPv6 global unicast, not transition or tunneled networks.
function isPublicIPv6(ip: string): boolean {
  if (isIP(ip) !== 6) return false;
  const address = ip.toLowerCase();
  if (address.includes(".")) return false; // IPv4-mapped and hybrid forms
  const [firstText, secondText] = address.split(":");
  const first = Number.parseInt(firstText, 16);
  const second = Number.parseInt(secondText || "0", 16);
  if (!Number.isFinite(first) || first < 0x2000 || first > 0x3fff) return false;
  if (first === 0x2002) return false; // 6to4 can encapsulate private IPv4
  if (first === 0x2001 && (second === 0 || second === 0xdb8)) return false; // Teredo / docs
  return true;
}

export function isPublicAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPublicIPv4(ip);
  return isPublicIPv6(ip);
}

export async function validatePublicUrl(raw: string): Promise<string> {
  if (raw.length > 2048) throw new Error("This URL is too long.");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Enter a valid URL including https://."); }
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS pages can be scanned.");
  if (url.username || url.password) throw new Error("URLs containing credentials are not supported.");
  // Explicitly opt into localhost/odd ports only for isolated development fixtures.
  if (process.env.ALLOW_LOCAL_SCANS === "true" && process.env.NODE_ENV !== "production") return url.toString();
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Only standard HTTP and HTTPS ports are supported.");
  if (blockedHost.test(url.hostname)) throw new Error("Private or local addresses can't be scanned.");
  if (!url.hostname || url.hostname.endsWith(".")) throw new Error("Enter a public website address.");
  const resolved = await lookup(url.hostname, { all: true, verbatim: true });
  if (!resolved.length || resolved.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("This host resolves to a restricted or non-public IP address.");
  }
  return url.toString();
}

// Application-level checks are defense in depth, NOT a substitute for a container
// with network egress blocked to metadata endpoints and internal/private networks.
