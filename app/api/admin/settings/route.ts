import { NextRequest, NextResponse } from "next/server"

// In-memory settings storage (replace with database in production)
let adminSettings = {
  discordAuthUrl: "",
  discordEnabled: true,
  discordServerUrl: "",
  siteName: "REV SYSTEM",
  maintenanceMode: false
}

// GET - Fetch settings
export async function GET() {
  return NextResponse.json(adminSettings)
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    adminSettings = {
      ...adminSettings,
      ...body
    }

    return NextResponse.json({ success: true, settings: adminSettings })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
