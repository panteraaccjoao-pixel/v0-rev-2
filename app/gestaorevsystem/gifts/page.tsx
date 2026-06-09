"use client"

import { useState, useEffect, useCallback } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Copy,
  CheckCircle,
  Gift,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface GiftItem {
  id: string
  code: string
  value: number
  status: "disponível" | "resgatado"
  createdAt: string
  usedBy: string | null
  usedAt: string | null
}

export default function GiftsPage() {
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [search, setSearch] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newGift, setNewGift] = useState({ value: "", quantity: "1" })
  const [copied, setCopied] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchGifts = useCallback(async () => {
    try {
      const res = await adminFetch("/api/gifts")
      if (res.ok) {
        const data = await res.json()
        setGifts(data.gifts || [])
      }
    } catch (error) {
      console.error("Error fetching gifts:", error)
    }
  }, [])

  // Carrega e atualiza em tempo real (polling a cada 3s)
  useEffect(() => {
    fetchGifts()
    const interval = setInterval(fetchGifts, 3000)
    return () => clearInterval(interval)
  }, [fetchGifts])

  const handleCreate = async () => {
    if (!newGift.value || Number.parseFloat(newGift.value) <= 0) return
    setCreating(true)
    try {
      const res = await adminFetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGift),
      })
      if (res.ok) {
        await fetchGifts()
        setNewGift({ value: "", quantity: "1" })
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error("Error creating gift:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/gifts?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setGifts((prev) => prev.filter((g) => g.id !== id))
      }
    } catch (error) {
      console.error("Error deleting gift:", error)
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pt-BR")
    } catch {
      return iso
    }
  }

  const filteredGifts = gifts.filter((gift) =>
    gift.code.toLowerCase().includes(search.toLowerCase())
  )

  const disponiveis = gifts.filter((g) => g.status === "disponível")
  const totalDisponivel = disponiveis.reduce((acc, g) => acc + g.value, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gifts</h1>
          <p className="text-muted-foreground">
            Crie códigos de presente para os usuários resgatarem saldo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Em tempo real
          </span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Gift
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Criar Novo Gift</DialogTitle>
                <DialogDescription>
                  Gere códigos de presente para os usuários
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor do Gift (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="50.00"
                    value={newGift.value}
                    onChange={(e) => setNewGift({ ...newGift, value: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade de Gifts</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="1"
                    min="1"
                    max="100"
                    value={newGift.quantity}
                    onChange={(e) => setNewGift({ ...newGift, quantity: e.target.value })}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo de 100 gifts por vez
                  </p>
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={creating}>
                  {creating ? "Gerando..." : `Gerar ${newGift.quantity || 1} Gift(s)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gifts Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {disponiveis.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              R$ {totalDisponivel.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resgatados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {gifts.filter((g) => g.status === "resgatado").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Gifts Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Gifts Criados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Código</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Criado em</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Usado por</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredGifts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary">
                          <Gift className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Nenhum gift criado ainda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGifts.map((gift) => (
                    <tr key={gift.id} className="border-b border-border last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-accent" />
                          <code className="rounded bg-secondary px-2 py-1 text-sm font-mono">
                            {gift.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleCopy(gift.code)}
                          >
                            {copied === gift.code ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="py-4 text-sm font-medium text-accent">
                        R$ {gift.value.toFixed(2)}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            gift.status === "disponível"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {gift.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {formatDate(gift.createdAt)}
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {gift.usedBy ? (
                          <div>
                            <p>{gift.usedBy}</p>
                            <p className="text-xs">{gift.usedAt ? formatDate(gift.usedAt) : ""}</p>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem onClick={() => handleCopy(gift.code)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar código
                            </DropdownMenuItem>
                            {gift.status === "disponível" && (
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleDelete(gift.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
