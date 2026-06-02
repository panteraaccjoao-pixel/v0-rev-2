"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle, Clock, XCircle } from "lucide-react"

// Dados de exemplo
const recargas = [
  { id: 1, user: "joao@email.com", value: 100.00, method: "PIX", status: "aprovado", date: "14/01/2024 15:30" },
  { id: 2, user: "maria@email.com", value: 50.00, method: "PIX", status: "aprovado", date: "14/01/2024 14:20" },
  { id: 3, user: "pedro@email.com", value: 200.00, method: "PIX", status: "pendente", date: "14/01/2024 13:15" },
  { id: 4, user: "ana@email.com", value: 75.00, method: "PIX", status: "aprovado", date: "14/01/2024 12:00" },
  { id: 5, user: "lucas@email.com", value: 150.00, method: "PIX", status: "cancelado", date: "14/01/2024 11:30" },
  { id: 6, user: "carla@email.com", value: 300.00, method: "PIX", status: "aprovado", date: "13/01/2024 18:45" },
  { id: 7, user: "rafael@email.com", value: 25.00, method: "PIX", status: "aprovado", date: "13/01/2024 17:30" },
  { id: 8, user: "julia@email.com", value: 500.00, method: "PIX", status: "pendente", date: "13/01/2024 16:15" },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "aprovado":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "pendente":
      return <Clock className="h-4 w-4 text-yellow-500" />
    case "cancelado":
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return null
  }
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "aprovado":
      return "bg-green-500/10 text-green-500"
    case "pendente":
      return "bg-yellow-500/10 text-yellow-500"
    case "cancelado":
      return "bg-red-500/10 text-red-500"
    default:
      return ""
  }
}

export default function RecargasPage() {
  const [search, setSearch] = useState("")

  const filteredRecargas = recargas.filter(
    (recarga) => recarga.user.toLowerCase().includes(search.toLowerCase())
  )

  const totalAprovado = recargas
    .filter((r) => r.status === "aprovado")
    .reduce((acc, r) => acc + r.value, 0)

  const totalPendente = recargas
    .filter((r) => r.status === "pendente")
    .reduce((acc, r) => acc + r.value, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recargas</h1>
        <p className="text-muted-foreground">
          Histórico de recargas feitas pelos clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Aprovado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {totalAprovado.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              R$ {totalPendente.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Recargas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recargas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Recargas Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Histórico de Recargas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Usuário</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Método</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecargas.map((recarga) => (
                  <tr key={recarga.id} className="border-b border-border last:border-0">
                    <td className="py-4 text-sm text-muted-foreground">#{recarga.id}</td>
                    <td className="py-4 text-sm">{recarga.user}</td>
                    <td className="py-4 text-sm font-medium text-accent">
                      R$ {recarga.value.toFixed(2)}
                    </td>
                    <td className="py-4 text-sm">{recarga.method}</td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(recarga.status)}`}
                      >
                        {getStatusIcon(recarga.status)}
                        {recarga.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{recarga.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
