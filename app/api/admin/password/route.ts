import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    // Apenas admins logados podem trocar a senha
    const adminToken = request.cookies.get("admin_token")?.value
    if (!adminToken) {
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

    const admin = createAdminClient()
    const { data: success, error } = await admin.rpc("change_admin_password", {
      p_email: String(email).toLowerCase(),
      p_current_password: currentPassword,
      p_new_password: newPassword,
    })

    if (error) {
      console.error("[Admin Password] RPC error:", error)
      return NextResponse.json(
        { success: false, message: "Erro interno do servidor" },
        { status: 500 }
      )
    }

    if (success === true) {
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
