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
// O painel admin pode listar de um usuário específico, MAS apenas quando passa
// userId/email explicitamente na query. Sem esse filtro, NUNCA devolvemos todos
// os pedidos do sistema — isso vazaria os pedidos de um cliente para outro.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryUserId = searchParams.get("userId")
    const queryEmail = searchParams.get("email")
    const hasExplicitFilter = !!(queryUserId || queryEmail)

    // Branch admin: SOMENTE quando o admin pede um usuário específico via query.
    // O painel (/gestaorevsystem/usuarios) sempre envia userId/email.
    if (hasExplicitFilter && isAuthenticatedAdmin(request)) {
      const filteredOrders = await listOrders({ userId: queryUserId, email: queryEmail })
      return NextResponse.json({ orders: filteredOrders, total: filteredOrders.length })
    }

    // Caso geral (incluindo a aba pessoal "Meus Pedidos", mesmo se quem acessa
    // também for admin): escopa SEMPRE ao usuário da sessão. Ignora qualquer
    // userId/email vindos da query — a identidade vem só do token assinado.
    const session = requireUser(request)
    if (!session) {
      return unauthorizedResponse()
    }

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
