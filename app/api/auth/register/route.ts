import { NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/repositories/users"
import { sanitizeInput } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Preencha todos os campos" },
        { status: 400 }
      )
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { success: false, message: "A senha deve ter no minimo 6 caracteres" },
        { status: 400 }
      )
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase()
    const sanitizedName = sanitizeInput(name)

    if (await getUserByEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, message: "Este email já está cadastrado" },
        { status: 409 }
      )
    }

    const profile = await createUser({
      name: sanitizedName,
      email: sanitizedEmail,
      password,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
      },
    })
  } catch (error) {
    console.error("[Register] Error:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
