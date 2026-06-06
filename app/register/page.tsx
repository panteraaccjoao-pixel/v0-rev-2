"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Simple security verification (math challenge)
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [captchaAnswer, setCaptchaAnswer] = useState("")

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 10) + 1)
    setNum2(Math.floor(Math.random() * 10) + 1)
  }, [])

  const regenerateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1)
    setNum2(Math.floor(Math.random() * 10) + 1)
    setCaptchaAnswer("")
  }

  const captchaValid = captchaAnswer !== "" && parseInt(captchaAnswer) === num1 + num2

  const isFormValid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    password.length >= 6 &&
    password === confirmPassword &&
    captchaValid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (name.trim() === "") {
      setError("Digite seu nome completo")
      return
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      return
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }
    if (!captchaValid) {
      setError("Verificação de segurança incorreta")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store session and redirect to dashboard
        localStorage.setItem(
          "user_session",
          JSON.stringify({
            success: true,
            userId: data.user.id,
            name: data.user.name,
            email: data.user.email,
          })
        )
        router.push("/dashboard")
      } else {
        setError(data.error === "User already exists" ? "Este email já está cadastrado" : "Erro ao criar conta")
        regenerateCaptcha()
      }
    } catch {
      setError("Erro ao criar conta. Tente novamente.")
      regenerateCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Back button */}
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {/* Form container */}
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Criar sua conta</h1>
            <p className="mt-2 text-muted-foreground">Digite seus dados para criar uma conta na REV SYSTEM</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}

            {/* Nome completo */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 bg-secondary border-border"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-secondary border-border"
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-secondary border-border pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirmar senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-secondary border-border pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword !== "" && password !== confirmPassword && (
                <p className="text-xs text-red-500">As senhas não coincidem</p>
              )}
            </div>

            {/* Verificação de segurança (math captcha) */}
            <div className="space-y-2">
              <Label htmlFor="captcha">Verificação de segurança</Label>
              <div className="flex items-center gap-3 rounded-md border border-border bg-secondary p-3">
                <span className="select-none text-lg font-medium text-foreground">
                  {num1} + {num2} =
                </span>
                <Input
                  id="captcha"
                  type="number"
                  placeholder="?"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="h-10 w-20 bg-background border-border"
                />
                {captchaValid && <Check className="h-5 w-5 text-green-500" />}
              </div>
              <p className="text-xs text-muted-foreground">Resolva a soma para confirmar que você não é um robô.</p>
            </div>

            {/* Submit button */}
            <Button type="submit" className="h-12 w-full" disabled={!isFormValid || loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-2 hover:text-accent">
              Fazer login
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
