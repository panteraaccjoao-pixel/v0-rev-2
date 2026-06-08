import { NextRequest, NextResponse } from "next/server"
import { getInternalSecret } from "@/lib/repositories/admin-session"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"
import { requireUser } from "@/lib/user-auth"

// In-memory storage for recharges (replace with database in production)
let recharges: Recharge[] = []

interface Recharge {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  method: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  approvedAt?: string
  pixCode?: string
}

// GET - List recharges. Admin vê todas; usuário vê apenas as próprias.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const isAdmin = isAuthenticatedAdmin(request)

  let filteredRecharges = [...recharges]

  if (!isAdmin) {
    const session = requireUser(request)
    if (!session) return unauthorizedResponse()
    filteredRecharges = filteredRecharges.filter(r => r.userId === session.uid)
  }

  if (status) {
    filteredRecharges = filteredRecharges.filter(r => r.status === status)
  }

  // Sort by most recent first
  filteredRecharges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({
    recharges: filteredRecharges,
    total: filteredRecharges.length,
    pendingCount: recharges.filter(r => r.status === "pending").length,
    approvedTotal: recharges.filter(r => r.status === "approved").reduce((sum, r) => sum + r.amount, 0)
  })
}

// POST - Create or update recharge
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (data.action === "create") {
      // Identidade vem da sessão — nunca do corpo.
      const session = requireUser(request)
      if (!session) return unauthorizedResponse()

      const newRecharge: Recharge = {
        id: `recharge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.uid,
        userName: session.name || "",
        userEmail: session.email,
        amount: parseFloat(data.amount) || 0,
        method: data.method || "pix",
        status: "pending",
        createdAt: new Date().toISOString(),
        pixCode: data.pixCode || `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substr(2, 36)}`
      }

      recharges.push(newRecharge)
      return NextResponse.json({ success: true, recharge: newRecharge })
    }

    if (data.action === "approve") {
      if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
      const recharge = recharges.find(r => r.id === data.rechargeId)
      if (!recharge) {
        return NextResponse.json({ error: "Recharge not found" }, { status: 404 })
      }

      recharge.status = "approved"
      recharge.approvedAt = new Date().toISOString()

      // Update user balance via the users API (chamada interna autenticada)
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": getInternalSecret(),
        },
        body: JSON.stringify({
          action: "update_balance",
          userId: recharge.userId,
          amount: recharge.amount
        })
      })

      return NextResponse.json({ success: true, recharge })
    }

    if (data.action === "reject") {
      if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
      const recharge = recharges.find(r => r.id === data.rechargeId)
      if (!recharge) {
        return NextResponse.json({ error: "Recharge not found" }, { status: 404 })
      }

      recharge.status = "rejected"
      return NextResponse.json({ success: true, recharge })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error managing recharge:", error)
    return NextResponse.json({ error: "Failed to manage recharge" }, { status: 500 })
  }
}

// DELETE - Remove recharge (somente admin)
export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Recharge ID required" }, { status: 400 })
    }

    const index = recharges.findIndex(r => r.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Recharge not found" }, { status: 404 })
    }

    recharges.splice(index, 1)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting recharge:", error)
    return NextResponse.json({ error: "Failed to delete recharge" }, { status: 500 })
  }
}
