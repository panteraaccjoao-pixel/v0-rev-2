"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Eye, CheckCircle, Clock, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Dados de exemplo
const compras = [
  { 
    id: 1, 
    user: "joao@email.com", 
    userName: "João Silva",
    product: "CC Platinum Santander",
    bin: "520132",
    value: 45.00, 
    status: "entregue",
    date: "14/01/2024 15:30"
  },
  { 
    id: 2, 
    user: "maria@email.com", 
    userName: "Maria Santos",
    product: "CC Gold Itaú",
    bin: "450123",
    value: 35.00, 
    status: "entregue",
    date: "14/01/2024 14:20"
  },
  { 
    id: 3, 
    user: "pedro@email.com", 
    userName: "Pedro Costa",
    product: "CC Black Nubank",
    bin: "540721",
    value: 80.00, 
    status: "pendente",
    date: "14/01/2024 13:15"
  },
  { 
    id: 4, 
    user: "ana@email.com", 
    userName: "Ana Oliveira",
    product: "CC Infinite Bradesco",
    bin: "410256",
    value: 120.00, 
    status: "entregue",
    date: "14/01/2024 12:00"
  },
  { 
    id: 5, 
    user: "lucas@email.com", 
    userName: "Lucas Pereira",
    product: "CC Platinum Santander",
    bin: "520132",
    value: 45.00, 
    status: "cancelado",
    date: "14/01/2024 11:30"
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "entregue":
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
    case "entregue":
      return "bg-green-500/10 text-green-500"
    case "pendente":
      return "bg-yellow-500/10 text-yellow-500"
    case "cancelado":
      return "bg-red-500/10 text-red-500"
    default:
      return ""
  }
}

export default function ComprasPage() {
  const [search, setSearch] = useState("")
  const [selectedCompra, setSelectedCompra] = useState<typeof compras[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredCompras = compras.filter(
    (compra) =>
      compra.user.toLowerCase().includes(search.toLowerCase()) ||
      compra.userName.toLowerCase().includes(search.toLowerCase()) ||
      compra.product.toLowerCase().includes(search.toLowerCase())
  )

  const totalVendas = compras.filter(c => c.status === "entregue").reduce((acc, c) => acc + c.value, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
        <p className="text-muted-foreground">
          Histórico de compras realizadas no site
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              R$ {totalVendas.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {compras.filter(c => c.status === "entregue").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {compras.filter(c => c.status === "pendente").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {compras.filter(c => c.status === "cancelado").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, nome ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Compras Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Histórico de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Usuário</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Produto</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompras.map((compra) => (
                  <tr key={compra.id} className="border-b border-border last:border-0">
                    <td className="py-4 text-sm text-muted-foreground">#{compra.id}</td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-medium">{compra.userName}</p>
                        <p className="text-xs text-muted-foreground">{compra.user}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-medium">{compra.product}</p>
                        <p className="text-xs text-muted-foreground">BIN: {compra.bin}</p>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-medium text-accent">
                      R$ {compra.value.toFixed(2)}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(compra.status)}`}
                      >
                        {getStatusIcon(compra.status)}
                        {compra.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{compra.date}</td>
                    <td className="py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedCompra(compra)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Detalhes da Compra #{selectedCompra?.id}</DialogTitle>
            <DialogDescription>
              Informações completas da compra
            </DialogDescription>
          </DialogHeader>
          {selectedCompra && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Usuário</p>
                  <p className="font-medium">{selectedCompra.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedCompra.user}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{selectedCompra.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">{selectedCompra.product}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-accent">R$ {selectedCompra.value.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
