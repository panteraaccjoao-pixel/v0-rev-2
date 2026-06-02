"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Search, MessageCircle, CheckCircle, Clock, Send, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Dados de exemplo
const tickets = [
  { 
    id: 1, 
    user: "joao@email.com", 
    userName: "João Silva",
    subject: "Dúvida sobre pagamento",
    status: "aberto",
    date: "14/01/2024 15:30",
    messages: [
      { from: "user", text: "Olá, fiz uma recarga mas ainda não caiu o saldo, pode verificar?", time: "15:30" },
    ]
  },
  { 
    id: 2, 
    user: "maria@email.com", 
    userName: "Maria Santos",
    subject: "Problema com cartão",
    status: "resolvido",
    date: "14/01/2024 14:20",
    messages: [
      { from: "user", text: "O cartão que comprei não está funcionando", time: "14:20" },
      { from: "admin", text: "Olá Maria! Vou verificar para você.", time: "14:25" },
      { from: "admin", text: "Já enviei um novo cartão para seu email.", time: "14:30" },
      { from: "user", text: "Recebi! Obrigada pelo suporte rápido!", time: "14:35" },
    ]
  },
  { 
    id: 3, 
    user: "pedro@email.com", 
    userName: "Pedro Costa",
    subject: "Como funciona a entrega?",
    status: "em_andamento",
    date: "14/01/2024 13:15",
    messages: [
      { from: "user", text: "Queria entender melhor como funciona a entrega dos cartões", time: "13:15" },
      { from: "admin", text: "Olá Pedro! Os cartões são entregues automaticamente após a confirmação do pagamento.", time: "13:20" },
      { from: "user", text: "E quanto tempo demora para confirmar?", time: "13:25" },
    ]
  },
  { 
    id: 4, 
    user: "ana@email.com", 
    userName: "Ana Oliveira",
    subject: "Solicitar reembolso",
    status: "aberto",
    date: "14/01/2024 12:00",
    messages: [
      { from: "user", text: "Gostaria de solicitar reembolso da minha última compra", time: "12:00" },
    ]
  },
]

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

export default function SuportePage() {
  const [search, setSearch] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<typeof tickets[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.user.toLowerCase().includes(search.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(search.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(search.toLowerCase())
  )

  const openTickets = tickets.filter(t => t.status === "aberto").length
  const inProgressTickets = tickets.filter(t => t.status === "em_andamento").length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suporte</h1>
        <p className="text-muted-foreground">
          Atenda os chamados de suporte dos usuários
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tickets Abertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{openTickets}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{inProgressTickets}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolvidos Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {tickets.filter(t => t.status === "resolvido").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, nome ou assunto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Tickets Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Tickets de Suporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Usuário</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Assunto</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border last:border-0">
                    <td className="py-4 text-sm text-muted-foreground">#{ticket.id}</td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm font-medium">{ticket.userName}</p>
                        <p className="text-xs text-muted-foreground">{ticket.user}</p>
                      </div>
                    </td>
                    <td className="py-4 text-sm">{ticket.subject}</td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(ticket.status)}`}
                      >
                        {ticket.status === "resolvido" && <CheckCircle className="h-3 w-3" />}
                        {ticket.status === "em_andamento" && <Clock className="h-3 w-3" />}
                        {ticket.status === "aberto" && <MessageCircle className="h-3 w-3" />}
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{ticket.date}</td>
                    <td className="py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket)
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
            <DialogTitle>Ticket #{selectedTicket?.id}</DialogTitle>
            <DialogDescription>
              {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{selectedTicket.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedTicket.user}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {selectedTicket.messages.map((msg, i) => (
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
              {selectedTicket.status !== "resolvido" && (
                <Button variant="secondary" className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como Resolvido
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
