import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"
import { normalizeEmail } from "@/lib/security"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 tentativas por 10 min por IP — bloqueia brute-force do código de 6 dígitos
    const ip = getClientIP(request)
    const rl = checkRateLimit(ip, "verify_code")
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, message: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      )
    }

    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ success: false, message: "Dados inválidos" }, { status: 400 })
    }

    const sanitizedEmail = normalizeEmail(email)
    const sanitizedCode = String(code).trim().slice(0, 6)

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("email_verifications")
      .select("id, code, expires_at, used")
      .eq("email", sanitizedEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Nenhum código encontrado. Solicite um novo." },
        { status: 400 }
      )
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: "Código expirado. Solicite um novo." },
        { status: 400 }
      )
    }

    // Comparação em tempo constante para evitar timing attacks
    const codeMatch = (() => {
      try {
        const a = Buffer.from(data.code)
        const b = Buffer.from(sanitizedCode)
        return a.length === b.length && timingSafeEqual(a, b)
      } catch {
        return false
      }
    })()
    if (!codeMatch) {
      return NextResponse.json(
        { success: false, message: "Código incorreto. Tente novamente." },
        { status: 400 }
      )
    }

    // Marca como usado
    await supabase.from("email_verifications").update({ used: true }).eq("id", data.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[verify-code]", err)
    return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 })
  }
}
