"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Eye, CheckCircle, Clock, XCircle, RefreshCw, ShoppingCart } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Compra {
  id: string
  userId: string
  userName: string
  userEmail: string
  productId: string
  productName: string
  bin: string
  value: number
  status: "entregue" | "pendente" | "cancelado"
  createdAt: string
}

interface Stats {
  total: number
  entregues: number
  pendentes: number
  cancelados: number
  totalVendas: number
}

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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "entregue":
      return "Entregue"
    case "pendente":
      return "Pendente"
    case "cancelado":
      return "Cancelado"
    default:
      return status
  }
}

export default function ComprasPage() {
  const [search, setSearch] = useState("")
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [compras, setCompras] = useState<Compra[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    entregues: 0,
    pendentes: 0,
    cancelados: 0,
    totalVendas: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchCompras = useCallback(async () => {
    try {
      const res = await fetch("/api/compras")
      if (res.ok) {
        const data = await res.json()
        setCompras(data.compras || [])
        setStats(data.stats || {
          total: 0,
          entregues: 0,
          pendentes: 0,
          cancelados: 0,
          totalVendas: 0
        })
      }
    } catch (error) {
      console.error("Error fetching compras:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompras()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchCompras, 3000)
    return () => clearInterval(interval)
  }, [fetchCompras])

  const filteredCompras = compras.filter(
    (compra) =>
      compra.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      compra.userName.toLowerCase().includes(search.toLowerCase()) ||
      compra.productName.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">
            Historico de compras realizadas no site
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCompras}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Total de Vendas
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500 ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(stats.totalVendas)}
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
              {stats.entregues}
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
              {stats.pendentes}
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
              {stats.cancelados}
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filteredCompras.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma compra encontrada</h3>
          <p className="text-sm text-muted-foreground">As compras aparecem aqui em tempo real</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>ID</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompras.map((compra) => (
                <TableRow key={compra.id} className="border-border">
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    #{compra.id.split("_")[1]?.substring(0, 8) || compra.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{compra.userName}</p>
                      <p className="text-xs text-muted-foreground">{compra.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{compra.productName}</p>
                      <p className="text-xs text-muted-foreground">BIN: {compra.bin}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-accent">
                    {formatCurrency(compra.value)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(compra.status)}`}
                    >
                      {getStatusIcon(compra.status)}
                      {getStatusLabel(compra.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(compra.createdAt)}</TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Detalhes da Compra #{selectedCompra?.id.split("_")[1]?.substring(0, 8)}</DialogTitle>
            <DialogDescription>
              Informacoes completas da compra
            </DialogDescription>
          </DialogHeader>
          {selectedCompra && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Usuario</p>
                  <p className="font-medium">{selectedCompra.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedCompra.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(selectedCompra.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">{selectedCompra.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-accent">{formatCurrency(selectedCompra.value)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
