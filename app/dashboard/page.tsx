"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ShoppingCart, Search, Plus, X, Zap, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authFetch } from "@/lib/session"

interface RecentSale {
  id: string
  user: string
  product: string
  value: number
  date: string
}

interface Purchase {
  id: string
  produto: string
  qtd: number
  total: number
  data: string
  status: string
}

const FAKE_USERS = [
  "b", "h", "G", "I", "P", "m", "r", "a", "j", "c",
  "L", "R", "f", "n", "v", "e", "d", "t", "s", "k",
  "A", "M", "B", "W",
]
const FAKE_ASTERISKS = [6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22]
const FAKE_LEVELS = [
  { level: "Black", value: 60 },
  { level: "Standard", value: 25 },
  { level: "Infinite", value: 75 },
  { level: "Gold", value: 30 },
  { level: "Platinum", value: 40 },
]

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function makeFakeSale(secondsAgo: number, rand: () => number, letter: string): RecentSale {
  const lvl = pick(FAKE_LEVELS, rand)
  const stars = pick(FAKE_ASTERISKS, rand)
  return {
    id: `fake_${secondsAgo}_${Math.floor(rand() * 1e9).toString(36)}`,
    user: letter + "*".repeat(stars),
    product: `Cartão ${lvl.level}`,
    value: lvl.value,
    date: new Date(Date.now() - secondsAgo * 1000).toISOString(),
  }
}

function seededRandom(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeInitialFakeSales(): RecentSale[] {
  const rand = seededRandom(20260609)
  const offsets = [8, 45, 130, 320, 540, 900, 1500, 2400, 3600, 5400]
  const users = shuffle(FAKE_USERS, rand)
  return offsets.map((s, i) => makeFakeSale(s, rand, users[i]))
}

export default function DashboardPage() {
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [discordLinked, setDiscordLinked] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSales, setRecentSales] = useState<RecentSale[]>(() => makeInitialFakeSales())
  const [userBalance, setUserBalance] = useState(0)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [stats, setStats] = useState({ compras: 0, totalGasto: 0, ticketMedio: 0 })

  const showDiscordBanner = !bannerDismissed && !discordLinked

  const fetchDiscordStatus = useCallback(async () => {
    try {
      const res = await authFetch("/api/user/discord")
      if (res.ok) {
        const data = await res.json()
        setDiscordLinked(!!data.linked)
      }
    } catch {}
  }, [])

  const fetchRecentSales = useCallback(async () => {
    try {
      const res = await fetch("/api/public/recent-sales")
      if (res.ok) {
        const data = await res.json()
        const realSales: RecentSale[] = data.sales || []
        setRecentSales((prev) => {
          const fakes = prev.filter((s) => s.id.startsWith("fake_"))
          if (realSales.length > 0) {
            // Reais na frente, fakes completam até 10
            return [...realSales, ...fakes].slice(0, 10)
          }
          return fakes
        })
      }
    } catch {}
  }, [])

  const fetchBalance = useCallback(async () => {
    try {
      const res = await authFetch("/api/user/balance")
      if (res.ok) {
        const data = await res.json()
        setUserBalance(data.balance || 0)
      }
    } catch {}
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      const res = await authFetch("/api/pedidos")
      if (!res.ok) return
      const data = await res.json()
      const orders: any[] = data.orders || []
      const concluidos = orders.filter((o) => o.status === "entregue")
      const totalGasto = concluidos.reduce((acc, o) => acc + (Number(o.total) || 0), 0)
      const compras = concluidos.length
      setStats({ compras, totalGasto, ticketMedio: compras > 0 ? totalGasto / compras : 0 })
      setPurchases(
        orders.map((o) => ({
          id: o.id,
          produto: o.product,
          qtd: Number(o.quantity) || 1,
          total: Number(o.total) || 0,
          data: new Date(o.date).toLocaleDateString("pt-BR"),
          status: o.status === "entregue" ? "Entregue" : o.status === "pendente" ? "Pendente" : "Cancelado",
        })),
      )
    } catch {}
  }, [])

  useEffect(() => {
    fetchRecentSales(); fetchBalance(); fetchDiscordStatus(); fetchOrders()
    const interval = setInterval(() => {
      fetchRecentSales(); fetchBalance(); fetchDiscordStatus(); fetchOrders()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchRecentSales, fetchBalance, fetchDiscordStatus, fetchOrders])

  const maskUsername = (username: string) => username

  const formatTimeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (diff < 60) return "agora"
    if (diff < 3600) return `${Math.floor(diff / 60)}min`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  }

  const filteredPurchases = purchases.filter((p) =>
    p.produto.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Discord Banner */}
        {showDiscordBanner && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]/20">
                <svg className="h-6 w-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold">Discord não vinculado</p>
                <p className="text-sm text-muted-foreground">Vincule para acesso a drops gratuitos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href="https://restorecord.com/verify/REV%20SYSTEM%20%F0%9F%92%89" target="_blank" rel="noopener noreferrer">
                  Vincular
                </a>
              </Button>
              <button onClick={() => setBannerDismissed(true)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo</p>
            <p className="mt-2 text-3xl font-bold">{fmt(userBalance)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Disponível para compras</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compras</p>
            <p className="mt-2 text-3xl font-bold">{stats.compras}</p>
            <p className="mt-1 text-sm text-muted-foreground">Cartões adquiridos</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Gasto</p>
            <p className="mt-2 text-3xl font-bold">{fmt(stats.totalGasto)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Desde o cadastro</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticket Médio</p>
            <p className="mt-2 text-3xl font-bold">{fmt(stats.ticketMedio)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Por compra</p>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar compras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-secondary pl-10"
              />
            </div>
            <Link href="/dashboard/comprar">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Compra
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantidade</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhum resultado encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-sm">{p.produto}</td>
                      <td className="px-4 py-3 text-center text-sm">{p.qtd}</td>
                      <td className="px-4 py-3 text-center text-sm">{fmt(p.total)}</td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">{p.data}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          p.status === "Entregue"
                            ? "bg-green-500/10 text-green-500"
                            : p.status === "Pendente"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href="/dashboard/pedidos">
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
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
      <aside className="w-72 shrink-0 border-l border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-red-500" />
          Vendas recentes
          <span className="ml-auto flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
        </div>

        <div className="mt-4 space-y-2">
          {recentSales.map((sale) => (
            <div key={sale.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-secondary/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-[110px]">{maskUsername(sale.user)}</p>
                  <p className="text-xs text-muted-foreground">{sale.product}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-sm font-semibold">{fmt(sale.value)}</p>
                <p className="text-xs text-muted-foreground">{formatTimeAgo(sale.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
