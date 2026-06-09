"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/paineladminseven/login") {
      setIsLoading(false)
      setIsAuthenticated(true)
      return
    }

    let cancelled = false

    const redirectToLogin = () => {
      try {
        localStorage.removeItem("admin_session")
      } catch {}
      if (cancelled) return
      setIsAuthenticated(false)
      setIsLoading(false)
      router.replace("/paineladminseven/login")
      // Fallback: ensure navigation completes even if soft routing is blocked (e.g. preview iframe)
      setTimeout(() => {
        if (
          window.location.pathname.startsWith("/paineladminseven") &&
          window.location.pathname !== "/paineladminseven/login"
        ) {
          window.location.href = "/paineladminseven/login"
        }
      }, 400)
    }

    const verify = async () => {
      // Lê o token salvo no login (se houver).
      let token: string | null = null
      try {
        const raw = localStorage.getItem("admin_session")
        if (raw) token = JSON.parse(raw)?.token ?? null
      } catch {
        token = null
      }

      if (!token) {
        redirectToLogin()
        return
      }

      // VALIDAÇÃO REAL NO SERVIDOR: o token precisa ter assinatura HMAC válida
      // e não estar expirado. Não basta existir algo no localStorage — assim
      // ninguém entra no painel forjando uma sessão pelo console do navegador.
      try {
        const res = await fetch("/api/admin/auth", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        if (cancelled) return
        if (res.ok) {
          setIsAuthenticated(true)
          setIsLoading(false)
        } else {
          redirectToLogin()
        }
      } catch {
        redirectToLogin()
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!isAuthenticated && pathname !== "/paineladminseven/login") {
    return null
  }

  return <>{children}</>
}
