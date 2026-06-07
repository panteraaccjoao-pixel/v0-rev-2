import { NextRequest, NextResponse } from "next/server"
import store, { findProfileById, findProfileByEmail, type Profile } from "@/lib/data-store"
import { isAuthenticatedAdmin, isInternalRequest, unauthorizedResponse } from "@/lib/admin-auth"

interface UserView {
  id: string
  name: string
  email: string
  createdAt: string
  balance: number
  totalSpent: number
  purchases: number
  status: "active" | "blocked"
  discordId?: string
}

function mapProfile(p: Profile): UserView {
  return {
    id: p.id,
    name: p.name || "",
    email: p.email || "",
    createdAt: p.created_at,
    balance: Number(p.balance ?? 0),
    totalSpent: Number(p.total_spent ?? 0),
    purchases: Number(p.purchases ?? 0),
    status: p.status || "active",
    discordId: p.discord_id || "",
  }
}

// GET - lista todos os usuários (somente admin)
export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const users = store.profiles.map(mapProfile)
    return NextResponse.json({
      users,
      total: users.length,
      activeCount: users.filter((u) => u.status === "active").length,
    })
  } catch (error) {
    console.error("Error listing users:", error)
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 })
  }
}

// POST - gerencia usuários (atualizar saldo, compras, bloqueio, discord)
// Requer admin autenticado OU chamada interna (server-to-server).
export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdmin(request) && !isInternalRequest(request)) {
    return unauthorizedResponse()
  }
  try {
    const data = await request.json()

    const findProfile = () => {
      if (data.userId) return findProfileById(data.userId)
      if (data.email) return findProfileByEmail(data.email)
      return undefined
    }

    if (data.action === "update_balance") {
      const profile = findProfile()
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
      profile.balance = Number(profile.balance ?? 0) + (data.amount || 0)
      return NextResponse.json({ success: true, user: mapProfile(profile) })
    }

    if (data.action === "set_balance") {
      const profile = findProfile()
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
      profile.balance = data.balance || 0
      return NextResponse.json({ success: true, user: mapProfile(profile) })
    }

    if (data.action === "add_purchase") {
      const profile = findProfile()
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
      const amount = data.amount || 0
      profile.purchases = Number(profile.purchases ?? 0) + 1
      profile.total_spent = Number(profile.total_spent ?? 0) + amount
      profile.balance = Number(profile.balance ?? 0) - amount
      return NextResponse.json({ success: true, user: mapProfile(profile) })
    }

    if (data.action === "block" || data.action === "unblock") {
      if (!data.userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })
      const profile = findProfileById(data.userId)
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
      profile.status = data.action === "block" ? "blocked" : "active"
      return NextResponse.json({ success: true, user: mapProfile(profile) })
    }

    if (data.action === "set_discord") {
      const profile = findProfile()
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
      profile.discord_id = data.discordId || ""
      return NextResponse.json({ success: true, user: mapProfile(profile) })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error managing user:", error)
    return NextResponse.json({ error: "Failed to manage user" }, { status: 500 })
  }
}

// DELETE - remove um usuário (somente admin)
export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const index = store.profiles.findIndex((p) => p.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    store.profiles.splice(index, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
