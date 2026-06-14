import { type NextRequest, NextResponse } from "next/server"
import { listReviews, addReview, markReviewHelpful, deleteReview } from "@/lib/repositories/reviews"
import { requireUser, unauthorizedResponse } from "@/lib/user-auth"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

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
    const session = requireUser(request)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const { rating, comment, productType, price, imageUrl } = body

    if (!rating || !comment || !productType) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Avaliação deve ser entre 1 e 5" }, { status: 400 })
    }

    const review = await addReview({
      // Autor vem da sessão — ninguém posta avaliação em nome de outro.
      username: session.name || session.email,
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
    const session = requireUser(request)
    if (!session) return unauthorizedResponse()

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

// DELETE - remove uma avaliação. Restrito a admin autenticado.
export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get("id")
    if (!reviewId) {
      return NextResponse.json({ error: "ID da avaliação é obrigatório" }, { status: 400 })
    }

    const removed = await deleteReview(reviewId)
    if (!removed) {
      return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ error: "Erro ao remover avaliação" }, { status: 500 })
  }
}
