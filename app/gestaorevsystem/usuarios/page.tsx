"use client"

import { useState, useEffect, useCallback } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  MoreHorizontal, 
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  MessageCircle,
  CreditCard,
  Package,
  Copy,
  Check
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface User {
  id: string
  name: string
  email: string
  createdAt: string
  balance: number
  totalSpent: number
  purchases: number
  status: "active" | "blocked"
  discordId?: string
}

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
    holderName?: string
    cpf?: string
    birthDate?: string
  }
}

export default function UsuariosPage() {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false)
  const [newBalance, setNewBalance] = useState("")
  const [updating, setUpdating] = useState(false)
  const [userOrders, setUserOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fetchUserOrders = useCallback(async (user: User) => {
    setLoadingOrders(true)
    setUserOrders([])
    try {
      const params = new URLSearchParams()
      if (user.id) params.set("userId", user.id)
      if (user.email) params.set("email", user.email)
      const res = await adminFetch(`/api/pedidos?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUserOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Error fetching user orders:", error)
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
    fetchUserOrders(user)
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminFetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setTotalUsers(data.total || 0)
        setActiveCount(data.activeCount || 0)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchUsers, 3000)
    return () => clearInterval(interval)
  }, [fetchUsers])

  const handleBlockUser = async (userId: string) => {
    try {
      const res = await adminFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block", userId })
      })
      if (res.ok) fetchUsers()
    } catch (error) {
      console.error("Error blocking user:", error)
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      const res = await adminFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unblock", userId })
      })
      if (res.ok) fetchUsers()
    } catch (error) {
      console.error("Error unblocking user:", error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await adminFetch(`/api/users?id=${userId}`, { method: "DELETE" })
      if (res.ok) fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleUpdateBalance = async () => {
    if (!selectedUser) return
    setUpdating(true)
    try {
      const res = await adminFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "set_balance", 
          userId: selectedUser.id,
          balance: parseFloat(newBalance)
        })
      })
      if (res.ok) {
        fetchUsers()
        setIsEditBalanceOpen(false)
      }
    } catch (error) {
      console.error("Error updating balance:", error)
    } finally {
      setUpdating(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários cadastrados na plataforma
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Usuários
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500 ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              Usuários Bloqueados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalUsers - activeCount}</div>
          </CardContent>
        </Card>
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Nenhum usuário cadastrado</h3>
          <p className="text-sm text-muted-foreground">Os usuários aparecem aqui em tempo real quando se cadastram</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Usuário</TableHead>
                <TableHead>Discord ID</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Total Gasto</TableHead>
                <TableHead>Compras</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.discordId ? (
                      <div className="flex items-center gap-2 text-[#5865F2]">
                        <MessageCircle className="h-4 w-4" />
                        <span className="font-mono text-sm">{user.discordId}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-accent">
                    {formatCurrency(user.balance)}
                  </TableCell>
                  <TableCell>{formatCurrency(user.totalSpent)}</TableCell>
                  <TableCell>{user.purchases}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      user.status === "active" 
                        ? "bg-green-500/20 text-green-500" 
                        : "bg-red-500/20 text-red-500"
                    }`}>
                      {user.status === "active" ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <Ban className="h-3 w-3" />
                          Bloqueado
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user)
                          setNewBalance(user.balance.toString())
                          setIsEditBalanceOpen(true)
                        }}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Alterar saldo
                        </DropdownMenuItem>
                        {user.status === "active" ? (
                          <DropdownMenuItem 
                            className="text-yellow-500"
                            onClick={() => handleBlockUser(user.id)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Bloquear
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="text-green-500"
                            onClick={() => handleUnblockUser(user.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Desbloquear
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => handleDeleteUser(user.id)}
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

      {/* View User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas e histórico de pedidos
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
                  <p className="font-medium text-accent">{formatCurrency(selectedUser.balance)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Gasto</Label>
                  <p className="font-medium">{formatCurrency(selectedUser.totalSpent)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total de Compras</Label>
                  <p className="font-medium">{selectedUser.purchases}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Cadastro</Label>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {/* Histórico de pedidos e detalhes de entrega */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-t border-border pt-4">
                  <Package className="h-4 w-4 text-accent" />
                  <h4 className="font-semibold">Pedidos e Entregas</h4>
                  <span className="text-sm text-muted-foreground">
                    ({userOrders.length})
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Este usuário ainda não fez nenhum pedido
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-lg border border-border bg-secondary/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{order.product}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {order.oderId} · {formatDate(order.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-accent">
                              {formatCurrency(order.total)}
                            </p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              order.status === "entregue"
                                ? "bg-green-500/20 text-green-500"
                                : order.status === "pendente"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-red-500/20 text-red-500"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Dados da entrega (cartão) */}
                        {order.cardData ? (
                          <div className="mt-3 space-y-2 rounded-md border border-border bg-background p-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <CreditCard className="h-3.5 w-3.5" />
                              Dados entregues
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <DeliveryField
                                label="Número"
                                value={order.cardData.fullCard}
                                fieldId={`${order.id}-card`}
                                copiedField={copiedField}
                                onCopy={copyToClipboard}
                                mono
                              />
                              <DeliveryField
                                label="Validade"
                                value={order.cardData.expiry}
                                fieldId={`${order.id}-exp`}
                                copiedField={copiedField}
                                onCopy={copyToClipboard}
                                mono
                              />
                              <DeliveryField
                                label="CVV"
                                value={order.cardData.cvv}
                                fieldId={`${order.id}-cvv`}
                                copiedField={copiedField}
                                onCopy={copyToClipboard}
                                mono
                              />
                              <DeliveryField
                                label="BIN"
                                value={order.cardData.bin}
                                fieldId={`${order.id}-bin`}
                                copiedField={copiedField}
                                onCopy={copyToClipboard}
                                mono
                              />
                              {order.cardData.bank && (
                                <DeliveryField
                                  label="Banco"
                                  value={order.cardData.bank}
                                  fieldId={`${order.id}-bank`}
                                  copiedField={copiedField}
                                  onCopy={copyToClipboard}
                                />
                              )}
                              {order.cardData.holderName && (
                                <DeliveryField
                                  label="Titular"
                                  value={order.cardData.holderName}
                                  fieldId={`${order.id}-holder`}
                                  copiedField={copiedField}
                                  onCopy={copyToClipboard}
                                />
                              )}
                              {order.cardData.cpf && (
                                <DeliveryField
                                  label="CPF"
                                  value={order.cardData.cpf}
                                  fieldId={`${order.id}-cpf`}
                                  copiedField={copiedField}
                                  onCopy={copyToClipboard}
                                  mono
                                />
                              )}
                              {order.cardData.birthDate && (
                                <DeliveryField
                                  label="Nascimento"
                                  value={order.cardData.birthDate}
                                  fieldId={`${order.id}-birth`}
                                  copiedField={copiedField}
                                  onCopy={copyToClipboard}
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Sem dados de entrega registrados para este pedido.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
            <Button className="w-full" onClick={handleUpdateBalance} disabled={updating}>
              {updating ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DeliveryField({
  label,
  value,
  fieldId,
  copiedField,
  onCopy,
  mono,
}: {
  label: string
  value: string
  fieldId: string
  copiedField: string | null
  onCopy: (text: string, field: string) => void
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <button
        type="button"
        onClick={() => onCopy(value, fieldId)}
        className="flex items-center gap-1.5 text-left hover:text-accent transition-colors"
        title="Copiar"
      >
        <span className={mono ? "font-mono" : ""}>{value}</span>
        {copiedField === fieldId ? (
          <Check className="h-3 w-3 text-green-500 shrink-0" />
        ) : (
          <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>
    </div>
  )
}
