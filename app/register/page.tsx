"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveSession } from "@/lib/session"
import { Recaptcha } from "@/components/recaptcha"

type Step = "form" | "verify"

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form")

  // Step 1 — form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  // Step 2 — verification code
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const isFormValid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    password.length >= 6 &&
    password === confirmPassword &&
    captchaToken !== null

  const codeValue = code.join("")

  // ── Step 1: send verification code ────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isFormValid) return
    setLoading(true)

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), captchaToken }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        setError(result.message || "Erro ao enviar código. Tente novamente.")
        return
      }
      setStep("verify")
      startResendCooldown()
    } catch {
      setError("Erro ao enviar código. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify code then register ─────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (codeValue.length < 6) {
      setError("Digite o código de 6 dígitos.")
      return
    }
    setLoading(true)

    try {
      // Verify the code first
      const verifyRes = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: codeValue }),
      })
      const verifyResult = await verifyRes.json()
      if (!verifyRes.ok || !verifyResult.success) {
        setError(verifyResult.message || "Código inválido.")
        return
      }

      // Code OK — create account
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          captchaToken,
          emailVerified: true,
        }),
      })
      const registerResult = await registerRes.json()

      if (!registerRes.ok || !registerResult.success) {
        setError(registerResult.message || "Erro ao criar conta. Tente novamente.")
        return
      }

      saveSession({
        userId: registerResult.user?.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        token: registerResult.token,
      })
      window.location.href = "/dashboard"
    } catch {
      setError("Erro ao verificar código. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // ── Resend code ────────────────────────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) { clearInterval(interval); return 0 }
        return v - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), captchaToken }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        setError(result.message || "Erro ao reenviar código.")
        return
      }
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
      startResendCooldown()
    } catch {
      setError("Erro ao reenviar código.")
    } finally {
      setLoading(false)
    }
  }

  // ── Code input handlers ────────────────────────────────────────────────────
  const handleCodeChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next = [...code]
    next[i] = digit
    setCode(next)
    if (digit && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handleCodeKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length > 0) {
      e.preventDefault()
      const next = [...code]
      pasted.split("").forEach((d, i) => { next[i] = d })
      setCode(next)
      inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="p-4">
        {step === "verify" ? (
          <button
            onClick={() => { setStep("form"); setError(""); setCode(["","","","","",""]) }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        ) : (
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        )}
      </div>

      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-8">

          {/* ── STEP 1: Registration form ────────────────────────────────── */}
          {step === "form" && (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Criar sua conta</h1>
                <p className="mt-2 text-muted-foreground">Digite seus dados para criar uma conta na REV SYSTEM</p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-5" suppressHydrationWarning>
                {error && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name" type="text" placeholder="Digite seu nome completo"
                    value={name} onChange={(e) => setName(e.target.value)}
                    className="h-12 bg-secondary border-border" required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" type="email" placeholder="seu@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-secondary border-border" required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password" type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-secondary border-border pr-12" required
                    />
                    <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-5 w-5 pointer-events-none" /> : <Eye className="h-5 w-5 pointer-events-none" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 bg-secondary border-border pr-12" required
                    />
                    <button type="button" aria-label={showConfirmPassword ? "Ocultar" : "Mostrar"}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 pointer-events-none" /> : <Eye className="h-5 w-5 pointer-events-none" />}
                    </button>
                  </div>
                  {confirmPassword !== "" && password !== confirmPassword && (
                    <p className="text-xs text-red-500">As senhas não coincidem</p>
                  )}
                </div>

                <Recaptcha onChange={setCaptchaToken} />

                <Button type="submit" className="h-12 w-full" disabled={!isFormValid || loading}>
                  {loading ? "Enviando código..." : "Enviar código de verificação"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-foreground underline underline-offset-2 hover:text-accent">
                  Fazer login
                </Link>
              </p>
            </>
          )}

          {/* ── STEP 2: Email verification ───────────────────────────────── */}
          {step === "verify" && (
            <>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Mail className="h-8 w-8 text-foreground" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Verifique seu email</h1>
                <p className="mt-2 text-muted-foreground">
                  Enviamos um código de 6 dígitos para<br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                {error && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                    {error}
                  </div>
                )}

                {/* 6-digit code inputs */}
                <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="h-14 w-12 rounded-lg border border-border bg-secondary text-center text-2xl font-bold text-foreground outline-none transition-colors focus:border-foreground"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <Button type="submit" className="h-12 w-full" disabled={codeValue.length < 6 || loading}>
                  {loading ? "Verificando..." : "Verificar e criar conta"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Não recebeu o código?{" "}
                    {resendCooldown > 0 ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        Reenviar em {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="text-foreground underline underline-offset-2 hover:text-accent"
                      >
                        Reenviar código
                      </button>
                    )}
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
