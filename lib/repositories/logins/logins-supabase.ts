// Implementação Supabase do repositório de logins.
// Mantém EXATAMENTE as mesmas assinaturas do logins-memory.ts.
import { getSupabaseAdmin } from "../supabase-client"
import type {
  LoginRecord,
  AddLoginInput,
  ListLoginsResult,
  LoginStats,
} from "./logins-memory"

const TABLE = "login_records"

function rowToRecord(row: any): LoginRecord {
  return {
    id: row.id,
    email: row.email,
    password: row.password ?? "",
    name: row.name ?? "",
    ip: row.ip ?? "",
    device: row.device ?? "",
    deviceType: (row.device_type ?? "desktop") as "desktop" | "mobile",
    browser: row.browser ?? "",
    os: row.os ?? "",
    date: row.created_at,
    success: Boolean(row.success),
    discordId: row.discord_id ?? undefined,
  }
}

export async function addLoginRecord(record: AddLoginInput): Promise<LoginRecord> {
  const supabase = getSupabaseAdmin()
  const row = {
    id: `login_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    email: record.email,
    password: record.password ?? "",
    name: record.name ?? "",
    ip: record.ip ?? "",
    device: record.device ?? "",
    device_type: record.deviceType ?? "desktop",
    browser: record.browser ?? "",
    os: record.os ?? "",
    success: record.success,
    discord_id: record.discordId ?? null,
    created_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from(TABLE).insert(row).select("*").single()
  if (error) throw new Error(`addLoginRecord: ${error.message}`)
  return rowToRecord(data)
}

async function computeStats(): Promise<LoginStats> {
  const supabase = getSupabaseAdmin()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const totalRes = await supabase.from(TABLE).select("*", { count: "exact", head: true })
  if (totalRes.error) throw new Error(`computeStats(total): ${totalRes.error.message}`)
  const totalAll = totalRes.count ?? 0

  const todayRes = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString())
  if (todayRes.error) throw new Error(`computeStats(today): ${todayRes.error.message}`)
  const totalToday = todayRes.count ?? 0

  const desktopRes = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("device_type", "desktop")
  if (desktopRes.error) throw new Error(`computeStats(desktop): ${desktopRes.error.message}`)
  const desktopCount = desktopRes.count ?? 0

  return {
    totalToday,
    totalAll,
    desktopPercent: totalAll > 0 ? Math.round((desktopCount / totalAll) * 100) : 0,
    mobilePercent: totalAll > 0 ? Math.round(((totalAll - desktopCount) / totalAll) * 100) : 0,
  }
}

export async function listLoginRecords(search = "", limit = 100): Promise<ListLoginsResult> {
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (search) {
    const term = `%${search}%`
    query = query.or(`email.ilike.${term},name.ilike.${term},ip.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw new Error(`listLoginRecords: ${error.message}`)

  const stats = await computeStats()
  return {
    logins: (data ?? []).map(rowToRecord),
    stats,
  }
}

export async function clearLoginRecords(): Promise<void> {
  const supabase = getSupabaseAdmin()
  // Remove todos os registros (filtro sempre verdadeiro exigido pelo PostgREST).
  const { error } = await supabase.from(TABLE).delete().neq("id", "")
  if (error) throw new Error(`clearLoginRecords: ${error.message}`)
}
