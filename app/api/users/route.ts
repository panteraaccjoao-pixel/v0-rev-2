import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

function mapProfile(p: any): UserView {
  return {
    id: p.id,
    name: p.name || "",
    email: p.email || "",
    createdAt: p.created_at,
    balance: Number(p.balance ?? 0),
    totalSpent: Number(p.total_spent ?? 0),
    purchases: Number(p.purchases ?? 0),
    status: (p.status as "active" | "blocked") || "active",
    discordId: p.discord_id || "",
  }
}

// GET - lista todos os usuários
export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    const users = (data || []).map(mapProfile)
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
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const admin = createAdminClient()

    const findProfile = async () => {
      const query = admin.from("profiles").select("*")
      if (data.userId) query.eq("id", data.userId)
      else if (data.email) query.eq("email", data.email)
      const { data: profile } = await query.maybeSingle()
      return profile
    }

    if (data.action === "update_balance") {
      const profile = await findProfile()
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
      const newBalance = Number(profile.balance ?? 0) + (data.amount || 0)
      const { data: updated } = await admin
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", profile.id)
        .select()
        .maybeSingle()
      return NextResponse.json({ success: true, user: mapProfile(updated) })
    }

    if (data.action === "set_balance") {
      const profile = await findProfile()
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
      const { data: updated } = await admin
        .from("profiles")
        .update({ balance: data.balance || 0 })
        .eq("id", profile.id)
        .select()
        .maybeSingle()
      return NextResponse.json({ success: true, user: mapProfile(updated) })
    }

    if (data.action === "add_purchase") {
      const profile = await findProfile()
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
      const amount = data.amount || 0
      const { data: updated } = await admin
        .from("profiles")
        .update({
          purchases: Number(profile.purchases ?? 0) + 1,
          total_spent: Number(profile.total_spent ?? 0) + amount,
          balance: Number(profile.balance ?? 0) - amount,
        })
        .eq("id", profile.id)
        .select()
        .maybeSingle()
      return NextResponse.json({ success: true, user: mapProfile(updated) })
    }

    if (data.action === "block" || data.action === "unblock") {
      if (!data.userId) return NextResponse.json({ error: "User ID required" }, { status: 400 })
      const { data: updated } = await admin
        .from("profiles")
        .update({ status: data.action === "block" ? "blocked" : "active" })
        .eq("id", data.userId)
        .select()
        .maybeSingle()
      if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 })
      return NextResponse.json({ success: true, user: mapProfile(updated) })
    }

    if (data.action === "set_discord") {
      const profile = await findProfile()
      if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 })
      const { data: updated } = await admin
        .from("profiles")
        .update({ discord_id: data.discordId || "" })
        .eq("id", profile.id)
        .select()
        .maybeSingle()
      return NextResponse.json({ success: true, user: mapProfile(updated) })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error managing user:", error)
    return NextResponse.json({ error: "Failed to manage user" }, { status: 500 })
  }
}

// DELETE - remove um usuário (auth + profile via cascade)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
