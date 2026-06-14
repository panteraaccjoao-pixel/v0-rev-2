// Implementação Supabase do repositório de avaliações (reviews).
// Mantém EXATAMENTE as mesmas assinaturas do reviews-memory.ts.
import { getSupabaseAdmin } from "../supabase-client"
import type {
  Review,
  AddReviewInput,
  ListReviewsResult,
  ReviewStats,
} from "./reviews-memory"

const TABLE = "reviews"

function rowToReview(row: any): Review {
  return {
    id: row.id,
    username: row.username,
    rating: row.rating,
    comment: row.comment,
    productType: row.product_type,
    price: typeof row.price === "string" ? Number.parseFloat(row.price) : (row.price ?? 0),
    createdAt: row.created_at,
    helpful: row.helpful ?? 0,
    imageUrl: row.image_url ?? null,
  }
}

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
  const supabase = getSupabaseAdmin()

  // Busca todos para calcular as estatísticas globais.
  const { data: allData, error: allError } = await supabase
    .from(TABLE)
    .select("*")
  if (allError) throw new Error(`listReviews(stats): ${allError.message}`)
  const allReviews = (allData ?? []).map(rowToReview)

  // Busca filtrada/ordenada para exibição.
  let query = supabase.from(TABLE).select("*")

  if (filter && filter !== "all") {
    query = query.eq("rating", Number.parseInt(filter))
  }

  if (sort === "helpful") {
    query = query.order("helpful", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { data, error } = await query
  if (error) throw new Error(`listReviews: ${error.message}`)

  return {
    reviews: (data ?? []).map(rowToReview),
    stats: computeStats(allReviews),
  }
}

export async function addReview(input: AddReviewInput): Promise<Review> {
  const supabase = getSupabaseAdmin()
  const row = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    username: input.username,
    rating: input.rating,
    comment: input.comment,
    product_type: input.productType,
    price: input.price ?? 0,
    helpful: 0,
    image_url: input.imageUrl ?? null,
    created_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from(TABLE).insert(row).select("*").single()
  if (error) throw new Error(`addReview: ${error.message}`)
  return rowToReview(data)
}

export async function markReviewHelpful(reviewId: string): Promise<number | null> {
  const supabase = getSupabaseAdmin()

  const { data: current, error: getError } = await supabase
    .from(TABLE)
    .select("helpful")
    .eq("id", reviewId)
    .maybeSingle()
  if (getError) throw new Error(`markReviewHelpful(get): ${getError.message}`)
  if (!current) return null

  const newHelpful = (current.helpful ?? 0) + 1
  const { error: updateError } = await supabase
    .from(TABLE)
    .update({ helpful: newHelpful })
    .eq("id", reviewId)
  if (updateError) throw new Error(`markReviewHelpful(update): ${updateError.message}`)

  return newHelpful
}

// Remove uma avaliação pelo id (ação de admin). Retorna true se removeu.
export async function deleteReview(reviewId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", reviewId)
    .select("id")
  if (error) throw new Error(`deleteReview: ${error.message}`)
  return (data?.length ?? 0) > 0
}
