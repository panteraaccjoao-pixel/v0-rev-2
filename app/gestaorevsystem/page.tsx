"use client"

import { useState, useEffect, useCallback } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  RotateCcw,
  Users,
  Package,
  AlertCircle
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Stats {
  faturamento: number
  saques: number
  vendas: number
  ticketMedio: number
  usuariosCadastrados: number
  recargasPendentes: number
  estoqueTotal: number
  dailyData: { date: string; faturamento: number; vendas: number }[]
  recentSales: { id: string; user: string; product: string; value: number; date: string }[]
  lastUpdated: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    faturamento: 0,
    saques: 0,
    vendas: 0,
    ticketMedio: 0,
    usuariosCadastrados: 0,
    recargasPendentes: 0,
    estoqueTotal: 0,
    dailyData: [],
    recentSales: [],
    lastUpdated: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const handleReset = async () => {
    setResetting(true)
    try {
      await adminFetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" })
      })
      await fetchStats()
    } catch (error) {
      console.error("Error resetting stats:", error)
    } finally {
      setResetting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)
    
    if (diff < 1) return "agora"
    if (diff < 60) return `${diff} min`
    if (diff < 1440) return `${Math.floor(diff / 60)} h`
    return `${Math.floor(diff / 1440)} d`
  }

  // Transform daily data for chart
  const chartData = stats.dailyData.map(d => ({
    day: formatDate(d.date),
    vendas: d.faturamento,
    quantidade: d.vendas
  }))

  // Add empty days if no data
  if (chartData.length === 0) {
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      chartData.push({
        day: formatDate(date.toISOString()),
        vendas: 0,
        quantidade: 0
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReset} disabled={resetting}>
            <RotateCcw className={`h-4 w-4 mr-2 ${resetting ? "animate-spin" : ""}`} />
            Resetar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.faturamento)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {stats.faturamento > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Atualizado em tempo real</span>
                </>
              ) : (
                <span>Aguardando vendas</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Vendas
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vendas}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {stats.vendas > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Vendas confirmadas</span>
                </>
              ) : (
                <span>Aguardando vendas</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ticketMedio)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {stats.vendas > 0 ? (
                <span>Baseado em {stats.vendas} venda{stats.vendas > 1 ? "s" : ""}</span>
              ) : (
                <span>Sem vendas ainda</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Saques
            </CardTitle>
            <Wallet className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.saques)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {stats.saques > 0 ? (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">Saques realizados</span>
                </>
              ) : (
                <span>Nenhum saque ainda</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Usuários Cadastrados
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usuariosCadastrados}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado em tempo real
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Recargas Pendentes
              {stats.recargasPendentes > 0 && (
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
              )}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.recargasPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.recargasPendentes > 0 ? "Aguardando aprovação" : "Nenhuma pendência"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Estoque Total
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
            </CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.estoqueTotal}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cartões disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Recent Sales */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Chart */}
        <Card className="bg-card border-border lg:col-span-4">
          <CardHeader>
            <CardTitle>Faturamento por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
                    name="Faturamento"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="bg-card border-border lg:col-span-3">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSales.length > 0 ? (
                stats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{sale.user}</p>
                      <p className="text-xs text-muted-foreground">{sale.product}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-accent">
                        +{formatCurrency(sale.value)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTime(sale.date)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma venda ainda</p>
                  <p className="text-xs text-muted-foreground">As vendas aparecerão aqui em tempo real</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-muted-foreground text-center">
        Última atualização: {new Date(stats.lastUpdated).toLocaleString("pt-BR")}
      </p>
    </div>
  )
}
