import { NextRequest, NextResponse } from "next/server"
import { getInternalSecret } from "@/lib/repositories/admin-session"
import { requireUser, unauthorizedResponse } from "@/lib/user-auth"

// In-memory storage for user discord links (replace with database in production)
const userDiscordLinks: Map<string, { discordId: string; discordUsername: string; linkedAt: string }> = new Map()

export async function GET(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return unauthorizedResponse()
  const userId = session.uid
  
  const discordData = userDiscordLinks.get(userId)
  
  if (!discordData) {
    return NextResponse.json({ linked: false })
  }
  
  return NextResponse.json({
    linked: true,
    discordId: discordData.discordId,
    discordUsername: discordData.discordUsername,
    linkedAt: discordData.linkedAt
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request)
    if (!session) return unauthorizedResponse()
    const userId = session.uid

    const body = await request.json()
    const { discordId } = body
    
    if (!discordId || discordId.trim() === "") {
      return NextResponse.json(
        { error: "ID do Discord é obrigatório" },
        { status: 400 }
      )
    }

    // Validate Discord ID format (should be a numeric string, 17-19 digits)
    const idRegex = /^\d{17,19}$/
    if (!idRegex.test(discordId.trim())) {
      return NextResponse.json(
        { error: "ID do Discord inválido. O ID deve ter entre 17 e 19 dígitos numéricos." },
        { status: 400 }
      )
    }
    
    userDiscordLinks.set(userId, {
      discordId: discordId.trim(),
      discordUsername: "",
      linkedAt: new Date().toISOString()
    })

    // Also update the user record with the discord ID (chamada interna autenticada)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": getInternalSecret(),
        },
        body: JSON.stringify({ 
          action: "set_discord", 
          email: session.email,
          discordId: discordId.trim()
        })
      })
    } catch (e) {
      console.error("Failed to update user discord:", e)
    }

    return NextResponse.json({
      success: true,
      message: "Discord vinculado com sucesso",
      discordId: discordId.trim(),
      linkedAt: new Date().toISOString()
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao vincular Discord" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const session = requireUser(request)
  if (!session) return unauthorizedResponse()
  const userId = session.uid
  
  if (!userDiscordLinks.has(userId)) {
    return NextResponse.json(
      { error: "Nenhum Discord vinculado" },
      { status: 404 }
    )
  }
  
  userDiscordLinks.delete(userId)
  
  return NextResponse.json({
    success: true,
    message: "Discord desvinculado com sucesso"
  })
}
