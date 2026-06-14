import { NextRequest, NextResponse } from "next/server"
import { listLoginRecords, clearLoginRecords } from "@/lib/repositories/logins"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"

// GET - Fetch all login records
export async function GET(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "200")

    const { logins, stats } = await listLoginRecords(search, limit)

    // Detectar IPs suspeitos: 2+ tentativas falhas
    const failedByIp: Record<string, { count: number; emails: string[]; lastSeen: string }> = {}
    for (const login of logins) {
      if (!login.success && login.ip && login.ip !== "Unknown") {
        if (!failedByIp[login.ip]) failedByIp[login.ip] = { count: 0, emails: [], lastSeen: login.date }
        failedByIp[login.ip].count++
        if (!failedByIp[login.ip].emails.includes(login.email)) {
          failedByIp[login.ip].emails.push(login.email)
        }
        if (login.date > failedByIp[login.ip].lastSeen) failedByIp[login.ip].lastSeen = login.date
      }
    }
    const suspiciousIPs = Object.entries(failedByIp)
      .filter(([, v]) => v.count >= 2)
      .map(([ip, v]) => ({ ip, ...v }))
      .sort((a, b) => b.count - a.count)

    const failedToday = logins.filter(l => {
      const today = new Date(); today.setHours(0,0,0,0)
      return !l.success && new Date(l.date) >= today
    }).length

    return NextResponse.json({ logins, stats: { ...stats, failedToday, suspiciousCount: suspiciousIPs.length }, suspiciousIPs })
  } catch (error) {
    console.error("Error fetching logins:", error)
    return NextResponse.json({ error: "Failed to fetch logins" }, { status: 500 })
  }
}

// DELETE - Clear all login records
export async function DELETE(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
  try {
    await clearLoginRecords()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing logins:", error)
    return NextResponse.json({ error: "Failed to clear logins" }, { status: 500 })
  }
}
