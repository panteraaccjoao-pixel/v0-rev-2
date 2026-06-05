"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [discordId, setDiscordId] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, discordId: discordId.trim() || undefined })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("user_session", JSON.stringify(data))
        router.push("/dashboard")
      } else {
        setError(data.message || "Email ou senha incorretos")
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Back button */}
      <div className="p-4">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Entre na sua conta
            </h1>
            <p className="mt-2 text-muted-foreground">
              Digite seu email e senha para acessar o REV SYSTEM
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}

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

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-secondary border-border pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Discord ID */}
            <div className="space-y-2">
              <Label htmlFor="discordId" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#5865F2]" />
                ID do Discord
                <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="discordId"
                type="text"
                placeholder="123456789012345678"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                className="h-12 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                Ative o Modo Desenvolvedor no Discord para copiar seu ID.
              </p>
            </div>

            {/* Submit button */}
            <Button 
              type="submit" 
              className="h-12 w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-2 hover:text-foreground/80">
              Criar conta
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
