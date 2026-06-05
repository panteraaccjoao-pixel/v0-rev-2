import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple in-memory rate limiter for middleware
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()

// Clean up periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of ipRequestCounts.entries()) {
      if (now > entry.resetTime) {
        ipRequestCounts.delete(key)
      }
    }
  }, 60000)
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  return "unknown"
}

function checkGlobalRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 100 // 100 requests per minute per IP

  let entry = ipRequestCounts.get(ip)

  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + windowMs }
    ipRequestCounts.set(ip, entry)
    return { allowed: true, remaining: maxRequests - 1 }
  }

  entry.count++

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: maxRequests - entry.count }
}

export function middleware(request: NextRequest) {
  const ip = getClientIP(request)
  const url = request.nextUrl.pathname

  // Skip rate limiting for static assets
  if (
    url.startsWith("/_next") ||
    url.startsWith("/favicon") ||
    url.includes(".")
  ) {
    return NextResponse.next()
  }

  // Block suspicious user agents
  const userAgent = request.headers.get("user-agent") || ""
  const suspiciousAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
  ]

  if (suspiciousAgents.some((pattern) => pattern.test(userAgent))) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  // Apply global rate limiting
  const rateLimit = checkGlobalRateLimit(ip)

  if (!rateLimit.allowed) {
    return new NextResponse(
      JSON.stringify({ error: "Muitas requisicoes. Tente novamente mais tarde." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      }
    )
  }

  // Create response with security headers
  const response = NextResponse.next()

  // Security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  )
  
  // Add rate limit headers
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining))

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
