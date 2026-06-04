import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// In-memory store for drops (in production, use a database)
// This is shared across all requests
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

export async function GET() {
  try {
    const store = getStore()
    
    // Simulate users online (random between 1-5 for demo)
    // In production, you'd track actual connected users
    store.usersOnline = Math.max(1, Math.floor(Math.random() * 5) + 1)
    
    return NextResponse.json({
      drops: store.drops.filter(d => d.quantidade > 0),
      usersOnline: store.usersOnline,
    })
  } catch (error) {
    console.error("Error fetching drops:", error)
    return NextResponse.json({ error: "Failed to fetch drops" }, { status: 500 })
  }
}

// Admin endpoint to create a new drop
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { produto, nivel, bandeira, preco, quantidade } = body

    if (!produto || !preco || !quantidade) {
      return NextResponse.json(
        { error: "Campos obrigatórios: produto, preco, quantidade" },
        { status: 400 }
      )
    }

    const store = getStore()
    
    const newDrop = {
      id: `drop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      produto,
      nivel: nivel || "Standard",
      bandeira: bandeira || "Visa",
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade),
      criadoEm: new Date().toISOString(),
    }

    store.drops.unshift(newDrop) // Add to beginning
    store.lastUpdate = Date.now()

    return NextResponse.json({ success: true, drop: newDrop })
  } catch (error) {
    console.error("Error creating drop:", error)
    return NextResponse.json({ error: "Failed to create drop" }, { status: 500 })
  }
}

// Delete a drop
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dropId = searchParams.get("id")

    if (!dropId) {
      return NextResponse.json({ error: "ID do drop é obrigatório" }, { status: 400 })
    }

    const store = getStore()
    store.drops = store.drops.filter(d => d.id !== dropId)
    store.lastUpdate = Date.now()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting drop:", error)
    return NextResponse.json({ error: "Failed to delete drop" }, { status: 500 })
  }
}
