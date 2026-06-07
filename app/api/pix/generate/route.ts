import { NextRequest, NextResponse } from "next/server"
import { createPix } from "@/lib/pix-gateway"

export async function POST(request: NextRequest) {
  try {
    const { amount, userId, userEmail } = await request.json()

    if (!amount || amount < 15) {
      return NextResponse.json({ error: "Valor minimo e R$ 15,00" }, { status: 400 })
    }

    const result = await createPix({ amount, userId, userEmail })
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error generating PIX:", error)
    return NextResponse.json(
      { error: "Erro ao gerar PIX. Tente novamente." },
      { status: 500 }
    )
  }
}
