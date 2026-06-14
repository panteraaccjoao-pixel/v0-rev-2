import { NextResponse } from "next/server"
import { requireUser, unauthorizedResponse } from "@/lib/user-auth"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"

export async function POST(request: Request) {
  try {
    const session = requireUser(request)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const { dropId } = body

    if (!dropId) {
      return NextResponse.json({ error: "ID do drop é obrigatório" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: drop, error: findError } = await supabase
      .from("drops")
      .select("*")
      .eq("id", dropId)
      .single()

    if (findError || !drop) {
      return NextResponse.json({ error: "Drop não encontrado" }, { status: 404 })
    }

    if (drop.quantidade <= 0) {
      return NextResponse.json({ error: "Drop esgotado" }, { status: 400 })
    }

    // Decremento relativo atômico via RPC — evita race condition com valor pré-computado
    const { data: updated, error: updateError } = await supabase
      .rpc("decrement_drop_quantity", { drop_id: dropId })

    if (updateError || !updated || updated.length === 0) {
      return NextResponse.json({ error: "Drop esgotado" }, { status: 400 })
    }

    if (updated[0].quantidade === 0) {
      await supabase.from("drops").delete().eq("id", dropId)
    }

    return NextResponse.json({
      success: true,
      message: "Compra realizada com sucesso!",
      card: {
        produto: drop.produto,
        nivel: drop.nivel,
        bandeira: drop.bandeira,
        preco: drop.preco,
        numero: drop.numero,
        titular: drop.titular,
        validade: drop.validade,
        cvv: drop.cvv,
        cpf: drop.cpf,
        banco: drop.banco,
        limite: drop.limite,
      },
    })
  } catch (error) {
    console.error("[drops/buy]", error)
    return NextResponse.json({ error: "Erro ao processar compra" }, { status: 500 })
  }
}
