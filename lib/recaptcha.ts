// Verificação do Google reCAPTCHA v2 — roda SOMENTE no servidor.
// A secret key nunca é exposta ao cliente.

interface RecaptchaVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  "error-codes"?: string[]
}

/**
 * Valida o token do reCAPTCHA v2 contra a API do Google.
 * Retorna true se o desafio foi resolvido com sucesso.
 *
 * Se RECAPTCHA_SECRET_KEY não estiver configurada, a verificação é
 * ignorada (retorna true) para não quebrar ambientes sem captcha.
 */
export async function verifyRecaptcha(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY

  // Sem secret configurada, não bloqueia (ex.: ambiente local sem captcha).
  if (!secret) {
    console.warn("[recaptcha] RECAPTCHA_SECRET_KEY não configurada — verificação ignorada")
    return true
  }

  if (!token) {
    return false
  }

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
    })

    const data = (await res.json()) as RecaptchaVerifyResponse

    if (!data.success) {
      console.warn("[recaptcha] verificação falhou:", data["error-codes"])
    }

    return data.success === true
  } catch (error) {
    console.error("[recaptcha] erro ao verificar token:", error)
    return false
  }
}
