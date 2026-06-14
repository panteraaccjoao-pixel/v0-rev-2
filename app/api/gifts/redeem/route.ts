import { NextResponse } from "next/server"
import { requireUser, unauthorizedResponse } from "@/lib/user-auth"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"

export async function POST(request: Request) {
  try {
    const session = requireUser(request)
    if (!session) return unauthorizedResponse()

    const { code } = await request.json()
    if (!code) {
      return NextResponse.json({ success: false, message: "Código é obrigatório" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Busca o gift pelo código (case-insensitive)
    const { data: gift, error: findError } = await supabase
      .from("gifts")
      .select("id, code, amount, used, used_by")
      .ilike("code", code.trim())
      .single()

    if (findError || !gift) {
      return NextResponse.json({ success: false, message: "Gift não encontrado" }, { status: 404 })
    }

    if (gift.used) {
      return NextResponse.json({ success: false, message: "Este gift já foi resgatado" }, { status: 409 })
    }

    // Busca o perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, balance, email")
      .eq("email", session.email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado" }, { status: 404 })
    }

    const amount = Number(gift.amount)

    // Tenta marcar o gift como usado atomicamente (só funciona se ainda não foi usado)
    const { data: claimedGift, error: claimError } = await supabase
      .from("gifts")
      .update({ used: true, used_by: profile.email, used_at: new Date().toISOString() })
      .eq("id", gift.id)
      .eq("used", false)
      .select("id")

    if (claimError || !claimedGift || claimedGift.length === 0) {
      return NextResponse.json({ success: false, message: "Este gift já foi resgatado" }, { status: 409 })
    }

    // Credita o saldo com incremento relativo no banco — evita race condition de double-spend
    // Usando rpc para executar: UPDATE profiles SET balance = balance + amount WHERE id = profile.id
    const { data: updatedProfile, error: balanceError } = await supabase
      .rpc("increment_balance", { user_id: profile.id, amount })

    if (balanceError || !updatedProfile) {
      // Reverte o gift para disponível se o crédito falhar
      await supabase.from("gifts").update({ used: false, used_by: null, used_at: null }).eq("id", gift.id)
      return NextResponse.json({ success: false, message: "Erro ao creditar saldo" }, { status: 500 })
    }

    return NextResponse.json({ success: true, value: amount, balance: Number(updatedProfile) })
  } catch (error) {
    console.error("[gifts redeem]", error)
    return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}
