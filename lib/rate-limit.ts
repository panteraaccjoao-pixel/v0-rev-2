// Simple in-memory rate limiter
// For production, use Redis-based rate limiting (e.g., Upstash)

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 60, // 60 requests per minute
}

// Stricter limits for sensitive endpoints
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  login: { windowMs: 300000, maxRequests: 5 }, // 5 attempts per 5 minutes
  register: { windowMs: 3600000, maxRequests: 3 }, // 3 registrations per hour
  pix: { windowMs: 60000, maxRequests: 10 }, // 10 PIX requests per minute
  default: defaultConfig,
}

export function checkRateLimit(
  identifier: string,
  endpoint: string = "default"
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = rateLimitConfigs[endpoint] || rateLimitConfigs.default
  const key = `${identifier}:${endpoint}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }

  // Increment count
  entry.count++

  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

export function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }

  // Fallback
  return "unknown"
}
