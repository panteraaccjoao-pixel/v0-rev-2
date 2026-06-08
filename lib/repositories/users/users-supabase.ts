// Implementação Supabase do repositório de usuários.
// Mantém EXATAMENTE as mesmas assinaturas do users-memory.ts.
import { getSupabaseAdmin } from "../supabase-client"
import { hashPassword, verifyPassword } from "../crypto"
import type { Profile, CreateUserInput } from "../types"

const TABLE = "profiles"

// Colunas selecionadas (o tipo Profile já está em snake_case).
const COLS = "id, name, email, password, created_at, balance, total_spent, purchases, status, discord_id"

function rowToProfile(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password ?? undefined,
    created_at: row.created_at,
    balance: Number(row.balance ?? 0),
    total_spent: Number(row.total_spent ?? 0),
    purchases: Number(row.purchases ?? 0),
    status: (row.status ?? "active") as Profile["status"],
    discord_id: row.discord_id ?? "",
  }
}

export async function getUserByEmail(email: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .ilike("email", email)
    .maybeSingle()
  if (error) throw new Error(`getUserByEmail: ${error.message}`)
  return data ? rowToProfile(data) : null
}

export async function getUserById(id: string): Promise<Profile | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from(TABLE).select(COLS).eq("id", id).maybeSingle()
  if (error) throw new Error(`getUserById: ${error.message}`)
  return data ? rowToProfile(data) : null
}

export async function listUsers(): Promise<Profile[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order("created_at", { ascending: false })
  if (error) throw new Error(`listUsers: ${error.message}`)
  return (data ?? []).map(rowToProfile)
}

export async function createUser(data: CreateUserInput): Promise<Profile> {
  const supabase = getSupabaseAdmin()
  const profile: Profile = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password ? hashPassword(data.password) : undefined,
    created_at: new Date().toISOString(),
    balance: 0,
    total_spent: 0,
    purchases: 0,
    status: "active",
    discord_id: "",
  }
  const { data: row, error } = await supabase.from(TABLE).insert(profile).select(COLS).single()
  if (error) throw new Error(`createUser: ${error.message}`)
  return rowToProfile(row)
}

export async function verifyLogin(email: string, password: string): Promise<Profile | null> {
  const profile = await getUserByEmail(email)
  if (!profile) return null
  if (profile.password && !verifyPassword(password, profile.password)) return null
  return profile
}

export async function updateUser(id: string, patch: Partial<Profile>): Promise<Profile | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from(TABLE).update(patch).eq("id", id).select(COLS).maybeSingle()
  if (error) throw new Error(`updateUser: ${error.message}`)
  return data ? rowToProfile(data) : null
}

export async function setBalance(id: string, balance: number): Promise<Profile | null> {
  return updateUser(id, { balance })
}

export async function addBalance(id: string, amount: number): Promise<Profile | null> {
  // Incremento atômico via RPC para evitar condições de corrida.
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc("increment_balance", {
    p_user_id: id,
    p_amount: Number(amount ?? 0),
  })
  if (error) throw new Error(`addBalance: ${error.message}`)
  const row = Array.isArray(data) ? data[0] : data
  return row ? rowToProfile(row) : null
}

export async function setStatus(id: string, status: "active" | "blocked"): Promise<Profile | null> {
  return updateUser(id, { status })
}

export async function setDiscordId(id: string, discordId: string): Promise<Profile | null> {
  return updateUser(id, { discord_id: discordId })
}

export async function deleteUser(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select("id")
  if (error) throw new Error(`deleteUser: ${error.message}`)
  return (data ?? []).length > 0
}

// Registra estatísticas de uma compra (incrementa contadores de forma atômica).
export async function recordPurchase(id: string, amount: number): Promise<Profile | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc("record_purchase", {
    p_user_id: id,
    p_amount: Number(amount ?? 0),
  })
  if (error) throw new Error(`recordPurchase: ${error.message}`)
  const row = Array.isArray(data) ? data[0] : data
  return row ? rowToProfile(row) : null
}
