import { NextRequest, NextResponse } from "next/server"
import {
  getUserByEmail,
  setBalance as setBalanceById,
  addBalance as addBalanceById,
} from "@/lib/repositories/users"
import { isAuthenticatedAdmin, isInternalRequest, unauthorizedResponse } from "@/lib/admin-auth"
import { requireUser } from "@/lib/user-auth"

// Helpers de saldo (por email) — reimplementados sobre o repositório de usuários.
export async function getUserBalance(email: string): Promise<number> {
  const profile = await getUserByEmail(email)
  return Number(profile?.balance ?? 0)
}

export async function setUserBalance(email: string, balance: number): Promise<void> {
  const profile = await getUserByEmail(email)
  if (profile) await setBalanceById(profile.id, balance)
}

export async function deductBalance(email: string, amount: number): Promise<boolean> {
  const profile = await getUserByEmail(email)
  if (!profile) return false
  if (Number(profile.balance ?? 0) < amount) return false
  await addBalanceById(profile.id, -amount)
  return true
}

export async function addBalance(email: string, amount: number): Promise<void> {
  const profile = await getUserByEmail(email)
  if (profile) await addBalanceById(profile.id, amount)
}

// GET - retorna o saldo do PRÓPRIO usuário autenticado.
// A identidade vem da sessão (não de query param), então ninguém consegue
// ler o saldo de outra conta trocando o e-mail na URL.
export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request)
    if (!session) {
      return unauthorizedResponse()
    }

    const profile = await getUserByEmail(session.email.toLowerCase())

    return NextResponse.json({
      balance: Number(profile?.balance ?? 0),
      email: session.email,
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

    const profile = await getUserByEmail(String(email).toLowerCase())

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

    await setBalanceById(profile.id, newBalance)

    return NextResponse.json({ success: true, balance: newBalance, email })
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar saldo" }, { status: 500 })
  }
}
