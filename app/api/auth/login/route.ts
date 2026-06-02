import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// User credentials - In production, these would be stored in a database
const TEST_USER = {
  email: "teste123@gmail.com",
  password: "teste123",
  name: "Usuário Teste",
  balance: 0
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate credentials
    if (email === TEST_USER.email && password === TEST_USER.password) {
      // Generate a simple token
      const token = crypto.randomBytes(32).toString("hex")
      
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
