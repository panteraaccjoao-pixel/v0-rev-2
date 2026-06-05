"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"

export function Footer() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const authCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("rev_auth="))
      setIsAuthenticated(!!authCookie)
    }
    
    checkAuth()
    window.addEventListener("storage", checkAuth)
    
    return () => window.removeEventListener("storage", checkAuth)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    if (isAuthenticated) {
      router.push(href)
    } else {
      router.push("/login")
    }
  }

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold tracking-tight text-foreground">REV SYSTEM</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A plataforma mais confiável para compra de cartões digitais. 
              Segurança, velocidade e qualidade garantidas.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-accent" />
              <span>Entrega automática</span>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Navegação</h4>
            <nav className="flex flex-col gap-2">
              <a 
                href="/dashboard"
                onClick={(e) => handleNavClick(e, "/dashboard")}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                Dashboard
              </a>
              <a 
                href="/dashboard/comprar"
                onClick={(e) => handleNavClick(e, "/dashboard/comprar")}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                Comprar Cartões
              </a>
              <a 
                href="/dashboard/recarregar"
                onClick={(e) => handleNavClick(e, "/dashboard/recarregar")}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                Recarregar Saldo
              </a>
            </nav>
          </div>
          
          {/* Help */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Ajuda</h4>
            <nav className="flex flex-col gap-3">
              <Link 
                href="/duvidas" 
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Duvidas e termos
              </Link>
            </nav>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} REV SYSTEM. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
