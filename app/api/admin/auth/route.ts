import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email e senha sao obrigatorios" },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data: isValid, error } = await admin.rpc("verify_admin", {
      p_email: String(email).toLowerCase(),
      p_password: password,
    })

    if (error) {
      console.error("[Admin Auth] RPC error:", error)
      return NextResponse.json(
        { success: false, message: "Erro interno do servidor" },
        { status: 500 }
      )
    }

    if (isValid === true) {
      const token = crypto.randomBytes(32).toString("hex")

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

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Logout realizado com sucesso",
  })

  response.cookies.delete("admin_token")

  return response
}
