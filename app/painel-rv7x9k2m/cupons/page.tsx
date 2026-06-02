"use client"

import { useState } from "react"
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
  XCircle
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

// Dados de exemplo
const cupons = [
  { 
    id: 1, 
    code: "PROMO10", 
    discount: 10, 
    type: "percent",
    uses: 45,
    maxUses: 100,
    status: "ativo",
    expiry: "31/01/2024"
  },
  { 
    id: 2, 
    code: "BEMVINDO", 
    discount: 5, 
    type: "fixed",
    uses: 120,
    maxUses: null,
    status: "ativo",
    expiry: null
  },
  { 
    id: 3, 
    code: "BLACK50", 
    discount: 50, 
    type: "percent",
    uses: 200,
    maxUses: 200,
    status: "expirado",
    expiry: "30/11/2023"
  },
  { 
    id: 4, 
    code: "VIP20", 
    discount: 20, 
    type: "fixed",
    uses: 15,
    maxUses: 50,
    status: "ativo",
    expiry: "28/02/2024"
  },
]

export default function CuponsPage() {
  const [search, setSearch] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: "",
    type: "percent",
    maxUses: "",
    expiry: ""
  })
  const [copied, setCopied] = useState<string | null>(null)

  const filteredCupons = cupons.filter(
    (cupom) => cupom.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
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
                <Label htmlFor="code">Código do Cupom</Label>
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
                  <Label htmlFor="expiry">Data de Expiração</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={newCoupon.expiry}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <Button className="w-full" onClick={() => setIsAddDialogOpen(false)}>
                Criar Cupom
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cupons Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {cupons.filter(c => c.status === "ativo").length}
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
              {cupons.reduce((acc, c) => acc + c.uses, 0)}
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
              {cupons.filter(c => c.status === "expirado").length}
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

      {/* Cupons Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Cupons Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Código</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Desconto</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Usos</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Expira</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCupons.map((cupom) => (
                  <tr key={cupom.id} className="border-b border-border last:border-0">
                    <td className="py-4">
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
                    </td>
                    <td className="py-4 text-sm font-medium text-accent">
                      {cupom.type === "percent" ? `${cupom.discount}%` : `R$ ${cupom.discount}`}
                    </td>
                    <td className="py-4 text-sm">
                      {cupom.uses}/{cupom.maxUses || "∞"}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${
                          cupom.status === "ativo"
                            ? "bg-green-500/10 text-green-500"
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
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {cupom.expiry || "Sem limite"}
                    </td>
                    <td className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
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
