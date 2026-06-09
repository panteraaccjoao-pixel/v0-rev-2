import { NextResponse } from "next/server"
import { requireUser, unauthorizedResponse } from "@/lib/user-auth"

declare global {
  var dropsStore: {
    drops: Array<{
      id: string
      produto: string
      nivel: string
      bandeira: string
      preco: number
      quantidade: number
      criadoEm: string
    }>
    usersOnline: number
    lastUpdate: number
  } | undefined
}

function getStore() {
  if (!global.dropsStore) {
    global.dropsStore = {
      drops: [],
      usersOnline: 1,
      lastUpdate: Date.now(),
    }
  }
  return global.dropsStore
}

export async function POST(request: Request) {
  try {
    // Exige sessão válida — compra de drop é ação autenticada.
    const session = requireUser(request)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const { dropId } = body

    if (!dropId) {
      return NextResponse.json(
        { error: "ID do drop é obrigatório" },
        { status: 400 }
      )
    }

    const store = getStore()
    const drop = store.drops.find(d => d.id === dropId)

    if (!drop) {
      return NextResponse.json(
        { error: "Drop não encontrado" },
        { status: 404 }
      )
    }

    if (drop.quantidade <= 0) {
      return NextResponse.json(
        { error: "Drop esgotado" },
        { status: 400 }
      )
    }

    // Decrease quantity
    drop.quantidade -= 1
    
    // Remove if out of stock
    if (drop.quantidade <= 0) {
      store.drops = store.drops.filter(d => d.id !== dropId)
    }

    store.lastUpdate = Date.now()

    return NextResponse.json({ 
      success: true, 
      message: "Compra realizada com sucesso!",
      drop: {
        produto: drop.produto,
        nivel: drop.nivel,
        bandeira: drop.bandeira,
        preco: drop.preco,
      }
    })
  } catch (error) {
    console.error("Error buying drop:", error)
    return NextResponse.json({ error: "Failed to buy drop" }, { status: 500 })
  }
}
