import { NextRequest, NextResponse } from "next/server"
import { createPix } from "@/lib/pix-gateway"
import { requireUser, unauthorizedResponse } from "@/lib/user-auth"

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request)
    if (!session) return unauthorizedResponse()

    const { amount } = await request.json()

    if (!amount || amount < 15) {
      return NextResponse.json({ error: "Valor minimo e R$ 15,00" }, { status: 400 })
    }

    // Identidade vem da sessão.
    const result = await createPix({ amount, userId: session.uid, userEmail: session.email })
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error generating PIX:", error)
    return NextResponse.json(
      { error: "Erro ao gerar PIX. Tente novamente." },
      { status: 500 }
    )
  }
}
