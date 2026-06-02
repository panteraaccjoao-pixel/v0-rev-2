import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { dbConfig, gatewayConfig } = await request.json()
    
    // Store config in cookies (encrypted in production)
    const cookieStore = await cookies()
    
    cookieStore.set("rev_db_config", JSON.stringify(dbConfig), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    
    cookieStore.set("rev_gateway_config", JSON.stringify(gatewayConfig), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving config:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const dbConfig = cookieStore.get("rev_db_config")?.value
    const gatewayConfig = cookieStore.get("rev_gateway_config")?.value
    
    return NextResponse.json({
      dbConfig: dbConfig ? JSON.parse(dbConfig) : null,
      gatewayConfig: gatewayConfig ? JSON.parse(gatewayConfig) : null,
    })
  } catch (error) {
    console.error("Error getting config:", error)
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 })
  }
}
