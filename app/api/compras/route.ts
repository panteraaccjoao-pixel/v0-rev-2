import { NextResponse } from "next/server"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"

export async function GET(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  try {
    const supabase = getSupabaseAdmin()

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, user_id, user_name, product, level, brand, total, date, status, card_data")
      .order("date", { ascending: false })
      .limit(200)

    if (error) throw error

    // Busca emails dos usuários
    const userIds = [...new Set((orders || []).map((o: any) => o.user_id).filter(Boolean))]
    let emailMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds)
      for (const p of profiles || []) {
        emailMap[p.id] = p.email
      }
    }

    const compras = (orders || []).map((o: any) => ({
      id: o.id,
      userId: o.user_id,
      userName: o.user_name || "Cliente",
      userEmail: emailMap[o.user_id] || "—",
      productName: o.product || `${o.level} ${o.brand}`,
      bin: o.card_data?.bin || "—",
      value: Number(o.total || 0),
      status: o.status || "entregue",
      createdAt: o.date,
    }))

    const entregues = compras.filter((c) => c.status === "entregue")
    const pendentes = compras.filter((c) => c.status === "pendente")
    const cancelados = compras.filter((c) => c.status === "cancelado")
    const totalVendas = entregues.reduce((acc, c) => acc + c.value, 0)

    return NextResponse.json({
      compras,
      stats: {
        total: compras.length,
        entregues: entregues.length,
        pendentes: pendentes.length,
        cancelados: cancelados.length,
        totalVendas,
      },
    })
  } catch (err) {
    console.error("[compras GET]", err)
    return NextResponse.json({ compras: [], stats: { total: 0, entregues: 0, pendentes: 0, cancelados: 0, totalVendas: 0 } })
  }
}
