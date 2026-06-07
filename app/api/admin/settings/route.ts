import { NextRequest, NextResponse } from "next/server"
import store from "@/lib/data-store"

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
    const settings = { ...DEFAULT_SETTINGS, ...(store.settings || {}) }
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

// POST - atualiza as configurações
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const merged = { ...DEFAULT_SETTINGS, ...(store.settings || {}), ...body }
    store.settings = merged

    return NextResponse.json({ success: true, settings: merged })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
