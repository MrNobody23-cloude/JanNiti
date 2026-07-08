import { Request, Response } from "express";
import { getRedisClient } from "@/config/redis";

export interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    max: number; // Max requests per window
    identifier?: "ip" | "user" | "api-key"; // What to rate limit by
    keyPrefix?: string; // Prefix for Redis key
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number; // Unix timestamp
}

// Preset configs for different endpoint types
export const RATE_LIMIT_PRESETS = {
    // Public submission endpoint
    submission: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 submissions per hour per IP
        keyPrefix: "rl:submission",
    },
    // AI endpoints (expensive)
    ai: {
        windowMs: 60 * 1000, // 1 minute
        max: 20, // 20 requests per minute
        keyPrefix: "rl:ai",
    },
    // Copilot chat
    copilot: {
        windowMs: 60 * 1000, // 1 minute
        max: 10,
        keyPrefix: "rl:copilot",
    },
    // General API
    api: {
        windowMs: 60 * 1000, // 1 minute
        max: 60, // 60 requests per minute
        keyPrefix: "rl:api",
    },
    // File upload
    upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // 20 uploads per hour
        keyPrefix: "rl:upload",
    },
} satisfies Record<string, RateLimitConfig>;

/**
 * Check rate limit for a request using Redis sliding window.
 * If rate limit exceeded, it sends a 429 response on res and returns { allowed: false }.
 */
export async function checkRateLimit(
    req: Request,
    res: Response,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const defaultResult = { allowed: true, remaining: config.max, resetAt: Date.now() + config.windowMs };

    let redis;
    try {
        redis = getRedisClient();
        // Quick check if Redis is connected
        if (redis.status !== "ready") {
            // If Redis isn't available, allow the request (fail open)
            return defaultResult;
        }
    } catch {
        return defaultResult;
    }

    const identifier = getIdentifier(req, config.identifier ?? "ip");
    const key = `${config.keyPrefix ?? "rl"}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
        // Sliding window using Redis sorted sets
        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(key, "-inf", windowStart.toString()); // Remove expired entries
        pipeline.zadd(key, now.toString(), `${now}-${Math.random()}`); // Add current request
        pipeline.zcard(key); // Count requests in window
        pipeline.pexpire(key, config.windowMs); // Set TTL

        const results = await pipeline.exec();
        const count = (results?.[2]?.[1] as number) ?? 0;

        const remaining = Math.max(0, config.max - count);
        const resetAt = now + config.windowMs;

        // Set rate limit headers
        res.setHeader("X-RateLimit-Limit", config.max.toString());
        res.setHeader("X-RateLimit-Remaining", remaining.toString());
        res.setHeader("X-RateLimit-Reset", resetAt.toString());

        if (count > config.max) {
            const retryAfter = Math.ceil(config.windowMs / 1000);
            res.setHeader("Retry-After", retryAfter.toString());
            res.status(429).json({
                error: "Too Many Requests",
                message: "Rate limit exceeded. Please try again later.",
                retryAfter,
            });

            return {
                allowed: false,
                remaining: 0,
                resetAt,
            };
        }

        return { allowed: true, remaining, resetAt };
    } catch (error) {
        // If Redis fails, fail open (allow request)
        console.error("Rate limit check failed:", error);
        return defaultResult;
    }
}

/**
 * Extract the identifier to rate limit by.
 */
function getIdentifier(req: Request, type: "ip" | "user" | "api-key"): string {
    if (type === "ip") {
        const forwarded = req.headers["x-forwarded-for"];
        if (forwarded) {
            return Array.isArray(forwarded)
                ? forwarded[0].split(",")[0].trim()
                : forwarded.split(",")[0].trim();
        }
        return req.ip ?? req.socket.remoteAddress ?? "unknown";
    }

    if (type === "api-key") {
        const apiKey = req.headers["x-api-key"];
        return (Array.isArray(apiKey) ? apiKey[0] : apiKey) ?? getIdentifier(req, "ip");
    }

    // User-based limiting: check if authenticated user exists on req
    if (req.user?.id) {
        return `user:${req.user.id}`;
    }

    // Fallback to token hash
    const authHeader = req.headers["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        return `user:${token.slice(-16)}`; // Use last 16 chars as identifier
    }

    return getIdentifier(req, "ip");
}
