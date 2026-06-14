"use client"

import { useState, useEffect, useCallback } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Plus, Trash2, CreditCard, Loader2, RefreshCw, Eye, EyeOff } from "lucide-react"

interface Drop {
  id: string
  produto: string
  nivel: string
  bandeira: string
  preco: number
  quantidade: number
  criadoEm: string
  // dados do cartão
  numero: string | null
  titular: string | null
  validade: string | null
  cvv: string | null
  cpf: string | null
  banco: string | null
  limite: string | null
}

const bandeiras = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"]
const niveis = ["Classic", "Gold", "Platinum", "Black", "Infinite"]

const emptyForm = {
  produto: "",
  nivel: "Gold",
  bandeira: "Visa",
  preco: "",
  quantidade: "1",
  numero: "",
  titular: "",
  validade: "",
  cvv: "",
  cpf: "",
  banco: "",
  limite: "",
}

function maskCard(n: string) {
  const clean = n.replace(/\s/g, "")
  if (clean.length < 4) return n
  return "**** **** **** " + clean.slice(-4)
}

export default function DropsAdminPage() {
  const [drops, setDrops] = useState<Drop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [usersOnline, setUsersOnline] = useState(0)
  const [newDrop, setNewDrop] = useState(emptyForm)
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [revealedData, setRevealedData] = useState<Record<string, any>>({})
  const [success, setSuccess] = useState(false)

  const handleReveal = async (id: string) => {
    if (revealedId === id) {
      setRevealedId(null)
      return
    }
    try {
      const res = await adminFetch(`/api/drops/reveal?id=${id}`)
      if (res.ok) {
        const data = await res.json()
        setRevealedData((prev) => ({ ...prev, [id]: data }))
        setRevealedId(id)
      }
    } catch {}
  }

  const fetchDrops = useCallback(async () => {
    try {
      // Polling NÃO inclui dados de cartão — reveal é feito sob demanda pelo endpoint /reveal
      const res = await adminFetch("/api/drops?admin=1")
      if (res.ok) {
        const data = await res.json()
        setDrops(data.drops || [])
        setUsersOnline(data.usersOnline || 0)
      }
    } catch {}
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => {
    fetchDrops()
    const interval = setInterval(fetchDrops, 5000)
    return () => clearInterval(interval)
  }, [fetchDrops])

  const set = (k: string, v: string) => setNewDrop((p) => ({ ...p, [k]: v }))

  const handleCreateDrop = async () => {
    if (!newDrop.produto || !newDrop.preco) return
    setIsCreating(true)
    try {
      const res = await adminFetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDrop),
      })
      if (res.ok) {
        setNewDrop(emptyForm)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        fetchDrops()
      }
    } catch {}
    finally { setIsCreating(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/drops?id=${id}`, { method: "DELETE" })
      if (res.ok) setDrops((p) => p.filter((d) => d.id !== id))
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Drops</h1>
          <p className="text-sm text-muted-foreground">Adicione cartões para aparecerem em tempo real na página de drops</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-medium text-green-500">{usersOnline} online</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDrops}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-accent" /> Criar Novo Drop
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Dados do drop */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informações do Drop</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5 lg:col-span-2">
                <Label>Nome do Produto</Label>
                <Input placeholder="Ex: Black 700 Garantido" value={newDrop.produto} onChange={(e) => set("produto", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Nível</Label>
                <Select value={newDrop.nivel} onValueChange={(v) => set("nivel", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{niveis.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Bandeira</Label>
                <Select value={newDrop.bandeira} onValueChange={(v) => set("bandeira", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{bandeiras.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" placeholder="70.00" value={newDrop.preco} onChange={(e) => set("preco", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Input type="number" min="1" placeholder="1" value={newDrop.quantidade} onChange={(e) => set("quantidade", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Dados do cartão */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados do Cartão</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 lg:col-span-2">
                <Label>Número do Cartão</Label>
                <Input
                  placeholder="0000 0000 0000 0000"
                  value={newDrop.numero}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16)
                    set("numero", v.replace(/(.{4})/g, "$1 ").trim())
                  }}
                  className="font-mono tracking-widest"
                  maxLength={19}
                />
              </div>
              <div className="space-y-1.5">
                <Label>CVV</Label>
                <Input placeholder="000" value={newDrop.cvv} onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))} className="font-mono" maxLength={4} />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <Label>Titular</Label>
                <Input placeholder="NOME COMO NO CARTÃO" value={newDrop.titular} onChange={(e) => set("titular", e.target.value.toUpperCase())} className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Input
                  placeholder="MM/AA"
                  value={newDrop.validade}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4)
                    set("validade", v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v)
                  }}
                  className="font-mono"
                  maxLength={5}
                />
              </div>
              <div className="space-y-1.5">
                <Label>CPF do Titular</Label>
                <Input placeholder="000.000.000-00" value={newDrop.cpf} onChange={(e) => set("cpf", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Banco Emissor</Label>
                <Input placeholder="Ex: Itaú, Nubank..." value={newDrop.banco} onChange={(e) => set("banco", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Limite (R$)</Label>
                <Input type="number" step="0.01" placeholder="700.00" value={newDrop.limite} onChange={(e) => set("limite", e.target.value)} />
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateDrop}
            disabled={isCreating || !newDrop.produto || !newDrop.preco}
            className="gap-2 bg-accent text-white hover:bg-accent/90"
          >
            {isCreating ? <><Loader2 className="h-4 w-4 animate-spin" />Criando...</> : success ? "✓ Drop criado!" : <><Zap className="h-4 w-4" />Dropar Card</>}
          </Button>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-accent" /> Drops Ativos ({drops.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : drops.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Nenhum drop ativo no momento</div>
          ) : (
            <div className="space-y-3">
              {drops.map((drop) => {
                const revealed = revealedId === drop.id
                const card = revealedData[drop.id]
                return (
                  <div key={drop.id} className="rounded-lg border border-border bg-secondary/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                          <CreditCard className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold">{drop.produto}</p>
                          <p className="text-sm text-muted-foreground">{drop.bandeira} • {drop.nivel}</p>
                          {revealed && card ? (
                            <>
                              {card.numero && (
                                <p className="mt-1 font-mono text-sm text-foreground">
                                  {card.numero}
                                  {card.validade && <span className="ml-2 text-muted-foreground">{card.validade}</span>}
                                  {card.cvv && <span className="ml-2 text-muted-foreground">CVV {card.cvv}</span>}
                                </p>
                              )}
                              {card.titular && <p className="text-xs text-muted-foreground">{card.titular}</p>}
                              {card.banco && <p className="text-xs text-muted-foreground">{card.banco}{card.limite ? ` • Limite R$ ${Number(card.limite).toFixed(2).replace(".", ",")}` : ""}</p>}
                              {card.cpf && <p className="text-xs text-muted-foreground">CPF: {card.cpf}</p>}
                            </>
                          ) : (
                            <p className="mt-1 text-xs text-muted-foreground italic">Clique no olho para revelar dados do cartão</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-semibold text-accent">R$ {drop.preco.toFixed(2).replace(".", ",")}</p>
                          <p className="text-xs text-muted-foreground">{drop.quantidade} restante{drop.quantidade !== 1 ? "s" : ""}</p>
                        </div>
                        <button
                          onClick={() => handleReveal(drop.id)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          title={revealed ? "Ocultar" : "Revelar dados"}
                        >
                          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(drop.id)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
