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
  LogOut,
  Database,
  CreditCard,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { name: "Dashboard", href: "/paineladminseven", icon: LayoutDashboard },
  { name: "Usuários", href: "/paineladminseven/usuarios", icon: Users },
  { name: "Recargas", href: "/paineladminseven/recargas", icon: Wallet },
  { name: "Estoque", href: "/paineladminseven/estoque", icon: Package },
  { name: "Logins", href: "/paineladminseven/logins", icon: KeyRound },
  { name: "Compras", href: "/paineladminseven/compras", icon: ShoppingCart },
  { name: "Trocas", href: "/paineladminseven/trocas", icon: RefreshCw },
  { name: "Cupons", href: "/paineladminseven/cupons", icon: Ticket },
  { name: "Gifts", href: "/paineladminseven/gifts", icon: Gift },
  { name: "Feedbacks", href: "/paineladminseven/feedbacks", icon: MessageSquare },
  { name: "Suporte", href: "/paineladminseven/suporte", icon: HeadphonesIcon },
  { 
    name: "Configurações", 
    href: "/paineladminseven/configuracoes", 
    icon: Settings,
    subItems: [
      { name: "Geral", href: "/paineladminseven/configuracoes" },
      { name: "Banco de Dados", href: "/paineladminseven/configuracoes/banco-de-dados", icon: Database },
      { name: "Gateway PIX", href: "/paineladminseven/configuracoes/gateway", icon: CreditCard },
    ]
  },
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
            <Link href="/paineladminseven" className="flex items-center gap-2">
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
                (item.href !== "/paineladminseven" && pathname.startsWith(item.href))
              const hasSubItems = item.subItems && item.subItems.length > 0
              
              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </div>
                    {hasSubItems && (
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isActive ? "rotate-180" : ""
                      )} />
                    )}
                  </Link>
                  
                  {/* Sub-items */}
                  {hasSubItems && isActive && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border pl-4">
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                              isSubActive
                                ? "text-accent"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {subItem.icon && <subItem.icon className="h-4 w-4" />}
                            {subItem.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
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
