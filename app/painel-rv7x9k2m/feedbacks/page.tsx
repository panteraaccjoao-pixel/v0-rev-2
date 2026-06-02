"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Star, ThumbsUp, ThumbsDown } from "lucide-react"

// Dados de exemplo
const feedbacks = [
  { 
    id: 1, 
    user: "joao@email.com", 
    userName: "João Silva",
    product: "CC Platinum Santander",
    rating: 5,
    comment: "Cartão excelente, passou de primeira! Recomendo muito.",
    date: "14/01/2024 15:30"
  },
  { 
    id: 2, 
    user: "maria@email.com", 
    userName: "Maria Santos",
    product: "CC Gold Itaú",
    rating: 4,
    comment: "Funcionou bem, só demorou um pouco para aprovar.",
    date: "14/01/2024 14:20"
  },
  { 
    id: 3, 
    user: "pedro@email.com", 
    userName: "Pedro Costa",
    product: "CC Black Nubank",
    rating: 5,
    comment: "Perfeito! Melhor site que já usei.",
    date: "14/01/2024 13:15"
  },
  { 
    id: 4, 
    user: "ana@email.com", 
    userName: "Ana Oliveira",
    product: "CC Infinite Bradesco",
    rating: 3,
    comment: "Cartão ok, mas o limite era menor do que esperava.",
    date: "14/01/2024 12:00"
  },
  { 
    id: 5, 
    user: "lucas@email.com", 
    userName: "Lucas Pereira",
    product: "CC Platinum Santander",
    rating: 5,
    comment: "Sempre compro aqui, nunca tive problemas!",
    date: "13/01/2024 18:45"
  },
  { 
    id: 6, 
    user: "carla@email.com", 
    userName: "Carla Mendes",
    product: "CC Gold Itaú",
    rating: 4,
    comment: "Boa qualidade, entrega rápida.",
    date: "13/01/2024 17:30"
  },
]

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

  const filteredFeedbacks = feedbacks.filter(
    (feedback) =>
      feedback.user.toLowerCase().includes(search.toLowerCase()) ||
      feedback.userName.toLowerCase().includes(search.toLowerCase()) ||
      feedback.product.toLowerCase().includes(search.toLowerCase())
  )

  const averageRating = feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
  const positiveCount = feedbacks.filter(f => f.rating >= 4).length
  const negativeCount = feedbacks.filter(f => f.rating < 4).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedbacks</h1>
        <p className="text-muted-foreground">
          Avaliações dos clientes sobre as compras
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avaliação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbacks.length}</div>
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
              <div className="text-2xl font-bold text-green-500">{positiveCount}</div>
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
              <div className="text-2xl font-bold text-red-500">{negativeCount}</div>
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
                  <p className="text-sm text-muted-foreground">{feedback.user}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{feedback.date}</p>
                  <p className="text-sm text-accent">{feedback.product}</p>
                </div>
              </div>
              <p className="mt-3 text-sm">{feedback.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
