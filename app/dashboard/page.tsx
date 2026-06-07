"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  CreditCard, 
  Search, 
  Plus, 
  X,
  ChevronRight,
  Star,
  Sparkles,
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RecentSale {
  id: string
  user: string
  product: string
  value: number
  date: string
}

export default function DashboardPage() {
  const [showDiscordBanner, setShowDiscordBanner] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [userBalance, setUserBalance] = useState(0)

  const fetchRecentSales = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats")
      if (res.ok) {
        const data = await res.json()
        setRecentSales(data.recentSales || [])
      }
    } catch (error) {
      console.error("Error fetching recent sales:", error)
    }
  }, [])

  const fetchBalance = useCallback(async () => {
    try {
      let email = ""
      try {
        const raw = localStorage.getItem("user_session")
        email = raw ? JSON.parse(raw).email || "" : ""
      } catch {}

      const res = await fetch(`/api/user/balance?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        setUserBalance(data.balance || 0)
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
    }
  }, [])

  useEffect(() => {
    fetchRecentSales()
    fetchBalance()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      fetchRecentSales()
      fetchBalance()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [fetchRecentSales, fetchBalance])

  // Mask username for privacy
  const maskUsername = (username: string) => {
    if (username.length <= 2) return username
    return username.charAt(0) + "*".repeat(Math.min(username.length - 1, 6))
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return "agora"
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`
    return `${Math.floor(diff / 86400)} d`
  }

  // Mock user stats
  const stats = {
    compras: 0,
    totalGasto: 0,
    ticketMedio: 0,
  }

  const purchases: { produto: string; qtd: number; total: number; data: string; status: string }[] = []

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">Dashboard</span>
        </div>

        {/* Discord Banner */}
        {showDiscordBanner && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]/20">
                <svg className="h-6 w-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-foreground">Discord não vinculado</p>
                <p className="text-sm text-muted-foreground">Vincule para acesso a drops gratuitos e maior segurança</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Vincular
              </Button>
              <button 
                onClick={() => setShowDiscordBanner(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Rating Prompt */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-accent" />
          <span className="text-muted-foreground">Curtiu o serviço?</span>
          <Link href="/dashboard/avaliacoes" className="text-accent hover:underline">
            Deixe sua avaliação →
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {/* Saldo */}
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">Saldo</p>
              <Wallet className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 text-3xl font-bold text-accent">
              R$ {userBalance.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-sm text-muted-foreground">Disponível</p>
          </div>

          {/* Compras */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compras</p>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{stats.compras}</p>
            <p className="text-sm text-muted-foreground">Total de pedidos</p>
          </div>

          {/* Total Gasto */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Gasto</p>
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">
              R$ {stats.totalGasto.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-sm text-muted-foreground">Desde o cadastro</p>
          </div>

          {/* Ticket Médio */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticket Médio</p>
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">
              R$ {stats.ticketMedio.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-sm text-muted-foreground">Por compra</p>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="rounded-lg border border-border bg-card">
          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar compras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-secondary pl-10"
              />
            </div>
            <Button className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Plus className="h-4 w-4" />
              Nova Compra
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qtd</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary">
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Nenhuma compra encontrada</p>
                        <Link href="/dashboard/comprar" className="text-accent hover:underline">
                          Fazer primeira compra →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="px-4 py-3 text-sm text-foreground">{purchase.produto}</td>
                      <td className="px-4 py-3 text-center text-sm text-foreground">{purchase.qtd}</td>
                      <td className="px-4 py-3 text-center text-sm text-foreground">R$ {purchase.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">{purchase.data}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Recent Sales */}
      <aside className="w-80 border-l border-border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          Vendas recentes
          <span className="ml-auto flex h-2 w-2 animate-pulse rounded-full bg-green-500" title="Ao vivo" />
        </div>
        
        <div className="mt-4 space-y-3">
          {recentSales.length > 0 ? (
            recentSales.map((sale) => (
              <div 
                key={sale.id} 
                className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{maskUsername(sale.user)}</p>
                    <p className="text-xs text-muted-foreground">{sale.product}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent">
                    R$ {sale.value.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(sale.date)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CreditCard className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma venda ainda</p>
              <p className="text-xs text-muted-foreground">As vendas aparecem aqui em tempo real</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
