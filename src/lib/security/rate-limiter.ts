/**
 * In-memory sliding window rate limiter.
 * No external dependencies (no Redis/Upstash needed).
 * Tracks requests per IP + per user.
 *
 * IMPORTANT: This works for single-instance deployments (Vercel, single Node).
 * For multi-instance, switch to Upstash Redis (@upstash/ratelimit).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

/** Clean up old entries every 5 minutes to prevent memory leaks */
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key prefix for namespace separation */
  prefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  retryAfterMs: number | null;
}

/** Default rate limits per endpoint type */
export const RATE_LIMITS = {
  agent: { maxRequests: 15, windowMs: 60_000, prefix: "agent" } as RateLimitConfig,
  compiler: { maxRequests: 20, windowMs: 60_000, prefix: "compiler" } as RateLimitConfig,
  auth: { maxRequests: 5, windowMs: 60_000, prefix: "auth" } as RateLimitConfig,
  general: { maxRequests: 60, windowMs: 60_000, prefix: "general" } as RateLimitConfig,
};

/**
 * Check if a request is rate limited.
 * @param identifier - IP address or user ID
 * @param config - rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const key = `${config.prefix}:${identifier}`;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + config.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs,
      retryAfterMs: resetMs,
    };
  }

  // Allow request
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetMs: config.windowMs,
    retryAfterMs: null,
  };
}

/** Get client IP from Next.js request headers */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
