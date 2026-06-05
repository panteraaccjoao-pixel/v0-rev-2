import { NextRequest, NextResponse } from "next/server"

// In-memory storage for users (replace with database in production)
let users: User[] = [
  {
    id: "user_teste_001",
    name: "Conta Teste",
    email: "teste@teste.com",
    createdAt: new Date().toISOString(),
    balance: 0,
    totalSpent: 0,
    purchases: 0,
    status: "active"
  }
]

interface User {
  id: string
  name: string
  email: string
  createdAt: string
  balance: number
  totalSpent: number
  purchases: number
  status: "active" | "blocked"
}

// GET - List all users
export async function GET() {
  return NextResponse.json({
    users,
    total: users.length,
    activeCount: users.filter(u => u.status === "active").length
  })
}

// POST - Register or update user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (data.action === "register") {
      const existingUser = users.find(u => u.email === data.email)
      if (existingUser) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 })
      }

      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name || "",
        email: data.email || "",
        createdAt: new Date().toISOString(),
        balance: 0,
        totalSpent: 0,
        purchases: 0,
        status: "active"
      }

      users.push(newUser)
      return NextResponse.json({ success: true, user: newUser })
    }

    if (data.action === "update_balance") {
      const user = users.find(u => u.id === data.userId || u.email === data.email)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      user.balance += data.amount || 0
      return NextResponse.json({ success: true, user })
    }

    if (data.action === "set_balance") {
      const user = users.find(u => u.id === data.userId || u.email === data.email)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      user.balance = data.balance || 0
      return NextResponse.json({ success: true, user })
    }

    if (data.action === "add_purchase") {
      const user = users.find(u => u.id === data.userId || u.email === data.email)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      user.purchases += 1
      user.totalSpent += data.amount || 0
      user.balance -= data.amount || 0
      return NextResponse.json({ success: true, user })
    }

    if (data.action === "block") {
      const user = users.find(u => u.id === data.userId)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      user.status = "blocked"
      return NextResponse.json({ success: true, user })
    }

    if (data.action === "unblock") {
      const user = users.find(u => u.id === data.userId)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      user.status = "active"
      return NextResponse.json({ success: true, user })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error managing user:", error)
    return NextResponse.json({ error: "Failed to manage user" }, { status: 500 })
  }
}

// DELETE - Remove user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const index = users.findIndex(u => u.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    users.splice(index, 1)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

// Export for use in other routes
export { users }
