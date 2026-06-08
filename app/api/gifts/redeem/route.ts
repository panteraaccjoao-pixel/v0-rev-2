import { NextResponse } from "next/server"
import { getUserByEmail, setBalance } from "@/lib/repositories/users"

function getStore() {
  if (!global.giftsStore) {
    global.giftsStore = {
      gifts: [],
      lastUpdate: Date.now(),
    }
  }
  return global.giftsStore
}

// Resgata um gift pelo código e credita o saldo no perfil do usuário
export async function POST(request: Request) {
  try {
    const { code, email } = await request.json()

    if (!code || !email) {
      return NextResponse.json(
        { success: false, message: "Código e email são obrigatórios" },
        { status: 400 }
      )
    }

    const store = getStore()
    const gift = store.gifts.find(
      (g) => g.code.toUpperCase() === String(code).toUpperCase().trim()
    )

    if (!gift) {
      return NextResponse.json(
        { success: false, message: "Gift não encontrado" },
        { status: 404 }
      )
    }

    if (gift.status === "resgatado") {
      return NextResponse.json(
        { success: false, message: "Este gift já foi resgatado" },
        { status: 409 }
      )
    }

    const profile = await getUserByEmail(email)
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Credita o saldo e marca o gift como resgatado
    const newBalance = Number(profile.balance ?? 0) + gift.value
    await setBalance(profile.id, newBalance)
    gift.status = "resgatado"
    gift.usedBy = profile.email
    gift.usedAt = new Date().toISOString()
    store.lastUpdate = Date.now()

    return NextResponse.json({
      success: true,
      value: gift.value,
      balance: newBalance,
    })
  } catch (error) {
    console.error("Error redeeming gift:", error)
    return NextResponse.json({ error: "Failed to redeem gift" }, { status: 500 })
  }
}
