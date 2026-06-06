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

    const redirectToLogin = () => {
      setIsAuthenticated(false)
      setIsLoading(false)
      router.replace("/paineladminseven/login")
      // Fallback: ensure navigation completes even if soft routing is blocked (e.g. preview iframe)
      setTimeout(() => {
        if (window.location.pathname.startsWith("/paineladminseven") && window.location.pathname !== "/paineladminseven/login") {
          window.location.href = "/paineladminseven/login"
        }
      }, 400)
    }

    let session: string | null = null
    try {
      session = localStorage.getItem("admin_session")
    } catch {
      session = null
    }

    if (!session) {
      redirectToLogin()
      return
    }

    try {
      const sessionData = JSON.parse(session)

      // Check if session is expired
      if (!sessionData.expiresAt || sessionData.expiresAt < Date.now()) {
        try {
          localStorage.removeItem("admin_session")
        } catch {}
        redirectToLogin()
        return
      }

      setIsAuthenticated(true)
      setIsLoading(false)
    } catch {
      try {
        localStorage.removeItem("admin_session")
      } catch {}
      redirectToLogin()
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
