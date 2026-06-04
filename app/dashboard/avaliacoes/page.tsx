"use client"

import { useState, useEffect } from "react"
import { Star, ThumbsUp, MessageCircle, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  totalReviews: number
  avgRating: number
  withPhotos: number
  ratingCounts: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export default function AvaliacoesPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("recent")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // New review form state
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    productType: "Standard",
    price: "",
  })

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?filter=${filter}&sort=${sort}`)
      const data = await res.json()
      setReviews(data.reviews)
      setStats(data.stats)
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [filter, sort])

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) return

    setSubmitting(true)
    try {
      const session = localStorage.getItem("user_session")
      const userData = session ? JSON.parse(session) : {}
      const username = userData.user?.name || userData.name || "Usuário"

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          rating: newReview.rating,
          comment: newReview.comment,
          productType: newReview.productType,
          price: parseFloat(newReview.price) || 0,
        }),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setNewReview({ rating: 5, comment: "", productType: "Standard", price: "" })
        fetchReviews()
      }
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      })
      fetchReviews()
    } catch (error) {
      console.error("Erro ao marcar como útil:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "hoje"
    if (diffDays === 1) return "1d"
    if (diffDays < 30) return `${diffDays}d`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}m`
    return `${Math.floor(diffDays / 365)}a`
  }

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    }
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              star <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
            )}
          />
        ))}
      </div>
    )
  }

  const renderInteractiveStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setNewReview({ ...newReview, rating: star })}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                star <= newReview.rating 
                  ? "fill-amber-400 text-amber-400" 
                  : "fill-muted text-muted hover:fill-amber-400/50 hover:text-amber-400/50"
              )}
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Leave Review Button */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button className="bg-amber-500 text-black hover:bg-amber-400 font-medium">
            <Star className="mr-2 h-4 w-4" />
            Deixar Avaliação
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Deixar Avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Rating Stars */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sua avaliação</label>
              {renderInteractiveStars()}
            </div>

            {/* Product Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de produto</label>
              <Select
                value={newReview.productType}
                onValueChange={(value) => setNewReview({ ...newReview, productType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Black">Black</SelectItem>
                  <SelectItem value="Infinite">Infinite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor da compra (opcional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={newReview.price}
                  onChange={(e) => setNewReview({ ...newReview, price: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Seu comentário</label>
              <Textarea
                placeholder="Conte sua experiência..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitReview}
              disabled={submitting || !newReview.comment.trim()}
              className="w-full bg-amber-500 text-black hover:bg-amber-400"
            >
              {submitting ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Card */}
      {stats && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Avaliação Geral</h2>
          <div className="flex gap-8">
            {/* Left side - Average rating */}
            <div className="flex flex-col items-start">
              <span className="text-5xl font-bold">{stats.avgRating}</span>
              {renderStars(Math.round(stats.avgRating), "lg")}
              <span className="mt-2 text-sm text-muted-foreground">
                {stats.totalReviews} avaliações
              </span>
              <span className="text-sm text-muted-foreground">
                {stats.withPhotos} com fotos
              </span>
            </div>

            {/* Right side - Rating bars */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingCounts[rating as keyof typeof stats.ratingCounts]
                const percentage = stats.totalReviews > 0 
                  ? Math.round((count / stats.totalReviews) * 100) 
                  : 0
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="w-4 text-sm text-muted-foreground">{rating}</span>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm text-muted-foreground">{percentage}%</span>
                    <span className="w-8 text-right text-sm text-muted-foreground">({count})</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por:</span>
          {["all", "5", "4", "3", "2", "1"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-amber-500 text-black"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {f === "all" ? "Todas" : `${f}★`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordenar:</span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="helpful">Mais úteis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
            <Star className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma avaliação encontrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter !== "all" 
                ? "Não há avaliações com este filtro" 
                : "Seja o primeiro a deixar uma avaliação!"}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold uppercase">
                    {review.username.charAt(0)}
                  </div>

                  {/* User info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.username}</span>
                      {renderStars(review.rating, "sm")}
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(review.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CreditCard className="h-3 w-3" />
                      <span>{review.productType}</span>
                    </div>
                  </div>
                </div>

                {/* Price badge */}
                {review.price > 0 && (
                  <span className="rounded border border-accent px-2 py-1 text-sm font-medium text-accent">
                    R$ {review.price.toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>

              {/* Comment */}
              <p className="mt-3 text-sm">{review.comment}</p>

              {/* Image if exists */}
              {review.imageUrl && (
                <div className="mt-3">
                  <div className="h-24 w-32 rounded bg-secondary" />
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center gap-4">
                <button 
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Útil {review.helpful > 0 && `(${review.helpful})`}</span>
                </button>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
