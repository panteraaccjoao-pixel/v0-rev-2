// Implementação Supabase do repositório de pedidos.
// Mantém as mesmas assinaturas do orders-memory.ts.
import { getSupabaseAdmin } from "../supabase-client"
import type { Order, CreateOrderInput, ListOrdersFilter } from "../types"

const TABLE = "orders"

function rowToOrder(row: any): Order {
  return {
    id: row.id,
    oderId: row.oder_id ?? "",
    userId: row.user_id,
    userName: row.user_name ?? "Cliente",
    product: row.product,
    level: row.level ?? "Standard",
    brand: row.brand ?? "visa",
    quantity: Number(row.quantity ?? 1),
    total: Number(row.total ?? 0),
    date: row.date,
    status: (row.status ?? "entregue") as Order["status"],
    cardData: row.card_data ?? undefined,
  }
}

export async function createOrder(data: CreateOrderInput): Promise<Order> {
  const supabase = getSupabaseAdmin()
  const row = {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    oder_id: `#${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    user_id: data.userId,
    user_name: data.userName || "Cliente",
    product: data.product,
    level: data.level || "Standard",
    brand: data.brand || "visa",
    quantity: 1,
    total: data.total || 0,
    date: new Date().toISOString(),
    status: "entregue",
    card_data: data.cardData ?? null,
  }
  const { data: inserted, error } = await supabase.from(TABLE).insert(row).select("*").single()
  if (error) throw new Error(`createOrder: ${error.message}`)
  return rowToOrder(inserted)
}

export async function listOrders(filter?: ListOrdersFilter): Promise<Order[]> {
  const supabase = getSupabaseAdmin()
  let query = supabase.from(TABLE).select("*").order("date", { ascending: false })

  if (filter && (filter.userId || filter.email)) {
    // user_id pode guardar o id do perfil OU o email; casa qualquer um dos dois.
    const candidates = [filter.userId, filter.email]
      .filter(Boolean)
      .map((v) => (v as string).toLowerCase())
    // Usa OR com lista de valores (case-insensitive via valores já normalizados
    // não é garantido no banco; portanto comparamos contra os valores crus também).
    const raw = [filter.userId, filter.email].filter(Boolean) as string[]
    const all = Array.from(new Set([...candidates, ...raw]))
    query = query.in("user_id", all)
  }

  const { data, error } = await query
  if (error) throw new Error(`listOrders: ${error.message}`)
  return (data ?? []).map(rowToOrder)
}

export async function updateOrderStatus(id: string, status: Order["status"]): Promise<Order | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw new Error(`updateOrderStatus: ${error.message}`)
  return data ? rowToOrder(data) : null
}
