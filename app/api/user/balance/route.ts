import { NextRequest, NextResponse } from "next/server"

// In-memory user balances (replace with database in production)
const userBalances = new Map<string, number>()

// Initialize test user
userBalances.set("teste@teste.com", 999)

export function getUserBalance(email: string): number {
  return userBalances.get(email) ?? 0
}

export function setUserBalance(email: string, balance: number): void {
  userBalances.set(email, balance)
}

export function deductBalance(email: string, amount: number): boolean {
  const currentBalance = getUserBalance(email)
  if (currentBalance >= amount) {
    userBalances.set(email, currentBalance - amount)
    return true
  }
  return false
}

export function addBalance(email: string, amount: number): void {
  const currentBalance = getUserBalance(email)
  userBalances.set(email, currentBalance + amount)
}

export async function GET(request: NextRequest) {
  try {
    // Get user email from cookie or header
    const userEmail = request.cookies.get("user_email")?.value || 
                      request.headers.get("x-user-email") || 
                      "teste@teste.com"
    
    const balance = getUserBalance(userEmail)
    
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

    if (operation === "add") {
      addBalance(email, amount)
    } else if (operation === "deduct") {
      const success = deductBalance(email, amount)
      if (!success) {
        return NextResponse.json(
          { error: "Saldo insuficiente" },
          { status: 400 }
        )
      }
    } else if (operation === "set") {
      setUserBalance(email, amount)
    }

    const newBalance = getUserBalance(email)
    
    return NextResponse.json({
      success: true,
      balance: newBalance,
      email
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar saldo" },
      { status: 500 }
    )
  }
}
