import { NextResponse } from "next/server"

// Security headers to protect against common attacks
export const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

// Validate request origin
export function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")
  
  // Allow same-origin requests
  if (!origin) return true
  
  // Check if origin matches host
  try {
    const originUrl = new URL(origin)
    const hostDomain = host?.split(":")[0]
    return originUrl.hostname === hostDomain || 
           originUrl.hostname === "localhost" ||
           originUrl.hostname === "revsystemcc.com" ||
           originUrl.hostname.endsWith(".revsystemcc.com")
  } catch {
    return false
  }
}

// Sanitize user input to prevent XSS (use only for HTML output, NOT for DB queries or emails)
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return ""

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
}

// Normaliza email para uso em DB/lógica — NÃO usa HTML encoding que corromperia endereços com /
export function normalizeEmail(email: string): string {
  if (typeof email !== "string") return ""
  return email.trim().toLowerCase().slice(0, 254)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Validate that input is a safe string (no SQL injection patterns)
export function isSafeString(input: string): boolean {
  if (typeof input !== "string") return false
  
  // Check for common SQL injection patterns
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|TRUNCATE)\b)/i,
    /(-{2}|;|\/\*|\*\/)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /('{2,}|"{2,})/,
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(input))
}

// Create rate limit exceeded response
export function rateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    { error: "Muitas requisicoes. Tente novamente mais tarde." },
    { 
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(resetIn / 1000)),
        "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000 + resetIn / 1000)),
      }
    }
  )
}

// Block suspicious requests
export function isSuspiciousRequest(request: Request): boolean {
  const userAgent = request.headers.get("user-agent") || ""
  
  // Block requests without user agent
  if (!userAgent) return true
  
  // Block common bot/scanner user agents
  const suspiciousAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
    /python-requests/i,
    /curl\/\d/i,
    /wget/i,
  ]
  
  return suspiciousAgents.some(pattern => pattern.test(userAgent))
}
