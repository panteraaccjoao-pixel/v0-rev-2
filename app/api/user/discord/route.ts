import { NextRequest, NextResponse } from "next/server"

// In-memory storage for user discord links (replace with database in production)
const userDiscordLinks: Map<string, { discordId: string; discordUsername: string; linkedAt: string }> = new Map()

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id") || "anonymous"
  
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
    const body = await request.json()
    const { discordUsername, discordId: providedDiscordId } = body
    const userId = request.headers.get("x-user-id") || "anonymous"
    
    // If discordId is provided directly (from OAuth callback)
    if (providedDiscordId) {
      userDiscordLinks.set(userId, {
        discordId: providedDiscordId,
        discordUsername: discordUsername || `User#${providedDiscordId.substring(0, 4)}`,
        linkedAt: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: "Discord vinculado com sucesso",
        discordId: providedDiscordId,
        discordUsername: discordUsername || `User#${providedDiscordId.substring(0, 4)}`,
        linkedAt: new Date().toISOString()
      })
    }
    
    if (!discordUsername || discordUsername.trim() === "") {
      return NextResponse.json(
        { error: "Username do Discord é obrigatório" },
        { status: 400 }
      )
    }

    // Validate Discord username format (username or username#0000)
    const usernameRegex = /^.{2,32}(#\d{4})?$/
    if (!usernameRegex.test(discordUsername.trim())) {
      return NextResponse.json(
        { error: "Formato de username inválido" },
        { status: 400 }
      )
    }

    // Generate a mock Discord ID
    const discordId = Math.random().toString(36).substring(2, 20)
    
    userDiscordLinks.set(userId, {
      discordId,
      discordUsername: discordUsername.trim(),
      linkedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: "Discord vinculado com sucesso",
      discordId,
      discordUsername: discordUsername.trim(),
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
  const userId = request.headers.get("x-user-id") || "anonymous"
  
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
