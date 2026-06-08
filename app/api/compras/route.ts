import { NextResponse } from "next/server"
import { isAuthenticatedAdmin, isInternalRequest, unauthorizedResponse } from "@/lib/admin-auth"

interface Compra {
  id: string
  userId: string
  userName: string
  userEmail: string
  productId: string
  productName: string
  bin: string
  value: number
  status: "entregue" | "pendente" | "cancelado"
  createdAt: string
}

// In-memory storage for compras
const compras: Compra[] = []

export async function GET(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
  const entregues = compras.filter(c => c.status === "entregue")
  const pendentes = compras.filter(c => c.status === "pendente")
  const cancelados = compras.filter(c => c.status === "cancelado")
  
  const totalVendas = entregues.reduce((acc, c) => acc + c.value, 0)

  return NextResponse.json({
    compras: compras.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    stats: {
      total: compras.length,
      entregues: entregues.length,
      pendentes: pendentes.length,
      cancelados: cancelados.length,
      totalVendas
    }
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, compraId, ...data } = body

    if (action === "create") {
      const newCompra: Compra = {
        id: `compra_${Date.now()}`,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        productId: data.productId,
        productName: data.productName,
        bin: data.bin,
        value: data.value,
        status: "entregue",
        createdAt: new Date().toISOString()
      }
      compras.push(newCompra)
      return NextResponse.json({ success: true, compra: newCompra })
    }

    if (action === "update_status" && compraId) {
      const compra = compras.find(c => c.id === compraId)
      if (compra) {
        compra.status = data.status
        return NextResponse.json({ success: true, compra })
      }
      return NextResponse.json({ error: "Compra not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing compra:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  const index = compras.findIndex(c => c.id === id)
  if (index === -1) {
    return NextResponse.json({ error: "Compra not found" }, { status: 404 })
  }

  compras.splice(index, 1)
  return NextResponse.json({ success: true })
}
