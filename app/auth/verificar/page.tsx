"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { createClient } from "@/lib/supabase/client"

function VerifyForm() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") || ""

  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (emailParam) setEmail(emailParam)
  }, [emailParam])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleVerify = async (token: string) => {
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: "email",
      })

      if (verifyError) {
        setError("Código inválido ou expirado. Verifique e tente novamente.")
        setCode("")
        return
      }

      const name = (data.user?.user_metadata?.name as string) || data.user?.email || "Usuário"
      localStorage.setItem(
        "user_session",
        JSON.stringify({
          success: true,
          userId: data.user?.id,
          name,
          email: data.user?.email,
        })
      )
      window.location.href = "/dashboard"
    } catch {
      setError("Erro ao verificar o código. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || !email) return
    setResending(true)
    setResendMessage("")
    setError("")

    try {
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      })

      if (resendError) {
        setError("Não foi possível reenviar o código. Tente novamente em instantes.")
        return
      }

      setResendMessage("Enviamos um novo código para o seu email.")
      setCooldown(60)
    } catch {
      setError("Não foi possível reenviar o código. Tente novamente em instantes.")
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length === 6) handleVerify(code)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="p-4">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <MailCheck className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Confirme seu email</h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              {email
                ? `Enviamos um código de 6 dígitos para ${email}. Digite-o abaixo para ativar sua conta.`
                : "Digite o email usado no cadastro e o código de 6 dígitos que enviamos."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}
            {resendMessage && (
              <div className="rounded-lg border border-accent/50 bg-accent/10 px-4 py-3 text-sm text-accent">
                {resendMessage}
              </div>
            )}

            {!emailParam && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-md border border-border bg-secondary px-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            )}

            <div className="flex flex-col items-center gap-3">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => {
                  setCode(value)
                  if (value.length === 6 && email) handleVerify(value)
                }}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button type="submit" className="h-12 w-full" disabled={loading || code.length !== 6 || !email}>
              {loading ? "Verificando..." : "Confirmar conta"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Não recebeu o código?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email}
              className="text-foreground underline underline-offset-2 hover:text-accent disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
            >
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : resending ? "Reenviando..." : "Reenviar código"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  )
}
