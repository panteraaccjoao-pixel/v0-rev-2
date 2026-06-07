import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { sanitizeInput, isValidEmail, rateLimitResponse } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting para cadastro
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(clientIP, "login")
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const { name, email, password } = await request.json()

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 })
    }

    const sanitizedName = sanitizeInput(name).trim()
    const sanitizedEmail = sanitizeInput(email).toLowerCase().trim()

    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Cria o usuário já confirmado (sem envio de email)
    const { data, error } = await admin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: sanitizedName },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 })
      }
      console.error("[Register] Erro ao criar usuário:", error.message)
      return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        name: sanitizedName,
        email: sanitizedEmail,
      },
    })
  } catch (err) {
    console.error("[Register] Erro interno:", err)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
