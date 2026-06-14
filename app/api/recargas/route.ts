import { NextRequest, NextResponse } from "next/server"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"
import { getSupabaseAdmin } from "@/lib/repositories/supabase-client"
import { confirmPayment } from "@/app/api/pix/route"
import { findPixPayment } from "@/lib/repositories/pix"

// GET — Lista recargas (pix_payments com purpose=recharge) do Supabase.
export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("pix_payments")
      .select("id, user_id, user_email, user_name, amount, status, credited, created_at, expires_at")
      .eq("purpose", "recharge")
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) throw error

    const recharges = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id || "",
      userName: row.user_name || "Cliente",
      userEmail: row.user_email || "—",
      amount: Number(row.amount || 0),
      method: "pix",
      status: row.credited
        ? "approved"
        : row.status === "paid"
        ? "approved"
        : row.status === "expired"
        ? "rejected"
        : "pending",
      createdAt: row.created_at,
      approvedAt: row.credited ? row.created_at : undefined,
    }))

    const approved = recharges.filter((r) => r.status === "approved")
    const pending = recharges.filter((r) => r.status === "pending")

    return NextResponse.json({
      recharges,
      total: recharges.length,
      pendingCount: pending.length,
      approvedTotal: approved.reduce((sum, r) => sum + r.amount, 0),
    })
  } catch (err) {
    console.error("[recargas GET]", err)
    return NextResponse.json({ recharges: [], total: 0, pendingCount: 0, approvedTotal: 0 })
  }
}

// POST — Aprovar ou rejeitar recarga manualmente.
export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()

  try {
    const { action, rechargeId } = await request.json()

    if (!rechargeId) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 })
    }

    const payment = await findPixPayment(rechargeId)
    if (!payment) {
      return NextResponse.json({ error: "Recarga não encontrada" }, { status: 404 })
    }

    if (action === "approve") {
      if (payment.credited) {
        return NextResponse.json({ error: "Já creditado" }, { status: 400 })
      }
      await confirmPayment(payment)
      return NextResponse.json({ success: true })
    }

    if (action === "reject") {
      const supabase = getSupabaseAdmin()
      await supabase
        .from("pix_payments")
        .update({ status: "expired" })
        .eq("id", rechargeId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (err) {
    console.error("[recargas POST]", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
