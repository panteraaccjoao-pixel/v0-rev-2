import { NextRequest, NextResponse } from "next/server"
import { changeAdminPassword } from "@/lib/repositories/settings"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    // Apenas admins logados (token válido) podem trocar a senha
    if (!isAuthenticatedAdmin(request)) {
      return NextResponse.json(
        { success: false, message: "Nao autorizado" },
        { status: 401 }
      )
    }

    const { email, currentPassword, newPassword } = await request.json()

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Preencha todos os campos" },
        { status: 400 }
      )
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { success: false, message: "A nova senha deve ter no minimo 6 caracteres" },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).toLowerCase()
    const changed = await changeAdminPassword(normalizedEmail, currentPassword, newPassword)

    if (changed) {
      return NextResponse.json({
        success: true,
        message: "Senha alterada com sucesso",
      })
    }

    return NextResponse.json(
      { success: false, message: "Email ou senha atual incorretos" },
      { status: 401 }
    )
  } catch (error) {
    console.error("[Admin Password] Error:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
