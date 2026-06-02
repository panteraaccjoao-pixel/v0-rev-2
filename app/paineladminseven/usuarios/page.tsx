"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  MoreHorizontal, 
  Eye,
  Edit,
  Ban,
  DollarSign,
  ShoppingCart
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
} from "@/components/ui/dialog"

// Dados de exemplo
const users = [
  { id: 1, name: "João Silva", email: "joao@email.com", balance: 150.00, purchases: 12, status: "ativo", createdAt: "01/01/2024" },
  { id: 2, name: "Maria Santos", email: "maria@email.com", balance: 85.50, purchases: 8, status: "ativo", createdAt: "05/01/2024" },
  { id: 3, name: "Pedro Costa", email: "pedro@email.com", balance: 0, purchases: 3, status: "banido", createdAt: "10/01/2024" },
  { id: 4, name: "Ana Oliveira", email: "ana@email.com", balance: 320.00, purchases: 25, status: "ativo", createdAt: "12/01/2024" },
  { id: 5, name: "Lucas Pereira", email: "lucas@email.com", balance: 45.00, purchases: 5, status: "ativo", createdAt: "15/01/2024" },
]

const recentPurchases = [
  { id: 1, product: "CC Platinum Santander", value: 45.00, date: "14/01/2024 15:30" },
  { id: 2, product: "CC Gold Itaú", value: 35.00, date: "14/01/2024 14:20" },
  { id: 3, product: "CC Black Nubank", value: 80.00, date: "13/01/2024 18:45" },
]

export default function UsuariosPage() {
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false)
  const [newBalance, setNewBalance] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleViewUser = (user: typeof users[0]) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const handleEditBalance = (user: typeof users[0]) => {
    setSelectedUser(user)
    setNewBalance(user.balance.toString())
    setIsEditBalanceOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie os usuários cadastrados na plataforma
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Usuários Cadastrados ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Saldo</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Compras</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Cadastro</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="py-4 text-sm font-medium">{user.name}</td>
                    <td className="py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-4 text-sm font-medium text-accent">
                      R$ {user.balance.toFixed(2)}
                    </td>
                    <td className="py-4 text-sm">{user.purchases}</td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          user.status === "ativo"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{user.createdAt}</td>
                    <td className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditBalance(user)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Alterar saldo
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500">
                            <Ban className="mr-2 h-4 w-4" />
                            {user.status === "ativo" ? "Banir usuário" : "Desbanir"}
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

      {/* View User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do usuário
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Saldo</Label>
                  <p className="font-medium text-accent">R$ {selectedUser.balance.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total de Compras</Label>
                  <p className="font-medium">{selectedUser.purchases}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Compras Recentes</h4>
                <div className="space-y-2">
                  {recentPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between rounded-lg bg-secondary p-3"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{purchase.product}</p>
                          <p className="text-xs text-muted-foreground">{purchase.date}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-accent">
                        R$ {purchase.value.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Balance Dialog */}
      <Dialog open={isEditBalanceOpen} onOpenChange={setIsEditBalanceOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Alterar Saldo</DialogTitle>
            <DialogDescription>
              Altere o saldo de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Novo saldo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="balance"
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>
            <Button className="w-full" onClick={() => setIsEditBalanceOpen(false)}>
              Salvar alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
