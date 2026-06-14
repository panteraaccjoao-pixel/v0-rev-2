import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

// Retorna as últimas 20 compras de todos os usuários com dados mascarados.
// Endpoint público — não expõe dados sensíveis.
export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const rl = checkRateLimit(ip, "recent_sales")
  if (!rl.allowed) return NextResponse.json({ sales: [] }, { status: 429 })
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("orders")
      .select("id, user_name, product, level, brand, total, date, status")
      .eq("status", "entregue")
      .order("date", { ascending: false })
      .limit(20)

    if (error) throw error

    const sales = (data || []).map((row: any) => {
      const name: string = row.user_name || "Cliente"
      // Mascara: primeira letra + asteriscos aleatórios baseados no nome
      const stars = Math.max(6, Math.min(18, name.length + 4))
      const masked = name.charAt(0) + "*".repeat(stars)

      return {
        id: row.id,
        user: masked,
        product: row.product || `Cartão ${row.level || "Standard"}`,
        value: Number(row.total || 0),
        date: row.date,
      }
    })

    return NextResponse.json({ sales })
  } catch (err) {
    console.error("[recent-sales]", err)
    return NextResponse.json({ sales: [] })
  }
}
