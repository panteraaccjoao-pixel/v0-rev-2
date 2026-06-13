"use client"

import { Suspense, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

function VerifyContent() {
  const router = useRouter()

  useEffect(() => {
    // A confirmação por email foi removida. Encaminha o usuário ao login.
    const timer = setTimeout(() => router.replace("/login"), 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="p-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <MailCheck className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Conta criada
          </h1>
          <p className="text-pretty text-muted-foreground">
            Sua conta já está ativa. Você pode entrar diretamente com seu email e senha.
          </p>
          <Button asChild className="h-12 w-full">
            <Link href="/login">Ir para o login</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  )
}
