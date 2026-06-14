"use client"

import { useState, useEffect, useCallback } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Star, ThumbsUp, ThumbsDown, RefreshCw, MessageSquare, Trash2, CreditCard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

interface Review {
  id: string
  username: string
  rating: number
  comment: string
  productType: string
  price: number
  createdAt: string
  helpful: number
  imageUrl: string | null
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
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    averageRating: 0,
    positivos: 0,
    negativos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    try {
      const res = await adminFetch("/api/reviews?sort=recent")
      if (res.ok) {
        const data = await res.json()
        const list: Review[] = data.reviews || []
        setReviews(list)
        const total = list.length
        const positivos = list.filter((r) => r.rating >= 4).length
        const negativos = list.filter((r) => r.rating < 4).length
        const averageRating = total > 0 ? list.reduce((s, r) => s + r.rating, 0) / total : 0
        setStats({ total, averageRating, positivos, negativos })
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()

    // Atualiza a cada 3 segundos (tempo real)
    const interval = setInterval(fetchReviews, 3000)
    return () => clearInterval(interval)
  }, [fetchReviews])

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta avaliação? Esta ação não pode ser desfeita.")) {
      return
    }
    setDeletingId(id)
    // Remoção otimista
    setReviews((prev) => prev.filter((r) => r.id !== id))
    try {
      const res = await adminFetch(`/api/reviews?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        // Reverte em caso de falha
        await fetchReviews()
      } else {
        await fetchReviews()
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      await fetchReviews()
    } finally {
      setDeletingId(null)
    }
  }

  const filteredReviews = reviews.filter(
    (review) =>
      review.username.toLowerCase().includes(search.toLowerCase()) ||
      review.productType.toLowerCase().includes(search.toLowerCase()) ||
      review.comment.toLowerCase().includes(search.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avaliações</h1>
          <p className="text-muted-foreground">Avaliações dos clientes sobre as compras</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReviews}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Avaliação Média
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Positivas</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Negativas</CardTitle>
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
            placeholder="Buscar por usuário, produto ou comentário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma avaliação encontrada</h3>
          <p className="text-sm text-muted-foreground">As avaliações aparecem aqui em tempo real</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{review.username}</p>
                      {renderStars(review.rating)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CreditCard className="h-3 w-3" />
                      <span>{review.productType}</span>
                      {review.price > 0 && (
                        <span className="ml-1">· R$ {review.price.toFixed(2).replace(".", ",")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</p>
                      <p className="text-sm text-muted-foreground">Útil: {review.helpful}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={deletingId === review.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteReview(review.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="mt-3 text-sm">{review.comment}</p>
                {review.imageUrl && (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={review.imageUrl || "/placeholder.svg"}
                      alt={`Foto da avaliação de ${review.username}`}
                      className="max-h-48 w-auto rounded-lg border border-border object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
