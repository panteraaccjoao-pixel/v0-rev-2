import { NextRequest, NextResponse } from "next/server"

// In-memory storage for reviews (replace with database in production)
let reviews: Review[] = [
  {
    id: "1",
    username: "jvdoparque",
    rating: 5,
    comment: "funcionou",
    productType: "Standard",
    price: 17.00,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    helpful: 3,
    imageUrl: null,
  },
  {
    id: "2",
    username: "godsaveme",
    rating: 5,
    comment: "Bom p krai",
    productType: "Infinite",
    price: 40.00,
    createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    helpful: 5,
    imageUrl: null,
  },
  {
    id: "3",
    username: "Poncexy",
    rating: 5,
    comment: "Virada de saldo passou no pagbank na standard",
    productType: "Standard",
    price: 70.00,
    createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
    helpful: 8,
    imageUrl: "/placeholder-review.jpg",
  },
  {
    id: "4",
    username: "carlos_silva",
    rating: 5,
    comment: "Excelente! Funcionou perfeitamente",
    productType: "Black",
    price: 70.00,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    helpful: 2,
    imageUrl: null,
  },
  {
    id: "5",
    username: "maria_santos",
    rating: 3,
    comment: "Demorou um pouco mas funcionou",
    productType: "Gold",
    price: 25.00,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    helpful: 1,
    imageUrl: null,
  },
  {
    id: "6",
    username: "pedro_123",
    rating: 1,
    comment: "Não funcionou pra mim",
    productType: "Standard",
    price: 15.00,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    helpful: 0,
    imageUrl: null,
  },
]

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("filter")
  const sort = searchParams.get("sort") || "recent"

  let filteredReviews = [...reviews]

  if (filter && filter !== "all") {
    const rating = parseInt(filter)
    filteredReviews = filteredReviews.filter((r) => r.rating === rating)
  }

  if (sort === "recent") {
    filteredReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sort === "helpful") {
    filteredReviews.sort((a, b) => b.helpful - a.helpful)
  }

  const totalReviews = reviews.length
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0
  const withPhotos = reviews.filter((r) => r.imageUrl).length

  const ratingCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  }

  return NextResponse.json({
    reviews: filteredReviews,
    stats: {
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      withPhotos,
      ratingCounts,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, rating, comment, productType, price, imageUrl } = body

    if (!username || !rating || !comment || !productType) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Avaliação deve ser entre 1 e 5" }, { status: 400 })
    }

    const newReview: Review = {
      id: Date.now().toString(),
      username,
      rating,
      comment,
      productType,
      price: price || 0,
      createdAt: new Date().toISOString(),
      helpful: 0,
      imageUrl: imageUrl || null,
    }

    reviews.unshift(newReview)

    return NextResponse.json({ success: true, review: newReview })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Erro ao criar avaliação" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviewId } = body

    const review = reviews.find((r) => r.id === reviewId)
    if (review) {
      review.helpful += 1
      return NextResponse.json({ success: true, helpful: review.helpful })
    }

    return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
  }
}
