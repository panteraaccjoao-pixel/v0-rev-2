// Implementação em memória do repositório de logins.
// Mantém o comportamento atual (histórico volátil) como fallback quando o
// Supabase não está configurado.

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
  discordId?: string
}

export interface AddLoginInput {
  email: string
  password: string
  name: string
  ip: string
  device: string
  deviceType: "desktop" | "mobile"
  browser: string
  os: string
  success: boolean
  discordId?: string
}

export interface LoginStats {
  totalToday: number
  totalAll: number
  desktopPercent: number
  mobilePercent: number
}

export interface ListLoginsResult {
  logins: LoginRecord[]
  stats: LoginStats
}

// Armazenamento em memória (volátil — some entre instâncias serverless).
const loginRecords: LoginRecord[] = []

export async function addLoginRecord(record: AddLoginInput): Promise<LoginRecord> {
  const newRecord: LoginRecord = {
    ...record,
    id: `login_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    date: new Date().toISOString(),
  }
  loginRecords.unshift(newRecord)
  if (loginRecords.length > 1000) {
    loginRecords.pop()
  }
  return newRecord
}

function computeStats(all: LoginRecord[]): LoginStats {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayLogins = all.filter((r) => new Date(r.date) >= today)
  const desktopCount = all.filter((r) => r.deviceType === "desktop").length
  const mobileCount = all.filter((r) => r.deviceType === "mobile").length
  const total = all.length
  return {
    totalToday: todayLogins.length,
    totalAll: total,
    desktopPercent: total > 0 ? Math.round((desktopCount / total) * 100) : 0,
    mobilePercent: total > 0 ? Math.round((mobileCount / total) * 100) : 0,
  }
}

export async function listLoginRecords(search = "", limit = 100): Promise<ListLoginsResult> {
  const term = search.toLowerCase()
  let filtered = loginRecords
  if (term) {
    filtered = loginRecords.filter(
      (record) =>
        record.email.toLowerCase().includes(term) ||
        record.name.toLowerCase().includes(term) ||
        record.ip.includes(term),
    )
  }
  return {
    logins: filtered.slice(0, limit),
    stats: computeStats(loginRecords),
  }
}

export async function clearLoginRecords(): Promise<void> {
  loginRecords.length = 0
}
