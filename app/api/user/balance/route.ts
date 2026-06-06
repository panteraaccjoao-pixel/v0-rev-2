import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Helpers de saldo baseados no Supabase (server-side, usam service role)
export async function getUserBalance(email: string): Promise<number> {
  const admin = createAdminClient()
  const { data } = await admin.from("profiles").select("balance").eq("email", email).maybeSingle()
  return Number(data?.balance ?? 0)
}

export async function setUserBalance(email: string, balance: number): Promise<void> {
  const admin = createAdminClient()
  await admin.from("profiles").update({ balance }).eq("email", email)
}

export async function deductBalance(email: string, amount: number): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin.from("profiles").select("balance").eq("email", email).maybeSingle()
  const current = Number(data?.balance ?? 0)
  if (current < amount) return false
  await admin.from("profiles").update({ balance: current - amount }).eq("email", email)
  return true
}

export async function addBalance(email: string, amount: number): Promise<void> {
  const admin = createAdminClient()
  const { data } = await admin.from("profiles").select("balance").eq("email", email).maybeSingle()
  const current = Number(data?.balance ?? 0)
  await admin.from("profiles").update({ balance: current + amount }).eq("email", email)
}

// GET - retorna o saldo do usuário autenticado
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data } = await supabase.from("profiles").select("balance").eq("id", user.id).maybeSingle()

    return NextResponse.json({
      balance: Number(data?.balance ?? 0),
      email: user.email,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar saldo" }, { status: 500 })
  }
}

// POST - atualiza o saldo (operações: add, deduct, set)
export async function POST(request: NextRequest) {
  try {
    const { email, amount, operation } = await request.json()

    if (!email || amount === undefined) {
      return NextResponse.json({ error: "Email e valor são obrigatórios" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("id, balance")
      .eq("email", email)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const current = Number(profile.balance ?? 0)
    let newBalance = current

    if (operation === "add") {
      newBalance = current + amount
    } else if (operation === "deduct") {
      if (current < amount) {
        return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })
      }
      newBalance = current - amount
    } else if (operation === "set") {
      newBalance = amount
    }

    await admin.from("profiles").update({ balance: newBalance }).eq("id", profile.id)

    return NextResponse.json({ success: true, balance: newBalance, email })
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar saldo" }, { status: 500 })
  }
}
