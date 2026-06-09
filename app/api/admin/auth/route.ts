import { NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/repositories/crypto"
import { createAdminToken, revokeAdminToken } from "@/lib/repositories/admin-session"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"
import { findAdminByEmail } from "@/lib/repositories/settings"

// Valida no servidor se o requisitante é um admin autenticado.
// O AdminAuthGuard (client) chama esta rota antes de liberar o painel,
// para que NÃO seja possível forjar uma sessão só mexendo no localStorage.
export async function GET(request: NextRequest) {
  if (isAuthenticatedAdmin(request)) {
    return NextResponse.json({ authenticated: true })
  }
  return NextResponse.json({ authenticated: false }, { status: 401 })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email e senha sao obrigatorios" },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).toLowerCase()
    const admin = await findAdminByEmail(normalizedEmail)
    const isValid = !!admin && verifyPassword(password, admin.password)

    if (isValid) {
      const token = createAdminToken()

      const response = NextResponse.json({
        success: true,
        token,
        message: "Login realizado com sucesso",
      })

      response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
      })

      return response
    }

    return NextResponse.json(
      { success: false, message: "Email ou senha incorretos" },
      { status: 401 }
    )
  } catch (error) {
    console.error("[Admin Auth] Error:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  revokeAdminToken(token)

  const response = NextResponse.json({
    success: true,
    message: "Logout realizado com sucesso",
  })

  response.cookies.delete("admin_token")

  return response
}
