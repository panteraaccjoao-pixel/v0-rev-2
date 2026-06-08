import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateUser } from "@/lib/repositories/users"

// GET - retorna os dados do perfil (email via query param)
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")?.toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 })
    }

    const profile = await getUserByEmail(email)

    if (!profile) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 })
  }
}

// PATCH - atualiza nome e/ou email do usuário
export async function PATCH(request: NextRequest) {
  try {
    const { currentEmail, name, email } = await request.json()

    if (!currentEmail) {
      return NextResponse.json({ error: "Email atual obrigatório" }, { status: 400 })
    }

    const profile = await getUserByEmail(String(currentEmail).toLowerCase())

    if (!profile) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const patch: { name?: string; email?: string } = {}

    // Atualiza o nome
    if (typeof name === "string" && name.trim()) {
      patch.name = name.trim()
    }

    // Atualiza o email (valida formato e duplicidade)
    if (typeof email === "string" && email.trim()) {
      const newEmail = email.trim().toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(newEmail)) {
        return NextResponse.json({ error: "Email inválido" }, { status: 400 })
      }

      if (newEmail !== profile.email) {
        const existing = await getUserByEmail(newEmail)
        if (existing) {
          return NextResponse.json({ error: "Este email já está em uso" }, { status: 409 })
        }
        patch.email = newEmail
      }
    }

    const updated = (await updateUser(profile.id, patch)) || profile

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
      },
    })
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
  }
}
