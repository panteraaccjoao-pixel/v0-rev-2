import { NextRequest, NextResponse } from "next/server"
import { listLoginRecords, clearLoginRecords } from "@/lib/repositories/logins"

// GET - Fetch all login records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "100")

    const { logins, stats } = await listLoginRecords(search, limit)

    return NextResponse.json({ logins, stats })
  } catch (error) {
    console.error("Error fetching logins:", error)
    return NextResponse.json({ error: "Failed to fetch logins" }, { status: 500 })
  }
}

// DELETE - Clear all login records
export async function DELETE() {
  try {
    await clearLoginRecords()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing logins:", error)
    return NextResponse.json({ error: "Failed to clear logins" }, { status: 500 })
  }
}
