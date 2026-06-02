"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  Package, 
  KeyRound, 
  ShoppingCart, 
  RefreshCw, 
  Ticket, 
  Gift, 
  MessageSquare,
  HeadphonesIcon,
  Settings,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { name: "Dashboard", href: "/painel-rv7x9k2m", icon: LayoutDashboard },
  { name: "Usuários", href: "/painel-rv7x9k2m/usuarios", icon: Users },
  { name: "Recargas", href: "/painel-rv7x9k2m/recargas", icon: Wallet },
  { name: "Estoque", href: "/painel-rv7x9k2m/estoque", icon: Package },
  { name: "Logins", href: "/painel-rv7x9k2m/logins", icon: KeyRound },
  { name: "Compras", href: "/painel-rv7x9k2m/compras", icon: ShoppingCart },
  { name: "Trocas", href: "/painel-rv7x9k2m/trocas", icon: RefreshCw },
  { name: "Cupons", href: "/painel-rv7x9k2m/cupons", icon: Ticket },
  { name: "Gifts", href: "/painel-rv7x9k2m/gifts", icon: Gift },
  { name: "Feedbacks", href: "/painel-rv7x9k2m/feedbacks", icon: MessageSquare },
  { name: "Suporte", href: "/painel-rv7x9k2m/suporte", icon: HeadphonesIcon },
  { name: "Configurações", href: "/painel-rv7x9k2m/configuracoes", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link href="/painel-rv7x9k2m" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-bold">
                R
              </div>
              <span className="text-lg font-bold tracking-tight">REV SYSTEM</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/painel-rv7x9k2m" && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Sair do Painel
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
