import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function createLimiter(prefix: string, tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `ratelimit:${prefix}`,
  });
}

export const loginRateLimit = createLimiter("login", 5, "15 m");
export const registerRateLimit = createLimiter("register", 3, "1 h");
export const forgotPasswordRateLimit = createLimiter("forgot-password", 3, "1 h");
export const resetPasswordRateLimit = createLimiter("reset-password", 5, "15 m");

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Unix timestamp in ms when the limit resets. 0 if unavailable. */
  reset: number;
};

/**
 * Checks a rate limiter and fails open (allows the request) if Upstash isn't
 * configured or the check itself errors, per the feature spec.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, remaining: Infinity, reset: 0 };
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error("Rate limit check failed, failing open:", error);
    return { success: true, remaining: Infinity, reset: 0 };
  }
}

/** Reads the caller's IP from forwarding headers set by Vercel/proxies. */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return "unknown";
}

export function rateLimitMessage(reset: number): string {
  const minutes = Math.max(1, Math.ceil((reset - Date.now()) / 60_000));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

/** Seconds until reset, for the `Retry-After` header. Minimum 1. */
export function retryAfterSeconds(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}
