"use client"

import { useState, useEffect, useCallback } from "react"
import { CreditCard, Eye, ShoppingBag, X, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Order {
  id: string
  oderId: string
  userId: string
  userName: string
  product: string
  level: string
  brand: string
  quantity: number
  total: number
  date: string
  status: "entregue" | "expirado" | "reembolsado" | "pendente"
  cardData?: {
    fullCard: string
    cvv: string
    expiry: string
    bin: string
    bank: string
  }
}

const statusConfig = {
  entregue: {
    label: "Entregue",
    className: "bg-green-500/20 text-green-500 border-green-500/30",
  },
  expirado: {
    label: "Expirado",
    className: "bg-muted text-muted-foreground border-border",
  },
  reembolsado: {
    label: "Reembolsado",
    className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  },
  pendente: {
    label: "Pendente",
    className: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  },
}

const getLevelColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case "black": return "text-zinc-400"
    case "platinum": return "text-slate-300"
    case "gold": return "text-yellow-500"
    case "infinite": return "text-purple-500"
    default: return "text-blue-500"
  }
}

export default function PedidosPage() {
  const [filter, setFilter] = useState("todos")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/pedidos?userId=user_teste_001")
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchOrders, 3000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    if (filter === "todos") return true
    return order.status === filter
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de todas as suas compras
            {orders.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-green-500">Ao vivo</span>
              </span>
            )}
          </p>
        </div>

        {/* Filter */}
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px] border-border bg-card">
            <SelectValue placeholder="Filtrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="expirado">Expirado</SelectItem>
            <SelectItem value="reembolsado">Reembolsado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-[500px] flex-col items-center justify-center rounded-lg border border-border bg-card/50">
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10">
              <ShoppingBag className="h-10 w-10 text-accent" />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Nenhuma compra feita
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Você ainda não fez nenhuma compra. Quando realizar uma compra, ela aparecerá aqui.
              </p>
            </div>

            {/* CTA Button */}
            <Button asChild className="mt-4 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <a href="/dashboard/comprar">
                <CreditCard className="h-4 w-4" />
                Comprar Cartões
              </a>
            </Button>
          </div>
        </div>
      ) : (
        /* Orders Table */
        <div className="rounded-lg border border-border bg-card">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <div>Produto</div>
            <div className="text-center">Qtd</div>
            <div className="text-center">Total</div>
            <div className="text-center">Data</div>
            <div className="text-center">Status</div>
            <div className="w-8"></div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-secondary/30"
              >
                {/* Product */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <CreditCard className={`h-5 w-5 ${getLevelColor(order.level)}`} />
                  </div>
                  <div>
                    <span className={`font-medium ${getLevelColor(order.level)}`}>
                      {order.product}
                    </span>
                    <p className="text-xs text-muted-foreground">{order.oderId}</p>
                  </div>
                </div>

                {/* Quantity */}
                <div className="text-center text-muted-foreground">
                  {order.quantity}
                </div>

                {/* Total */}
                <div className="text-center font-medium text-accent">
                  R$ {order.total.toFixed(2).replace(".", ",")}
                </div>

                {/* Date */}
                <div className="text-center text-sm text-muted-foreground">
                  {formatDate(order.date)}
                </div>

                {/* Status */}
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                      statusConfig[order.status].className
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {statusConfig[order.status].label}
                  </span>
                </div>

                {/* View Button */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              {selectedOrder?.oderId} - {selectedOrder && formatDate(selectedOrder.date)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Product Info */}
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-lg font-bold ${getLevelColor(selectedOrder.level)}`}>
                    {selectedOrder.product}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                    statusConfig[selectedOrder.status].className
                  }`}>
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Valor: R$ {selectedOrder.total.toFixed(2).replace(".", ",")}
                </p>
              </div>

              {/* Card Data */}
              {selectedOrder.cardData && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Dados do Cartão</h4>
                  
                  <div className="rounded-lg bg-secondary/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Número</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{selectedOrder.cardData.fullCard}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedOrder.cardData!.fullCard, "fullCard")}
                        >
                          {copied === "fullCard" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Validade</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{selectedOrder.cardData.expiry}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedOrder.cardData!.expiry, "expiry")}
                        >
                          {copied === "expiry" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">CVV</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{selectedOrder.cardData.cvv}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedOrder.cardData!.cvv, "cvv")}
                        >
                          {copied === "cvv" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Banco</span>
                      <span className="font-medium">{selectedOrder.cardData.bank || "N/A"}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">BIN</span>
                      <span className="font-mono font-medium">{selectedOrder.cardData.bin}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setSelectedOrder(null)}
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
