"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [referralId, setReferralId] = useState("")

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
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Criar sua conta
            </h1>
            <p className="mt-2 text-muted-foreground">
              Digite seus dados para criar uma conta na REV SYSTEM
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5">
            {/* Nome completo */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome completo"
                className="h-12 bg-secondary border-border"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="h-12 bg-secondary border-border"
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  className="h-12 bg-secondary border-border pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
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
                  className="h-12 bg-secondary border-border pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* ID de indicação */}
            <div className="space-y-2">
              <Label htmlFor="referral">ID de indicação (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="referral"
                  type="text"
                  placeholder="Cole o ID de indicação aqui"
                  value={referralId}
                  onChange={(e) => setReferralId(e.target.value)}
                  className="h-12 bg-secondary border-border"
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="h-12 px-6"
                  disabled={!referralId}
                >
                  Validar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Se alguém te indicou, cole o ID de indicação aqui.
              </p>
            </div>

            {/* Verificação de segurança (placeholder for captcha) */}
            <div className="space-y-2">
              <Label>Verificação de segurança</Label>
              <div className="h-20 rounded-md border border-border bg-secondary"></div>
            </div>

            {/* Submit button */}
            <Button 
              type="submit" 
              className="h-12 w-full"
              disabled
            >
              Criar conta
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
