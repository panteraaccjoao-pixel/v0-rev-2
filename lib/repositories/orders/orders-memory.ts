// Implementação em memória do repositório de pedidos.
import state from "../memory-state"
import type { Order, CreateOrderInput, ListOrdersFilter } from "../types"

export async function createOrder(data: CreateOrderInput): Promise<Order> {
  const order: Order = {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    oderId: `#${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    userId: data.userId,
    userName: data.userName || "Cliente",
    product: data.product,
    level: data.level || "Standard",
    brand: data.brand || "visa",
    quantity: 1,
    total: data.total || 0,
    date: new Date().toISOString(),
    status: "entregue",
    cardData: data.cardData,
  }
  state.orders.push(order)
  return order
}

export async function listOrders(filter?: ListOrdersFilter): Promise<Order[]> {
  let result = state.orders

  if (filter && (filter.userId || filter.email)) {
    const id = filter.userId?.toLowerCase()
    const email = filter.email?.toLowerCase()
    result = state.orders.filter((o) => {
      const orderUser = o.userId?.toLowerCase()
      return (id && orderUser === id) || (email && orderUser === email)
    })
  }

  return [...result].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

export async function updateOrderStatus(
  id: string,
  status: Order["status"],
): Promise<Order | null> {
  const order = state.orders.find((o) => o.id === id)
  if (!order) return null
  order.status = status
  return order
}
