import { type NextRequest, NextResponse } from "next/server"
import { listReviews, addReview, markReviewHelpful } from "@/lib/repositories/reviews"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"
    const sort = searchParams.get("sort") || "recent"

    const { reviews, stats } = await listReviews(filter, sort)

    return NextResponse.json({ reviews, stats })
  } catch (error) {
    console.error("Error listing reviews:", error)
    return NextResponse.json({ error: "Erro ao buscar avaliações" }, { status: 500 })
  }
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

    const review = await addReview({
      username,
      rating,
      comment,
      productType,
      price: price || 0,
      imageUrl: imageUrl || null,
    })

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Erro ao criar avaliação" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviewId } = body

    const helpful = await markReviewHelpful(reviewId)
    if (helpful === null) {
      return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true, helpful })
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
  }
}
