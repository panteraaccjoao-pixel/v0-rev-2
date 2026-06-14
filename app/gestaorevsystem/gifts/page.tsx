"use client"

import { useState, useEffect, useCallback } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Search,
  Trash2,
  Copy,
  CheckCircle,
  Gift,
  Sparkles,
  Plus,
} from "lucide-react"

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
  const [newGift, setNewGift] = useState({ value: "", quantity: "1" })
  const [copied, setCopied] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(false)

  const fetchGifts = useCallback(async () => {
    try {
      const res = await adminFetch("/api/gifts")
      if (res.ok) {
        const data = await res.json()
        setGifts(data.gifts || [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchGifts()
    const interval = setInterval(fetchGifts, 5000)
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
        setCreateSuccess(true)
        setTimeout(() => setCreateSuccess(false), 3000)
      }
    } catch {}
    finally { setCreating(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/gifts?id=${id}`, { method: "DELETE" })
      if (res.ok) setGifts((prev) => prev.filter((g) => g.id !== id))
    } catch {}
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("pt-BR") } catch { return iso }
  }

  const filteredGifts = gifts.filter((g) =>
    g.code.toLowerCase().includes(search.toLowerCase()) ||
    (g.usedBy || "").toLowerCase().includes(search.toLowerCase())
  )

  const disponiveis = gifts.filter((g) => g.status === "disponível")
  const resgatados = gifts.filter((g) => g.status === "resgatado")
  const totalDisponivel = disponiveis.reduce((acc, g) => acc + g.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gifts</h1>
        <p className="text-muted-foreground">Crie e gerencie códigos de presente para os usuários</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{disponiveis.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Gift className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-3xl font-bold text-accent mt-1">R$ {totalDisponivel.toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resgatados</p>
                <p className="text-3xl font-bold text-muted-foreground mt-1">{resgatados.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Criar Gift — coluna esquerda */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent" />
                Criar Gift
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor do Gift (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="Ex: 50.00"
                  value={newGift.value}
                  onChange={(e) => setNewGift({ ...newGift, value: e.target.value })}
                  className="bg-secondary border-border text-lg font-bold"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGift((p) => ({ ...p, quantity: String(Math.max(1, parseInt(p.quantity || "1") - 1)) }))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-lg font-bold hover:bg-muted transition-colors"
                  >−</button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="100"
                    value={newGift.quantity}
                    onChange={(e) => setNewGift({ ...newGift, quantity: e.target.value })}
                    className="bg-secondary border-border text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setNewGift((p) => ({ ...p, quantity: String(Math.min(100, parseInt(p.quantity || "1") + 1)) }))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-lg font-bold hover:bg-muted transition-colors"
                  >+</button>
                </div>
                <p className="text-xs text-muted-foreground">Máximo 100 por vez</p>
              </div>

              {/* Preview */}
              {newGift.value && Number(newGift.value) > 0 && (
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total a distribuir</p>
                  <p className="text-xl font-bold text-accent">
                    R$ {(Number(newGift.value) * parseInt(newGift.quantity || "1")).toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newGift.quantity}× de R$ {Number(newGift.value).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              )}

              <Button
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-11"
                onClick={handleCreate}
                disabled={creating || !newGift.value || Number(newGift.value) <= 0}
              >
                {creating ? "Gerando..." : createSuccess ? "✓ Gerado!" : `Gerar ${newGift.quantity || 1} Gift(s)`}
              </Button>

              {createSuccess && (
                <p className="text-center text-sm text-green-400 animate-pulse">
                  Gifts criados com sucesso!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Gifts — coluna direita */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Criado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usado por</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
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
                        <tr key={gift.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-secondary px-2 py-1 text-sm font-mono text-foreground">
                                {gift.code}
                              </code>
                              <button
                                onClick={() => handleCopy(gift.code)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copied === gift.code
                                  ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                  : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-accent">
                            R$ {gift.value.toFixed(2).replace(".", ",")}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              gift.status === "disponível"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-zinc-500/10 text-zinc-400"
                            }`}>
                              {gift.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(gift.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {gift.usedBy ? (
                              <div>
                                <p className="text-foreground">{gift.usedBy}</p>
                                {gift.usedAt && <p className="text-xs">{formatDate(gift.usedAt)}</p>}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {gift.status === "disponível" && (
                              <button
                                onClick={() => handleDelete(gift.id)}
                                className="text-muted-foreground hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
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
      </div>
    </div>
  )
}
