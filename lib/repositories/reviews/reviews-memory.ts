// Implementação em memória do repositório de avaliações (reviews).
// Fallback usado quando o Supabase não está configurado.
// Sobrevive a hot-reload via globalThis.

export interface Review {
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

export interface AddReviewInput {
  username: string
  rating: number
  comment: string
  productType: string
  price?: number
  imageUrl?: string | null
}

export interface ReviewStats {
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

export interface ListReviewsResult {
  reviews: Review[]
  stats: ReviewStats
}

const globalForReviews = globalThis as unknown as {
  __reviews?: Review[]
}

const reviews: Review[] = globalForReviews.__reviews ?? (globalForReviews.__reviews = [])

function computeStats(all: Review[]): ReviewStats {
  const totalReviews = all.length
  const avgRating =
    totalReviews > 0 ? all.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0
  const withPhotos = all.filter((r) => r.imageUrl).length

  return {
    totalReviews,
    avgRating: Math.round(avgRating * 10) / 10,
    withPhotos,
    ratingCounts: {
      5: all.filter((r) => r.rating === 5).length,
      4: all.filter((r) => r.rating === 4).length,
      3: all.filter((r) => r.rating === 3).length,
      2: all.filter((r) => r.rating === 2).length,
      1: all.filter((r) => r.rating === 1).length,
    },
  }
}

export async function listReviews(
  filter = "all",
  sort = "recent",
): Promise<ListReviewsResult> {
  let filtered = [...reviews]

  if (filter && filter !== "all") {
    const rating = Number.parseInt(filter)
    filtered = filtered.filter((r) => r.rating === rating)
  }

  if (sort === "recent") {
    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  } else if (sort === "helpful") {
    filtered.sort((a, b) => b.helpful - a.helpful)
  }

  return {
    reviews: filtered,
    stats: computeStats(reviews),
  }
}

export async function addReview(input: AddReviewInput): Promise<Review> {
  const newReview: Review = {
    id: Date.now().toString(),
    username: input.username,
    rating: input.rating,
    comment: input.comment,
    productType: input.productType,
    price: input.price ?? 0,
    createdAt: new Date().toISOString(),
    helpful: 0,
    imageUrl: input.imageUrl ?? null,
  }
  reviews.unshift(newReview)
  return newReview
}

export async function markReviewHelpful(reviewId: string): Promise<number | null> {
  const review = reviews.find((r) => r.id === reviewId)
  if (!review) return null
  review.helpful += 1
  return review.helpful
}
