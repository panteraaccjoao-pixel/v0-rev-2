import { NextResponse } from "next/server"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"

export async function GET(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  try {
    const supabase = getSupabaseAdmin()

    const [ordersRes, pixRes, usersRes, stockRes] = await Promise.all([
      // Pedidos entregues
      supabase
        .from("orders")
        .select("id, user_name, product, level, brand, total, date, status")
        .eq("status", "entregue")
        .order("date", { ascending: false }),

      // Recargas pagas e creditadas
      supabase
        .from("pix_payments")
        .select("id, amount, status, credited, created_at, purpose")
        .eq("purpose", "recharge")
        .eq("status", "paid")
        .eq("credited", true),

      // Contagem de usuários
      supabase.from("profiles").select("id", { count: "exact", head: true }),

      // Estoque
      supabase.from("stock").select("id", { count: "exact", head: true }),
    ])

    const orders = ordersRes.data || []
    const recharges = pixRes.data || []

    // Faturamento = total de recargas recebidas
    const faturamento = recharges.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)

    // Vendas
    const vendas = orders.length
    const ticketMedio = vendas > 0
      ? orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0) / vendas
      : 0

    // Recargas pendentes
    const { count: pendingCount } = await supabase
      .from("pix_payments")
      .select("id", { count: "exact", head: true })
      .eq("purpose", "recharge")
      .eq("status", "pending")

    // Faturamento por dia (últimos 30 dias, baseado em pedidos)
    const dailyMap: Record<string, { faturamento: number; vendas: number }> = {}
    for (const order of orders) {
      const day = (order.date as string).split("T")[0]
      if (!dailyMap[day]) dailyMap[day] = { faturamento: 0, vendas: 0 }
      dailyMap[day].faturamento += Number(order.total || 0)
      dailyMap[day].vendas += 1
    }
    const dailyData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, d]) => ({ date, ...d }))

    // Vendas recentes (últimas 10)
    const recentSales = orders.slice(0, 10).map((o: any) => ({
      id: o.id,
      user: o.user_name || "Cliente",
      product: `${o.level} ${o.brand}`,
      value: Number(o.total || 0),
      date: o.date,
    }))

    return NextResponse.json({
      faturamento,
      saques: 0,
      vendas,
      ticketMedio,
      usuariosCadastrados: usersRes.count || 0,
      recargasPendentes: pendingCount || 0,
      estoqueTotal: stockRes.count || 0,
      dailyData,
      recentSales,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[stats GET]", error)
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
  }
}

// POST mantido para compatibilidade (webhook sync_from_webhook não é mais necessário,
// mas alguns endpoints ainda chamam add_sale para registro imediato)
export async function POST(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
  return NextResponse.json({ success: true })
}
