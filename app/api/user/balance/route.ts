import { NextRequest, NextResponse } from "next/server"
import { users } from "@/app/api/users/route"

export function getUserBalance(email: string): number {
  const user = users.find(u => u.email === email)
  return user?.balance ?? 0
}

export function setUserBalance(email: string, balance: number): void {
  const user = users.find(u => u.email === email)
  if (user) {
    user.balance = balance
  }
}

export function deductBalance(email: string, amount: number): boolean {
  const user = users.find(u => u.email === email)
  if (user && user.balance >= amount) {
    user.balance -= amount
    return true
  }
  return false
}

export function addBalance(email: string, amount: number): void {
  const user = users.find(u => u.email === email)
  if (user) {
    user.balance += amount
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user email from cookie or header
    const userEmail = request.cookies.get("user_email")?.value || 
                      request.headers.get("x-user-email") || 
                      "teste@teste.com"
    
    const user = users.find(u => u.email === userEmail)
    const balance = user?.balance ?? 0
    
    return NextResponse.json({
      balance,
      email: userEmail,
      timestamp: new Date().toISOString()
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar saldo" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, amount, operation } = await request.json()
    
    if (!email || amount === undefined) {
      return NextResponse.json(
        { error: "Email e valor são obrigatórios" },
        { status: 400 }
      )
    }

    const user = users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    if (operation === "add") {
      user.balance += amount
    } else if (operation === "deduct") {
      if (user.balance < amount) {
        return NextResponse.json(
          { error: "Saldo insuficiente" },
          { status: 400 }
        )
      }
      user.balance -= amount
    } else if (operation === "set") {
      user.balance = amount
    }
    
    return NextResponse.json({
      success: true,
      balance: user.balance,
      email
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar saldo" },
      { status: 500 }
    )
  }
}
