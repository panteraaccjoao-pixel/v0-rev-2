import { NextRequest, NextResponse } from "next/server"
import { getSettings, saveSettings } from "@/lib/repositories/settings"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"

const DEFAULT_SETTINGS = {
  discordAuthUrl: "",
  discordEnabled: true,
  discordServerUrl: "",
  siteName: "REV SYSTEM",
  maintenanceMode: false,
}

// GET - busca as configurações
export async function GET() {
  try {
    const settings = { ...DEFAULT_SETTINGS, ...((await getSettings()) || {}) }
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

// POST - atualiza as configurações (somente admin)
export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const body = await request.json()

    const merged = { ...DEFAULT_SETTINGS, ...((await getSettings()) || {}), ...body }
    await saveSettings(merged)

    return NextResponse.json({ success: true, settings: merged })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
