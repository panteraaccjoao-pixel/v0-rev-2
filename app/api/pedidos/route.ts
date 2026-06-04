import { NextRequest, NextResponse } from "next/server"

// In-memory storage for orders (replace with database in production)
export let orders: Order[] = []

export interface Order {
  id: string
  oderId: string
  userId: string
  userName: string
  product: string
  level: string
  brand: string
  quantity: number
  total: number
  date: string
  status: "entregue" | "expirado" | "reembolsado" | "pendente"
  cardData?: {
    fullCard: string
    cvv: string
    expiry: string
    bin: string
    bank: string
  }
}

// GET - List orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const userEmail = searchParams.get("email")

    let filteredOrders = orders

    // Filter by userId or email if provided
    if (userId) {
      filteredOrders = orders.filter(o => o.userId === userId)
    } else if (userEmail) {
      filteredOrders = orders.filter(o => o.userId === userEmail || o.userName.toLowerCase().includes(userEmail.toLowerCase()))
    }

    // Sort by date (newest first)
    filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      orders: filteredOrders,
      total: filteredOrders.length
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// POST - Create new order (called after purchase)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userName, product, level, brand, total, cardData } = body

    if (!userId || !product) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newOrder: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      oderId: `#${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      userId,
      userName: userName || "Cliente",
      product,
      level: level || "Standard",
      brand: brand || "visa",
      quantity: 1,
      total: total || 0,
      date: new Date().toISOString(),
      status: "entregue",
      cardData
    }

    orders.push(newOrder)

    return NextResponse.json({ 
      success: true, 
      order: newOrder 
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    const orderIndex = orders.findIndex(o => o.id === id)
    if (orderIndex === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (status) {
      orders[orderIndex].status = status
    }

    return NextResponse.json({ 
      success: true, 
      order: orders[orderIndex] 
    })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
