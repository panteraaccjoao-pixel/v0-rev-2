"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Inbox, Send, ArrowLeft, Clock, CheckCircle2, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

const categories = [
  { value: "general", label: "Dúvida Geral" },
  { value: "order", label: "Problema com Pedido" },
  { value: "payment", label: "Pagamento" },
  { value: "account", label: "Conta" },
  { value: "other", label: "Outro" },
]

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<{ userId: string; name: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "general",
    message: "",
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    // Get user from session
    const session = localStorage.getItem("user_session")
    if (session) {
      const data = JSON.parse(session)
      const userData = data.user || data
      setUser({
        userId: userData.id || userData.email || "user-1",
        name: userData.name || "Usuario",
      })
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchTickets()
    }
  }, [user])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedTicket?.messages])

  // Poll for new messages when viewing a ticket
  useEffect(() => {
    if (!selectedTicket || !user) return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/tickets?userId=${user.userId}`)
      const data = await res.json()
      const updatedTicket = data.tickets.find((t: Ticket) => t.id === selectedTicket.id)
      if (updatedTicket && updatedTicket.messages.length !== selectedTicket.messages.length) {
        setSelectedTicket(updatedTicket)
        setTickets(data.tickets)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedTicket, user])

  const fetchTickets = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/tickets?userId=${user.userId}`)
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message || !user) return

    setCreating(true)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          userId: user.userId,
          username: user.name,
          subject: newTicket.subject,
          category: newTicket.category,
          message: newTicket.message,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTickets([data.ticket, ...tickets])
        setShowNewTicketModal(false)
        setNewTicket({ subject: "", category: "general", message: "" })
        setSelectedTicket(data.ticket)
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return

    setSending(true)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          ticketId: selectedTicket.id,
          senderId: user.userId,
          senderName: user.name,
          senderType: "user",
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
        return <span className="flex items-center gap-1 text-xs text-yellow-500"><Clock className="h-3 w-3" /> Aguardando</span>
      case "answered":
        return <span className="flex items-center gap-1 text-xs text-green-500"><CheckCircle2 className="h-3 w-3" /> Respondido</span>
      case "closed":
        return <span className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Fechado</span>
      default:
        return null
    }
  }

  const openTicketsCount = tickets.filter(t => t.status !== "closed").length

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
              <h1 className="text-lg font-semibold">{selectedTicket.subject}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{selectedTicket.id}</span>
                <span>•</span>
                {getStatusBadge(selectedTicket.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            {selectedTicket.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    message.senderType === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {message.senderType === "admin" ? "Suporte" : message.senderName}
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
                placeholder="Digite sua mensagem..."
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Tickets</h1>
          <p className="text-muted-foreground">
            {openTicketsCount === 0
              ? "Nenhum ticket aberto"
              : `${openTicketsCount} ticket${openTicketsCount > 1 ? "s" : ""} aberto${openTicketsCount > 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          onClick={() => setShowNewTicketModal(true)}
          variant="outline"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      {/* Tickets List or Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card">
            <Inbox className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="mt-6 text-lg font-semibold">Sem tickets</h3>
          <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
            Abra um ticket caso tenha algum problema com um pedido ou dúvida geral.
          </p>
          <Button
            onClick={() => setShowNewTicketModal(true)}
            variant="outline"
            className="mt-6 gap-2"
          >
            <Plus className="h-4 w-4" />
            Abrir Ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-card/80"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <MessageSquare className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium">{ticket.subject}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {ticket.messages[ticket.messages.length - 1]?.content}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(ticket.createdAt)}
                      </span>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Abrir Novo Ticket</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewTicketModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Assunto</label>
                <Input
                  placeholder="Descreva brevemente o problema"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Categoria</label>
                <Select
                  value={newTicket.category}
                  onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Mensagem</label>
                <Textarea
                  placeholder="Descreva seu problema ou dúvida em detalhes..."
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewTicketModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleCreateTicket}
                  disabled={!newTicket.subject || !newTicket.message || creating}
                >
                  {creating ? "Criando..." : "Criar Ticket"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
