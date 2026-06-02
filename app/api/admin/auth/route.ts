import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Admin credentials - In production, store these securely in environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@revsystem.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Generate a simple token
      const token = crypto.randomBytes(32).toString("hex")
      
      // In production, you would:
      // 1. Store this token in a database with expiration
      // 2. Use proper JWT tokens
      // 3. Implement refresh tokens
      
      const response = NextResponse.json({
        success: true,
        token,
        message: "Login realizado com sucesso"
      })

      // Set HTTP-only cookie for additional security
      response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 // 24 hours
      })

      return response
    }

    return NextResponse.json({
      success: false,
      message: "Email ou senha incorretos"
    }, { status: 401 })

  } catch (error) {
    console.error("[Admin Auth] Error:", error)
    return NextResponse.json({
      success: false,
      message: "Erro interno do servidor"
    }, { status: 500 })
  }
}

export async function DELETE() {
  // Logout - clear the cookie
  const response = NextResponse.json({
    success: true,
    message: "Logout realizado com sucesso"
  })

  response.cookies.delete("admin_token")

  return response
}
