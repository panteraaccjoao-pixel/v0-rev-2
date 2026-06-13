import { NextRequest, NextResponse } from "next/server"
import { createOrder, listOrders, updateOrderStatus } from "@/lib/repositories/orders"
import type { Order } from "@/lib/repositories/types"
import { requireUser, unauthorizedResponse } from "@/lib/user-auth"
import { isAuthenticatedAdmin, isInternalRequest } from "@/lib/admin-auth"

export type { Order } from "@/lib/repositories/types"

// Cria um pedido diretamente (uso interno, server-to-server).
// Mantido por compat — delega ao repositório de pedidos.
export async function createOrderRecord(data: {
  userId: string
  userName?: string
  product: string
  level?: string
  brand?: string
  total?: number
  cardData?: Order["cardData"]
}): Promise<Order> {
  return createOrder(data)
}

// GET - lista os pedidos do PRÓPRIO usuário autenticado.
// Admin autenticado pode listar de qualquer usuário (via query).
export async function GET(request: NextRequest) {
  try {
    const isAdmin = isAuthenticatedAdmin(request)

    if (isAdmin) {
      const { searchParams } = new URL(request.url)
      const userId = searchParams.get("userId")
      const userEmail = searchParams.get("email")
      const filteredOrders = await listOrders({ userId, email: userEmail })
      return NextResponse.json({ orders: filteredOrders, total: filteredOrders.length })
    }

    const session = requireUser(request)
    if (!session) {
      return unauthorizedResponse()
    }

    // Sempre escopado ao usuário da sessão — ignora qualquer email/userId da query.
    const filteredOrders = await listOrders({ userId: session.uid, email: session.email })

    return NextResponse.json({
      orders: filteredOrders,
      total: filteredOrders.length,
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// POST - cria um novo pedido. Apenas chamadas internas (server-to-server, ex:
// fulfillment) ou admin. O frontend NÃO cria pedidos diretamente — isso passa
// pelo /api/checkout, que valida saldo e estoque.
export async function POST(request: NextRequest) {
  if (!isInternalRequest(request) && !isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const body = await request.json()
    const { userId, userName, product, level, brand, total, cardData } = body

    if (!userId || !product) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newOrder = await createOrder({
      userId,
      userName,
      product,
      level,
      brand,
      total,
      cardData,
    })

    return NextResponse.json({ success: true, order: newOrder })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

// PATCH - atualiza o status de um pedido. Restrito a admin/interno.
export async function PATCH(request: NextRequest) {
  if (!isInternalRequest(request) && !isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const body = await request.json()
    const { id, status } = body

    const updated = await updateOrderStatus(id, status)
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, order: updated })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
