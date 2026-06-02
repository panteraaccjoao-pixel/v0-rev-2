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
  Users,
  Star,
  MessageSquare,
  Ticket,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  ExternalLink,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const platformItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Comprar Cartões", href: "/dashboard/comprar", icon: CreditCard },
  { name: "Recarga de Saldo", href: "/dashboard/recarregar", icon: Wallet },
  { name: "Meus Pedidos", href: "/dashboard/pedidos", icon: ShoppingBag },
]

const resourceItems = [
  { name: "Drops", href: "/dashboard/drops", icon: Gift },
  { name: "Indicação", href: "/dashboard/indicacao", icon: Users },
  { name: "Avaliações", href: "/dashboard/avaliacoes", icon: Star },
]

const communityItems = [
  { name: "Grupos", href: "/dashboard/grupos", icon: MessageSquare },
  { name: "Tickets", href: "/dashboard/tickets", icon: Ticket },
]

const supportItems = [
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
  { name: "Dúvidas Frequentes", href: "/duvidas", icon: HelpCircle },
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

  useEffect(() => {
    const session = localStorage.getItem("user_session")
    if (!session) {
      router.push("/login")
      return
    }
    try {
      const data = JSON.parse(session)
      setUser({ name: data.user?.name || "Usuário", email: data.user?.email || "" })
    } catch {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user_session")
    router.push("/login")
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    )
  }

  const renderNavSection = (title: string, items: typeof platformItems) => (
    <div className="mb-6">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
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

        {/* Tutorial Card */}
        <div className="mx-3 mt-4 rounded-lg border border-border bg-secondary/30 p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
              <Star className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Tutorial de Como Aprovar</p>
              <p className="text-xs text-muted-foreground">Aprenda a aprovar seus cartões</p>
              <Link href="/dashboard/tutorial" className="mt-1 text-xs text-accent hover:underline">
                Ver tutorial →
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {renderNavSection("Plataforma", platformItems)}
          {renderNavSection("Recursos", resourceItems)}
          {renderNavSection("Comunidade & Trampos", communityItems)}
          {renderNavSection("Conta e Suporte", supportItems)}
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
