import { NextResponse } from "next/server"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"

export async function GET(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("reviews")
      .select("id, username, rating, comment, product_type, price, created_at, helpful, image_url")
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) throw error

    const feedbacks = (data || []).map((r: any) => ({
      id: r.id,
      userId: "",
      userName: r.username,
      userEmail: "",
      productId: "",
      productName: r.product_type || "",
      rating: r.rating,
      comment: r.comment,
      helpful: r.helpful ?? 0,
      imageUrl: r.image_url ?? null,
      createdAt: r.created_at,
    }))

    const total = feedbacks.length
    const avgRating = total > 0 ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / total : 0
    const positivos = feedbacks.filter((f) => f.rating >= 4).length
    const negativos = feedbacks.filter((f) => f.rating < 4).length

    return NextResponse.json({
      feedbacks,
      stats: { total, averageRating: Math.round(avgRating * 10) / 10, positivos, negativos },
    })
  } catch (error) {
    console.error("[feedbacks GET]", error)
    return NextResponse.json({ feedbacks: [], stats: { total: 0, averageRating: 0, positivos: 0, negativos: 0 } })
  }
}

export async function DELETE(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })

  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from("reviews").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[feedbacks DELETE]", error)
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 })
  }
}
