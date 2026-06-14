import { NextResponse } from "next/server"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"

function rowToDrop(d: any, admin = false) {
  return {
    id: d.id,
    produto: d.produto,
    nivel: d.nivel,
    bandeira: d.bandeira,
    preco: Number(d.preco),
    quantidade: d.quantidade,
    criadoEm: d.criado_em,
    // dados do cartão — todos protegidos, só visíveis para admin autenticado
    numero: admin ? (d.numero ?? null) : null,
    titular: admin ? (d.titular ?? null) : null,
    validade: admin ? (d.validade ?? null) : null,
    cvv: admin ? (d.cvv ?? null) : null,
    cpf: admin ? (d.cpf ?? null) : null,
    banco: admin ? (d.banco ?? null) : null,
    limite: admin ? (d.limite ? Number(d.limite) : null) : null,
  }
}

export async function GET(request: Request) {
  const isAdmin = isAuthenticatedAdmin(request)
  const { searchParams } = new URL(request.url)
  const adminParam = searchParams.get("admin") === "1"

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("drops")
      .select("*")
      .gt("quantidade", 0)
      .order("criado_em", { ascending: false })

    if (error) throw error

    const drops = (data || []).map((d) => rowToDrop(d, isAdmin && adminParam))

    return NextResponse.json({ drops, usersOnline: Math.floor(Math.random() * 5) + 1 })
  } catch (error) {
    console.error("[drops GET]", error)
    return NextResponse.json({ drops: [], usersOnline: 1 })
  }
}

export async function POST(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { produto, nivel, bandeira, preco, quantidade, numero, titular, validade, cvv, cpf, banco, limite } = body

    if (!produto || !preco) {
      return NextResponse.json({ error: "Campos obrigatórios: produto, preco" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const row = {
      id: `drop_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      produto,
      nivel: nivel || "Gold",
      bandeira: bandeira || "Visa",
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade || "1"),
      numero: numero || null,
      titular: titular || null,
      validade: validade || null,
      cvv: cvv || null,
      cpf: cpf || null,
      banco: banco || null,
      limite: limite ? parseFloat(limite) : null,
      criado_em: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("drops").insert(row).select().single()
    if (error) throw error

    return NextResponse.json({ success: true, drop: data })
  } catch (error) {
    console.error("[drops POST]", error)
    return NextResponse.json({ error: "Erro ao criar drop" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("drops").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[drops DELETE]", error)
    return NextResponse.json({ error: "Erro ao excluir drop" }, { status: 500 })
  }
}
