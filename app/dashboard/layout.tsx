"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  LayoutDashboard, 
  CreditCard, 
  Wallet, 
  ShoppingBag,
  Gift,
  Star,
  Ticket,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { saveSession, clearSession, getSessionToken } from "@/lib/session"

const platformItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Comprar Cartões", href: "/dashboard/comprar", icon: CreditCard },
  { name: "Recarga de Saldo", href: "/dashboard/recarregar", icon: Wallet },
  { name: "Meus Pedidos", href: "/dashboard/pedidos", icon: ShoppingBag },
]

const resourceItems = [
  { name: "Drops", href: "/dashboard/drops", icon: Gift },
  { name: "Gifts", href: "/dashboard/gifts", icon: Gift },
  { name: "Avaliações", href: "/dashboard/avaliacoes", icon: Star },
  { name: "Trocas", href: "/dashboard/trocas", icon: RefreshCw },
]

const communityItems = [
  { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
]

const supportItems = [
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
  { name: "Dúvidas Frequentes", href: "/duvidas", icon: HelpCircle, external: true },
  { name: "Termos", href: "/dashboard/termos", icon: FileText },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [discordServerUrl, setDiscordServerUrl] = useState("")

  useEffect(() => {
    let active = true

    const redirectToLogin = () => {
      if (!active) return
      setCheckingAuth(false)
      router.replace("/login")
    }

    const checkAuth = async () => {
      try {
        const raw = localStorage.getItem("user_session")
        const session = raw ? JSON.parse(raw) : null

        if (!session?.success || !session?.email) {
          redirectToLogin()
          return
        }

        // Valida a sessão NO SERVIDOR. Isso revalida o usuário contra o banco
        // e (re)emite o cookie httpOnly + token assinado. Uma sessão forjada no
        // localStorage (ex.: {success:true}) é rejeitada aqui, pois o servidor
        // só confirma usuários reais e ativos.
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getSessionToken() ? { Authorization: `Bearer ${getSessionToken()}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ email: session.email }),
        })

        if (!active) return

        if (!res.ok) {
          clearSession()
          redirectToLogin()
          return
        }

        const result = await res.json()
        const name = result.user?.name || result.user?.email || "Usuário"

        // Atualiza a sessão local com os dados confirmados e o token novo.
        saveSession({
          userId: result.user?.id,
          name,
          email: result.user?.email,
          token: result.token,
        })

        setUser({ name, email: result.user?.email || "" })
        setCheckingAuth(false)
      } catch {
        if (active) redirectToLogin()
      }
    }

    checkAuth()

    // Fetch Discord server URL
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (active && data.discordServerUrl) {
          setDiscordServerUrl(data.discordServerUrl)
        }
      })
      .catch(console.error)

    return () => {
      active = false
    }
  }, [router])

  const handleLogout = async () => {
    try {
      // Invalida o cookie de sessão no servidor.
      await fetch("/api/auth/login", { method: "DELETE", credentials: "include" })
    } catch {}
    clearSession()
    window.location.href = "/login"
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          {checkingAuth ? "Carregando..." : "Redirecionando para o login..."}
        </p>
      </div>
    )
  }

  const renderNavSection = (title: string, items: typeof platformItems, showDiscord?: boolean) => (
    <div className="mb-6">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          const cls = cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-accent/10 text-accent"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )
          if ((item as any).external) {
            return (
              <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </a>
            )
          }
          return (
            <Link key={item.name} href={item.href} className={cls}>
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
        {showDiscord && discordServerUrl && (
          <div className="mt-4 px-1">
            <a
              href={discordServerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
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
          </div>
        )}
      </nav>
    </div>
  )

  return (
    <div className="flex min-h-screen rounded-[44px] bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <CreditCard className="h-4 w-4 text-accent" />
          </div>
          <span className="text-lg font-bold">
            REV <span className="text-accent">SYSTEM</span>
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {renderNavSection("Plataforma", platformItems)}
          {renderNavSection("Recursos", resourceItems)}
          {renderNavSection("Atendimento", communityItems)}
          {renderNavSection("Conta e Suporte", supportItems, true)}
        </div>

        {/* User Profile */}
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
