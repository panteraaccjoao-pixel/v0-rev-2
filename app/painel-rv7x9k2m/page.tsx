"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
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

// Dados de exemplo para o gráfico
const chartData = [
  { day: "01/01", vendas: 1200, recargas: 800 },
  { day: "02/01", vendas: 1800, recargas: 1200 },
  { day: "03/01", vendas: 2200, recargas: 1500 },
  { day: "04/01", vendas: 1600, recargas: 900 },
  { day: "05/01", vendas: 2800, recargas: 2000 },
  { day: "06/01", vendas: 3200, recargas: 2400 },
  { day: "07/01", vendas: 2400, recargas: 1800 },
  { day: "08/01", vendas: 2900, recargas: 2100 },
  { day: "09/01", vendas: 3500, recargas: 2600 },
  { day: "10/01", vendas: 3100, recargas: 2300 },
  { day: "11/01", vendas: 2700, recargas: 1900 },
  { day: "12/01", vendas: 3800, recargas: 2800 },
  { day: "13/01", vendas: 4200, recargas: 3100 },
  { day: "14/01", vendas: 3600, recargas: 2500 },
]

// Dados de exemplo para vendas recentes
const recentSales = [
  { id: 1, user: "joao@email.com", product: "CC Platinum", value: 45.00, time: "2 min" },
  { id: 2, user: "maria@email.com", product: "CC Gold", value: 35.00, time: "5 min" },
  { id: 3, user: "pedro@email.com", product: "CC Platinum", value: 45.00, time: "12 min" },
  { id: 4, user: "ana@email.com", product: "CC Black", value: 80.00, time: "18 min" },
  { id: 5, user: "lucas@email.com", product: "CC Gold", value: 35.00, time: "25 min" },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio
        </p>
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
            <div className="text-2xl font-bold">R$ 45.231,89</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+20.1%</span> desde o mês passado
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
            <div className="text-2xl font-bold">R$ 32.450,00</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+15.3%</span> desde o mês passado
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
            <div className="text-2xl font-bold">R$ 48,50</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-3 w-3 text-red-500" />
              <span className="text-red-500">-2.4%</span> desde o mês passado
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
            <div className="text-2xl font-bold">932</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.5%</span> desde o mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Recent Sales */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Chart */}
        <Card className="bg-card border-border lg:col-span-4">
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
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
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={false}
                    name="Vendas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="recargas" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    dot={false}
                    name="Recargas"
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
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{sale.user}</p>
                    <p className="text-xs text-muted-foreground">{sale.product}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-accent">
                      +R$ {sale.value.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{sale.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
