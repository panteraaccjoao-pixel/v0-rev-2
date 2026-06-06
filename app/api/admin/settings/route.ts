import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

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
    const admin = createAdminClient()
    const { data } = await admin
      .from("app_config")
      .select("value")
      .eq("key", "settings")
      .maybeSingle()

    const settings = { ...DEFAULT_SETTINGS, ...(data?.value || {}) }
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
    const admin = createAdminClient()

    const { data: existing } = await admin
      .from("app_config")
      .select("value")
      .eq("key", "settings")
      .maybeSingle()

    const merged = { ...DEFAULT_SETTINGS, ...(existing?.value || {}), ...body }

    await admin
      .from("app_config")
      .upsert({ key: "settings", value: merged, updated_at: new Date().toISOString() })

    return NextResponse.json({ success: true, settings: merged })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
