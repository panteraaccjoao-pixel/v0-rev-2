import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"
import { sendVerificationEmail } from "@/lib/email"
import { normalizeEmail } from "@/lib/security"
import { verifyRecaptcha } from "@/lib/recaptcha"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const rl = checkRateLimit(ip, "send_verification")
    if (!rl.allowed) return NextResponse.json(
      { success: false, message: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    )

    const { email, captchaToken } = await request.json()

    const captchaOk = await verifyRecaptcha(captchaToken)
    if (!captchaOk) {
      console.error("[send-verification] captcha falhou para IP:", ip)
      return NextResponse.json(
        { success: false, message: "Falha na verificação do captcha." },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json({ success: false, message: "Email obrigatório" }, { status: 400 })
    }

    const sanitizedEmail = normalizeEmail(email)

    // Gera código de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const supabase = getSupabaseAdmin()

    // Remove verificações anteriores do mesmo email
    await supabase.from("email_verifications").delete().eq("email", sanitizedEmail)

    // Insere novo código
    const { error } = await supabase.from("email_verifications").insert({
      email: sanitizedEmail,
      code,
      expires_at: expiresAt,
    })
    if (error) throw new Error(error.message)

    await sendVerificationEmail(sanitizedEmail, code)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[send-verification]", err)
    return NextResponse.json(
      { success: false, message: "Erro ao enviar email. Tente novamente." },
      { status: 500 }
    )
  }
}
