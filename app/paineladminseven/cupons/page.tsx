"use client"

import { useState, useEffect, useCallback } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  RefreshCw,
  Ticket
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Cupom {
  id: string
  code: string
  discount: number
  type: "percent" | "fixed"
  uses: number
  maxUses: number | null
  status: "ativo" | "expirado" | "desativado"
  expiry: string | null
  createdAt: string
}

interface Stats {
  total: number
  ativos: number
  expirados: number
  totalUsos: number
}

export default function CuponsPage() {
  const [search, setSearch] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    ativos: 0,
    expirados: 0,
    totalUsos: 0
  })
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: "",
    type: "percent",
    maxUses: "",
    expiry: ""
  })
  const [copied, setCopied] = useState<string | null>(null)

  const fetchCupons = useCallback(async () => {
    try {
      const res = await adminFetch("/api/cupons")
      if (res.ok) {
        const data = await res.json()
        setCupons(data.cupons || [])
        setStats(data.stats || {
          total: 0,
          ativos: 0,
          expirados: 0,
          totalUsos: 0
        })
      }
    } catch (error) {
      console.error("Error fetching cupons:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCupons()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchCupons, 3000)
    return () => clearInterval(interval)
  }, [fetchCupons])

  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount) return
    
    setAdding(true)
    try {
      const res = await adminFetch("/api/cupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...newCoupon
        })
      })

      if (res.ok) {
        setIsAddDialogOpen(false)
        setNewCoupon({
          code: "",
          discount: "",
          type: "percent",
          maxUses: "",
          expiry: ""
        })
        fetchCupons()
      }
    } catch (error) {
      console.error("Error adding coupon:", error)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await adminFetch(`/api/cupons?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchCupons()
    } catch (error) {
      console.error("Error deleting coupon:", error)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await adminFetch("/api/cupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status", cupomId: id })
      })
      if (res.ok) fetchCupons()
    } catch (error) {
      console.error("Error toggling status:", error)
    }
  }

  const filteredCupons = cupons.filter(
    (cupom) => cupom.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Sem limite"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cupons</h1>
          <p className="text-muted-foreground">
            Gerencie os cupons de desconto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCupons}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cupom de desconto
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Codigo do Cupom</Label>
                  <Input
                    id="code"
                    placeholder="PROMO10"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount">Valor do Desconto</Label>
                    <Input
                      id="discount"
                      type="number"
                      placeholder="10"
                      value={newCoupon.discount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select 
                      value={newCoupon.type} 
                      onValueChange={(value) => setNewCoupon({ ...newCoupon, type: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="percent">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Limite de Usos</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      placeholder="100 (vazio = ilimitado)"
                      value={newCoupon.maxUses}
                      onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Data de Expiracao</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={newCoupon.expiry}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddCoupon} disabled={adding}>
                  {adding ? "Criando..." : "Criar Cupom"}
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
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Cupons Ativos
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500 ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.ativos}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Usos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsos}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expirados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.expirados}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por codigo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Cupons Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filteredCupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Nenhum cupom cadastrado</h3>
          <p className="text-sm text-muted-foreground">Clique em "Criar Cupom" para comecar</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Codigo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCupons.map((cupom) => (
                <TableRow key={cupom.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-secondary px-2 py-1 text-sm font-mono">
                        {cupom.code}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => handleCopy(cupom.code)}
                      >
                        {copied === cupom.code ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-accent">
                    {cupom.type === "percent" ? `${cupom.discount}%` : `R$ ${cupom.discount}`}
                  </TableCell>
                  <TableCell className="text-sm">
                    {cupom.uses}/{cupom.maxUses || "∞"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                        cupom.status === "ativo"
                          ? "bg-green-500/10 text-green-500"
                          : cupom.status === "desativado"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {cupom.status === "ativo" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {cupom.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(cupom.expiry)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => handleToggleStatus(cupom.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {cupom.status === "ativo" ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => handleDeleteCoupon(cupom.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
