"use client"

import { useState, useEffect } from "react"
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
import { Zap, Plus, Trash2, CreditCard, Loader2, RefreshCw } from "lucide-react"

interface Drop {
  id: string
  produto: string
  nivel: string
  bandeira: string
  preco: number
  quantidade: number
  criadoEm: string
}

const bandeiras = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"]
const niveis = ["Classic", "Gold", "Platinum", "Black", "Infinite"]

export default function DropsAdminPage() {
  const [drops, setDrops] = useState<Drop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [usersOnline, setUsersOnline] = useState(0)
  
  const [newDrop, setNewDrop] = useState({
    produto: "",
    nivel: "Gold",
    bandeira: "Visa",
    preco: "",
    quantidade: "1",
  })

  const fetchDrops = async () => {
    try {
      const res = await adminFetch("/api/drops")
      if (res.ok) {
        const data = await res.json()
        setDrops(data.drops || [])
        setUsersOnline(data.usersOnline || 0)
      }
    } catch (error) {
      console.error("Erro ao buscar drops:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDrops()
    // Poll every 5 seconds
    const interval = setInterval(fetchDrops, 5000)
    return () => clearInterval(interval)
  }, [])

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
        setNewDrop({
          produto: "",
          nivel: "Gold",
          bandeira: "Visa",
          preco: "",
          quantidade: "1",
        })
        fetchDrops()
      }
    } catch (error) {
      console.error("Erro ao criar drop:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteDrop = async (dropId: string) => {
    try {
      const res = await adminFetch(`/api/drops?id=${dropId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchDrops()
      }
    } catch (error) {
      console.error("Erro ao deletar drop:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Drops</h1>
          <p className="text-sm text-muted-foreground">
            Adicione cards para aparecerem em tempo real na página de drops
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-green-500">
              {usersOnline} online
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDrops}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Create Drop Form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Plus className="h-5 w-5 text-accent" />
          Criar Novo Drop
        </h2>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="produto">Nome do Produto</Label>
            <Input
              id="produto"
              placeholder="Ex: Black - 700 Garantido"
              value={newDrop.produto}
              onChange={(e) => setNewDrop({ ...newDrop, produto: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nivel">Nível</Label>
            <Select
              value={newDrop.nivel}
              onValueChange={(value) => setNewDrop({ ...newDrop, nivel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {niveis.map((nivel) => (
                  <SelectItem key={nivel} value={nivel}>
                    {nivel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bandeira">Bandeira</Label>
            <Select
              value={newDrop.bandeira}
              onValueChange={(value) => setNewDrop({ ...newDrop, bandeira: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bandeiras.map((bandeira) => (
                  <SelectItem key={bandeira} value={bandeira}>
                    {bandeira}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco">Preço (R$)</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              placeholder="70.00"
              value={newDrop.preco}
              onChange={(e) => setNewDrop({ ...newDrop, preco: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              placeholder="1"
              value={newDrop.quantidade}
              onChange={(e) => setNewDrop({ ...newDrop, quantidade: e.target.value })}
            />
          </div>
        </div>

        <Button
          onClick={handleCreateDrop}
          disabled={isCreating || !newDrop.produto || !newDrop.preco}
          className="mt-4 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Dropar Card
            </>
          )}
        </Button>
      </div>

      {/* Active Drops */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Zap className="h-5 w-5 text-accent" />
          Drops Ativos ({drops.length})
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : drops.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum drop ativo no momento
          </div>
        ) : (
          <div className="space-y-3">
            {drops.map((drop) => (
              <div
                key={drop.id}
                className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <CreditCard className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{drop.produto}</p>
                    <p className="text-sm text-muted-foreground">
                      {drop.bandeira} • {drop.nivel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold text-accent">
                      R$ {drop.preco.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {drop.quantidade} restante{drop.quantidade > 1 ? "s" : ""}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDrop(drop.id)}
                    className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
