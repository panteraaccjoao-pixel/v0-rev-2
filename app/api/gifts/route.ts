import { NextResponse } from "next/server"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `GIFT-${result}`
}

export async function GET(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("gifts")
      .select("id, code, amount, used, used_by, used_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) throw error

    const gifts = (data || []).map((g: any) => ({
      id: g.id,
      code: g.code,
      value: Number(g.amount),
      status: g.used ? "resgatado" : "disponível",
      createdAt: g.created_at,
      usedBy: g.used_by || null,
      usedAt: g.used_at || null,
    }))

    return NextResponse.json({ gifts })
  } catch (error) {
    console.error("[gifts GET]", error)
    return NextResponse.json({ gifts: [] })
  }
}

export async function POST(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const value = parseFloat(body.value)
    const quantity = Math.min(Math.max(parseInt(body.quantity || "1"), 1), 100)

    if (!value || value <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const rows = []

    for (let i = 0; i < quantity; i++) {
      rows.push({
        id: `gift_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        code: generateCode(),
        amount: value,
      })
      // Pequeno delay para garantir IDs únicos quando quantity > 1
      await new Promise((r) => setTimeout(r, 1))
    }

    const { data, error } = await supabase.from("gifts").insert(rows).select()
    if (error) throw error

    return NextResponse.json({ success: true, gifts: data })
  } catch (error) {
    console.error("[gifts POST]", error)
    return NextResponse.json({ error: "Erro ao criar gift" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("gifts").delete().eq("id", id).eq("used", false)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[gifts DELETE]", error)
    return NextResponse.json({ error: "Erro ao excluir gift" }, { status: 500 })
  }
}
