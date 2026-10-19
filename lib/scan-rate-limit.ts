import type { ScanMode } from "./scan-gateway";

/**
 * Per-instance development protection only. It is NOT a shared/distributed
 * rate limiter or a substitute for quota limits on Browserless.
 */
export type ScanRatePolicy = { limit: number; windowMs: number };
export function scanRateLimitPolicy(mode: ScanMode): ScanRatePolicy {
  return { limit: mode === "managed-browser" ? 12 : 3, windowMs: 10 * 60 * 1000 };
}

export function consumeScanBudget(
  timestamps: readonly number[],
  now: number,
  policy: ScanRatePolicy,
): { allowed: boolean; retryAfterSeconds: number; timestamps: number[] } {
  const recent = timestamps.filter(time => Number.isFinite(time) && time <= now && now - time < policy.windowMs);
  if (recent.length >= policy.limit) {
    const oldest = Math.min(...recent);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((policy.windowMs - (now - oldest)) / 1000)), timestamps: recent };
  }
  return { allowed: true, retryAfterSeconds: 0, timestamps: [...recent, now] };
}
