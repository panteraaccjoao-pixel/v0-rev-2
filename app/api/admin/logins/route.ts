import { NextRequest, NextResponse } from "next/server"

export interface LoginRecord {
  id: string
  email: string
  password: string
  name: string
  ip: string
  device: string
  deviceType: "desktop" | "mobile"
  browser: string
  os: string
  date: string
  success: boolean
}

// In-memory storage for login records
export const loginRecords: LoginRecord[] = []

// Helper to add login record (exported for use in auth route)
export function addLoginRecord(record: Omit<LoginRecord, "id" | "date">) {
  const newRecord: LoginRecord = {
    ...record,
    id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString()
  }
  
  // Add to beginning of array (newest first)
  loginRecords.unshift(newRecord)
  
  // Keep only last 1000 records
  if (loginRecords.length > 1000) {
    loginRecords.pop()
  }
  
  return newRecord
}

// GET - Fetch all login records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase() || ""
    const limit = parseInt(searchParams.get("limit") || "100")
    
    let filteredRecords = loginRecords
    
    if (search) {
      filteredRecords = loginRecords.filter(
        record => 
          record.email.toLowerCase().includes(search) ||
          record.name.toLowerCase().includes(search) ||
          record.ip.includes(search)
      )
    }
    
    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayLogins = loginRecords.filter(
      record => new Date(record.date) >= today
    )
    
    const desktopCount = loginRecords.filter(r => r.deviceType === "desktop").length
    const mobileCount = loginRecords.filter(r => r.deviceType === "mobile").length
    const total = loginRecords.length
    
    return NextResponse.json({
      logins: filteredRecords.slice(0, limit),
      stats: {
        totalToday: todayLogins.length,
        totalAll: total,
        desktopPercent: total > 0 ? Math.round((desktopCount / total) * 100) : 0,
        mobilePercent: total > 0 ? Math.round((mobileCount / total) * 100) : 0
      }
    })
  } catch (error) {
    console.error("Error fetching logins:", error)
    return NextResponse.json(
      { error: "Failed to fetch logins" },
      { status: 500 }
    )
  }
}

// DELETE - Clear all login records
export async function DELETE() {
  try {
    loginRecords.length = 0
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing logins:", error)
    return NextResponse.json(
      { error: "Failed to clear logins" },
      { status: 500 }
    )
  }
}
