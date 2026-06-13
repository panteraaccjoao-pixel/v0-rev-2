"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Search, MessageCircle, CheckCircle, Clock, XCircle, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Dados de exemplo
const trocas = [
  { 
    id: 1, 
    user: "joao@email.com", 
    userName: "João Silva",
    product: "CC Platinum Santander",
    bin: "520132",
    reason: "Cartão não passou na compra, limite insuficiente",
    status: "aberto",
    date: "14/01/2024 15:30",
    messages: [
      { from: "user", text: "O cartão não passou, diz que tem limite insuficiente", time: "15:30" },
    ]
  },
  { 
    id: 2, 
    user: "maria@email.com", 
    userName: "Maria Santos",
    product: "CC Gold Itaú",
    bin: "450123",
    reason: "Cartão bloqueado pelo banco",
    status: "resolvido",
    date: "14/01/2024 14:20",
    messages: [
      { from: "user", text: "O cartão está bloqueado", time: "14:20" },
      { from: "admin", text: "Vou verificar e fazer a troca", time: "14:25" },
      { from: "admin", text: "Novo cartão enviado para seu email", time: "14:30" },
    ]
  },
  { 
    id: 3, 
    user: "pedro@email.com", 
    userName: "Pedro Costa",
    product: "CC Black Nubank",
    bin: "540721",
    reason: "Dados do cartão incorretos",
    status: "em_andamento",
    date: "14/01/2024 13:15",
    messages: [
      { from: "user", text: "Os dados do cartão estão errados", time: "13:15" },
      { from: "admin", text: "Poderia me enviar uma print do erro?", time: "13:20" },
    ]
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "resolvido":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "em_andamento":
      return <Clock className="h-4 w-4 text-yellow-500" />
    case "aberto":
      return <MessageCircle className="h-4 w-4 text-blue-500" />
    default:
      return null
  }
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "resolvido":
      return "bg-green-500/10 text-green-500"
    case "em_andamento":
      return "bg-yellow-500/10 text-yellow-500"
    case "aberto":
      return "bg-blue-500/10 text-blue-500"
    default:
      return ""
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "resolvido":
      return "Resolvido"
    case "em_andamento":
      return "Em andamento"
    case "aberto":
      return "Aberto"
    default:
      return status
  }
}

export default function TrocasPage() {
  const [search, setSearch] = useState("")
  const [selectedTroca, setSelectedTroca] = useState<typeof trocas[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")

  const filteredTrocas = trocas.filter(
    (troca) =>
      troca.user.toLowerCase().includes(search.toLowerCase()) ||
      troca.userName.toLowerCase().includes(search.toLowerCase()) ||
      troca.product.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trocas</h1>
        <p className="text-muted-foreground">
          Solicitações de troca de produtos
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {trocas.filter(t => t.status === "aberto").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {trocas.filter(t => t.status === "em_andamento").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolvidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {trocas.filter(t => t.status === "resolvido").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, nome ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Trocas Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Solicitações de Troca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Usuário</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Produto</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Motivo</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrocas.map((troca) => (
                  <tr key={troca.id} className="border-b border-border last:border-0">
                    <td className="py-4 text-sm text-muted-foreground">#{troca.id}</td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-medium">{troca.userName}</p>
                        <p className="text-xs text-muted-foreground">{troca.user}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-medium">{troca.product}</p>
                        <p className="text-xs text-muted-foreground">BIN: {troca.bin}</p>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground max-w-[200px] truncate">
                      {troca.reason}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(troca.status)}`}
                      >
                        {getStatusIcon(troca.status)}
                        {getStatusLabel(troca.status)}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{troca.date}</td>
                    <td className="py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedTroca(troca)
                          setIsDialogOpen(true)
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Chat Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Troca #{selectedTroca?.id}</DialogTitle>
            <DialogDescription>
              {selectedTroca?.userName} - {selectedTroca?.product}
            </DialogDescription>
          </DialogHeader>
          {selectedTroca && (
            <div className="space-y-4">
              {/* Reason */}
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground mb-1">Motivo da troca</p>
                <p className="text-sm">{selectedTroca.reason}</p>
              </div>

              {/* Messages */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {selectedTroca.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 max-w-[80%] ${
                        msg.from === "admin"
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-secondary border-border min-h-[60px]"
                />
                <Button className="px-3">
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1">
                  Marcar como Resolvido
                </Button>
                <Button variant="outline" className="flex-1">
                  Enviar Novo Cartão
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
