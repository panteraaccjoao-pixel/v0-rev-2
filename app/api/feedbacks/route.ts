import { NextResponse } from "next/server"

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

// In-memory storage for feedbacks
const feedbacks: Feedback[] = []

export async function GET() {
  const totalRating = feedbacks.reduce((acc, f) => acc + f.rating, 0)
  const averageRating = feedbacks.length > 0 ? totalRating / feedbacks.length : 0
  const positivos = feedbacks.filter(f => f.rating >= 4).length
  const negativos = feedbacks.filter(f => f.rating < 4).length

  return NextResponse.json({
    feedbacks: feedbacks.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    stats: {
      total: feedbacks.length,
      averageRating,
      positivos,
      negativos
    }
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === "create") {
      const newFeedback: Feedback = {
        id: `feedback_${Date.now()}`,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        productId: data.productId,
        productName: data.productName,
        rating: data.rating,
        comment: data.comment,
        createdAt: new Date().toISOString()
      }
      feedbacks.push(newFeedback)
      return NextResponse.json({ success: true, feedback: newFeedback })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing feedback:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  const index = feedbacks.findIndex(f => f.id === id)
  if (index === -1) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
  }

  feedbacks.splice(index, 1)
  return NextResponse.json({ success: true })
}
