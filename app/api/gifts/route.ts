import { NextResponse } from "next/server"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"

// Armazenamento em memória dos gifts (compartilhado entre requisições).
// ATENÇÃO: volátil — reinicia quando o servidor reinicia.
declare global {
  var giftsStore:
    | {
        gifts: Array<{
          id: string
          code: string
          value: number
          status: "disponível" | "resgatado"
          createdAt: string
          usedBy: string | null
          usedAt: string | null
        }>
        lastUpdate: number
      }
    | undefined
}

function getStore() {
  if (!global.giftsStore) {
    global.giftsStore = {
      gifts: [],
      lastUpdate: Date.now(),
    }
  }
  return global.giftsStore
}

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `GIFT-${result}`
}

// Lista todos os gifts (somente admin — expõe códigos)
export async function GET(request: Request) {
  if (!isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const store = getStore()
    return NextResponse.json({
      gifts: store.gifts,
      lastUpdate: store.lastUpdate,
    })
  } catch (error) {
    console.error("Error fetching gifts:", error)
    return NextResponse.json({ error: "Failed to fetch gifts" }, { status: 500 })
  }
}

// Cria um ou mais gifts (somente admin)
export async function POST(request: Request) {
  if (!isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const body = await request.json()
    const value = Number.parseFloat(body.value)
    const quantity = Math.min(Math.max(Number.parseInt(body.quantity || "1"), 1), 100)

    if (!value || value <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }

    const store = getStore()
    const created = []

    for (let i = 0; i < quantity; i++) {
      const gift = {
        id: `gift_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        code: generateCode(),
        value,
        status: "disponível" as const,
        createdAt: new Date().toISOString(),
        usedBy: null,
        usedAt: null,
      }
      store.gifts.unshift(gift)
      created.push(gift)
    }

    store.lastUpdate = Date.now()

    return NextResponse.json({ success: true, gifts: created })
  } catch (error) {
    console.error("Error creating gift:", error)
    return NextResponse.json({ error: "Failed to create gift" }, { status: 500 })
  }
}

// Exclui um gift (somente admin)
export async function DELETE(request: Request) {
  if (!isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const { searchParams } = new URL(request.url)
    const giftId = searchParams.get("id")

    if (!giftId) {
      return NextResponse.json({ error: "ID do gift é obrigatório" }, { status: 400 })
    }

    const store = getStore()
    store.gifts = store.gifts.filter((g) => g.id !== giftId)
    store.lastUpdate = Date.now()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting gift:", error)
    return NextResponse.json({ error: "Failed to delete gift" }, { status: 500 })
  }
}
