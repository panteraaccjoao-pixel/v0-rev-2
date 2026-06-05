"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"

export function Footer() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [discordServerUrl, setDiscordServerUrl] = useState("")
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
    
    // Fetch Discord server URL from settings
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data.discordServerUrl) {
          setDiscordServerUrl(data.discordServerUrl)
        }
      })
      .catch(console.error)
    
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
              <a
                href={discordServerUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Entrar no Discord
              </a>
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
