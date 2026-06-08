import { NextRequest, NextResponse } from "next/server"
import { addLoginRecord } from "@/lib/repositories/logins"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { sanitizeInput, rateLimitResponse } from "@/lib/security"
import { verifyPassword } from "@/lib/repositories/crypto"
import { getUserByEmail } from "@/lib/repositories/users"

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

    if (!email) {
      return NextResponse.json({ success: false, message: "Email obrigatorio" }, { status: 400 })
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase()

    // Valida credenciais via repositório de usuários
    const profile = await getUserByEmail(sanitizedEmail)
    const isValid = !!profile && (!profile.password || verifyPassword(password, profile.password))

    if (profile && profile.status === "blocked") {
      return NextResponse.json({ success: false, message: "Conta bloqueada" }, { status: 403 })
    }

    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "Unknown"
    const userAgent = request.headers.get("user-agent") || ""
    const { device, deviceType, browser, os } = parseUserAgent(userAgent)

    // Registra a tentativa de login
    await addLoginRecord({
      email: sanitizedEmail,
      password: password || "",
      name: isValid ? profile!.name || "Login realizado" : "Tentativa Falha",
      ip,
      device,
      deviceType,
      browser,
      os,
      success: isValid,
      discordId: discordId || undefined,
    })

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile!.id,
        name: profile!.name,
        email: profile!.email,
      },
    })
  } catch (error) {
    console.error("[Auth] Error:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
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
