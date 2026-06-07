import { NextRequest, NextResponse } from "next/server"
import store, { findProfileByEmail } from "@/lib/data-store"
import { isAuthenticatedAdmin, isInternalRequest, unauthorizedResponse } from "@/lib/admin-auth"

// Helpers de saldo baseados no armazenamento local
export async function getUserBalance(email: string): Promise<number> {
  const profile = findProfileByEmail(email)
  return Number(profile?.balance ?? 0)
}

export async function setUserBalance(email: string, balance: number): Promise<void> {
  const profile = findProfileByEmail(email)
  if (profile) profile.balance = balance
}

export async function deductBalance(email: string, amount: number): Promise<boolean> {
  const profile = findProfileByEmail(email)
  if (!profile) return false
  if (Number(profile.balance ?? 0) < amount) return false
  profile.balance = Number(profile.balance ?? 0) - amount
  return true
}

export async function addBalance(email: string, amount: number): Promise<void> {
  const profile = findProfileByEmail(email)
  if (profile) profile.balance = Number(profile.balance ?? 0) + amount
}

// GET - retorna o saldo do usuário (email via query param)
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")?.toLowerCase()

    if (!email) {
      return NextResponse.json({ balance: 0, timestamp: new Date().toISOString() })
    }

    const profile = findProfileByEmail(email)

    return NextResponse.json({
      balance: Number(profile?.balance ?? 0),
      email,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: "Erro ao buscar saldo" }, { status: 500 })
  }
}

// POST - atualiza o saldo (operações: add, deduct, set)
// Restrito a admin autenticado ou chamada interna (server-to-server).
export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdmin(request) && !isInternalRequest(request)) {
    return unauthorizedResponse()
  }
  try {
    const { email, amount, operation } = await request.json()

    if (!email || amount === undefined) {
      return NextResponse.json({ error: "Email e valor são obrigatórios" }, { status: 400 })
    }

    const profile = findProfileByEmail(String(email).toLowerCase())

    if (!profile) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const current = Number(profile.balance ?? 0)
    let newBalance = current

    if (operation === "add") {
      newBalance = current + amount
    } else if (operation === "deduct") {
      if (current < amount) {
        return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })
      }
      newBalance = current - amount
    } else if (operation === "set") {
      newBalance = amount
    }

    profile.balance = newBalance

    return NextResponse.json({ success: true, balance: newBalance, email })
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar saldo" }, { status: 500 })
  }
}
