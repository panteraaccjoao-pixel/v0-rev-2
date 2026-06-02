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

    // Check if user is authenticated
    const session = localStorage.getItem("admin_session")
    
    if (!session) {
      router.push("/paineladminseven/login")
      return
    }

    try {
      const sessionData = JSON.parse(session)
      
      // Check if session is expired
      if (sessionData.expiresAt < Date.now()) {
        localStorage.removeItem("admin_session")
        router.push("/paineladminseven/login")
        return
      }

      setIsAuthenticated(true)
    } catch {
      localStorage.removeItem("admin_session")
      router.push("/paineladminseven/login")
    } finally {
      setIsLoading(false)
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
