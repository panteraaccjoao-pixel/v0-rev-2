"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Star, ThumbsUp, ThumbsDown, RefreshCw, MessageSquare, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface Feedback {
  id: string
  userId: string
  userName: string
  userEmail: string
  productId: string
  productName: string
  rating: number
  comment: string
  createdAt: string
}

interface Stats {
  total: number
  averageRating: number
  positivos: number
  negativos: number
}

const renderStars = (rating: number) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  )
}

export default function FeedbacksPage() {
  const [search, setSearch] = useState("")
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    averageRating: 0,
    positivos: 0,
    negativos: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await fetch("/api/feedbacks")
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(data.feedbacks || [])
        setStats(data.stats || {
          total: 0,
          averageRating: 0,
          positivos: 0,
          negativos: 0
        })
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeedbacks()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchFeedbacks, 3000)
    return () => clearInterval(interval)
  }, [fetchFeedbacks])

  const handleDeleteFeedback = async (id: string) => {
    try {
      const res = await fetch(`/api/feedbacks?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchFeedbacks()
    } catch (error) {
      console.error("Error deleting feedback:", error)
    }
  }

  const filteredFeedbacks = feedbacks.filter(
    (feedback) =>
      feedback.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      feedback.userName.toLowerCase().includes(search.toLowerCase()) ||
      feedback.productName.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedbacks</h1>
          <p className="text-muted-foreground">
            Avaliacoes dos clientes sobre as compras
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchFeedbacks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Avaliacao Media
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500 ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Avaliacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Positivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold text-green-500">{stats.positivos}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Negativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              <div className="text-2xl font-bold text-red-500">{stats.negativos}</div>
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

      {/* Feedbacks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Nenhum feedback encontrado</h3>
          <p className="text-sm text-muted-foreground">Os feedbacks aparecem aqui em tempo real</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{feedback.userName}</p>
                      {renderStars(feedback.rating)}
                    </div>
                    <p className="text-sm text-muted-foreground">{feedback.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatDate(feedback.createdAt)}</p>
                      <p className="text-sm text-accent">{feedback.productName}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem 
                          className="text-red-500"
                          onClick={() => handleDeleteFeedback(feedback.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="mt-3 text-sm">{feedback.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
