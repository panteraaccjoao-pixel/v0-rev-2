"use client"

import { useState, useEffect, useRef } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Send, ArrowLeft, Clock, CheckCircle2, MessageSquare, Inbox, XCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Message {
  id: string
  senderId: string
  senderName: string
  senderType: "user" | "admin"
  content: string
  createdAt: string
}

interface Ticket {
  id: string
  userId: string
  username: string
  subject: string
  category: string
  status: "open" | "answered" | "closed"
  priority: "low" | "medium" | "high"
  messages: Message[]
  createdAt: string
  updatedAt: string
}

const categoryLabels: Record<string, string> = {
  general: "Dúvida Geral",
  order: "Problema com Pedido",
  payment: "Pagamento",
  account: "Conta",
  other: "Outro",
}

export default function AdminSuportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<"all" | "open" | "answered" | "closed">("all")
  const [search, setSearch] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTickets()
    // Poll for new tickets
    const interval = setInterval(fetchTickets, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedTicket?.messages])

  // Poll for new messages when viewing a ticket
  useEffect(() => {
    if (!selectedTicket) return

    const interval = setInterval(async () => {
      const res = await adminFetch("/api/tickets?admin=true")
      const data = await res.json()
      const updatedTicket = data.tickets.find((t: Ticket) => t.id === selectedTicket.id)
      if (updatedTicket && updatedTicket.messages.length !== selectedTicket.messages.length) {
        setSelectedTicket(updatedTicket)
        setTickets(data.tickets)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedTicket])

  const fetchTickets = async () => {
    try {
      const res = await adminFetch("/api/tickets?admin=true")
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return

    setSending(true)
    try {
      const res = await adminFetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          ticketId: selectedTicket.id,
          senderId: "admin",
          senderName: "Suporte",
          senderType: "admin",
          content: newMessage,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSelectedTicket(data.ticket)
        setTickets(tickets.map(t => t.id === data.ticket.id ? data.ticket : t))
        setNewMessage("")
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!selectedTicket) return

    try {
      const res = await adminFetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          ticketId: selectedTicket.id,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSelectedTicket(data.ticket)
        setTickets(tickets.map(t => t.id === data.ticket.id ? data.ticket : t))
      }
    } catch (error) {
      console.error("Error closing ticket:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "agora"
    if (diffMins < 60) return `${diffMins}min`
    if (diffHours < 24) return `${diffHours}h`
    return `${diffDays}d`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs text-yellow-500">
            <Clock className="h-3 w-3" /> Aguardando
          </span>
        )
      case "answered":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-500">
            <CheckCircle2 className="h-3 w-3" /> Respondido
          </span>
        )
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" /> Fechado
          </span>
        )
      default:
        return null
    }
  }

  const filteredTickets = tickets
    .filter(t => {
      if (filter === "all") return true
      return t.status === filter
    })
    .filter(t => {
      if (!search) return true
      const searchLower = search.toLowerCase()
      return (
        t.username.toLowerCase().includes(searchLower) ||
        t.subject.toLowerCase().includes(searchLower) ||
        t.id.toLowerCase().includes(searchLower)
      )
    })

  const openCount = tickets.filter(t => t.status === "open").length
  const answeredCount = tickets.filter(t => t.status === "answered").length
  const closedCount = tickets.filter(t => t.status === "closed").length

  // Ticket conversation view
  if (selectedTicket) {
    return (
      <div className="flex h-[calc(100vh-120px)] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTicket(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{selectedTicket.subject}</h1>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedTicket.id}</span>
                <span>•</span>
                <span>@{selectedTicket.username}</span>
                <span>•</span>
                <span>{categoryLabels[selectedTicket.category] || selectedTicket.category}</span>
              </div>
            </div>
          </div>
          {selectedTicket.status !== "closed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseTicket}
              className="gap-1 text-red-500 hover:text-red-600"
            >
              <XCircle className="h-4 w-4" />
              Fechar Ticket
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            {selectedTicket.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === "admin" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    message.senderType === "admin"
                      ? "bg-accent text-accent-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {message.senderType === "admin" ? "Suporte (você)" : message.senderName}
                    </span>
                    <span className="text-xs opacity-60">
                      {formatRelativeTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message input */}
        {selectedTicket.status !== "closed" && (
          <div className="border-t border-border pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua resposta..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {selectedTicket.status === "closed" && (
          <div className="border-t border-border pt-4">
            <p className="text-center text-sm text-muted-foreground">
              Este ticket foi encerrado
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">
          Atenda os chamados de suporte dos usuários
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{openCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Respondidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{answeredCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fechados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{closedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário, assunto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "open", "answered", "closed"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className={filter === status ? "bg-accent text-accent-foreground" : ""}
            >
              {status === "all" && "Todos"}
              {status === "open" && "Aguardando"}
              {status === "answered" && "Respondidos"}
              {status === "closed" && "Fechados"}
              {status === "open" && openCount > 0 && (
                <span className="ml-1 rounded-full bg-yellow-500 px-1.5 text-xs text-black">
                  {openCount}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Tickets List or Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-border bg-card">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Inbox className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mt-6 text-lg font-semibold">Sem tickets</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {filter === "all" && !search
              ? "Nenhum ticket de suporte no momento"
              : "Nenhum ticket encontrado com estes filtros"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-card/80"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    ticket.status === "open" ? "bg-yellow-500/10" : "bg-accent/10"
                  }`}>
                    <MessageSquare className={`h-5 w-5 ${
                      ticket.status === "open" ? "text-yellow-500" : "text-accent"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{ticket.subject}</h3>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      @{ticket.username} • {categoryLabels[ticket.category] || ticket.category}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {ticket.messages[ticket.messages.length - 1]?.content}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(ticket.updatedAt)}
                  </span>
                  {ticket.messages.length > 1 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.messages.length}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
