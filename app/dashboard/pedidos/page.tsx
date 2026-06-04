"use client"

import { useState } from "react"
import { CreditCard, Eye, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Types for orders
interface Order {
  id: string
  product: string
  productImage?: string
  quantity: number
  total: number
  date: string
  status: "entregue" | "expirado" | "reembolsado" | "pendente"
}

// Mock orders - empty array to show empty state
const mockOrders: Order[] = []

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

export default function PedidosPage() {
  const [filter, setFilter] = useState("todos")
  const [orders] = useState<Order[]>(mockOrders)

  const filteredOrders = orders.filter((order) => {
    if (filter === "todos") return true
    return order.status === filter
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Pedidos</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de todas as suas compras
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

      {/* Orders Table or Empty State */}
      {filteredOrders.length === 0 ? (
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
                  {order.productImage ? (
                    <img
                      src={order.productImage}
                      alt={order.product}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="font-medium text-foreground">
                    {order.product}
                  </span>
                </div>

                {/* Quantity */}
                <div className="text-center text-muted-foreground">
                  {order.quantity}
                </div>

                {/* Total */}
                <div className="text-center font-medium text-foreground">
                  R$ {order.total.toFixed(2).replace(".", ",")}
                </div>

                {/* Date */}
                <div className="text-center text-muted-foreground">
                  {order.date}
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
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
