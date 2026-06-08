// Implementação Supabase do repositório de settings/config/admins.
// Mantém as mesmas assinaturas do settings-memory.ts.
import { getSupabaseAdmin } from "../supabase-client"
import { hashPassword, verifyPassword } from "../crypto"

// ---- Config (gateway, captcha, db...) — tabela app_config (key/value jsonb) ----

export async function getConfig(key: string): Promise<Record<string, any> | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", key)
    .maybeSingle()
  if (error) throw new Error(`getConfig: ${error.message}`)
  return data ? (data.value as Record<string, any>) : null
}

export async function saveConfig(key: string, value: Record<string, any>): Promise<void> {
  const supabase = getSupabaseAdmin()
  const payload = { ...value, updated_at: new Date().toISOString() }
  const { error } = await supabase
    .from("app_config")
    .upsert({ key, value: payload, updated_at: new Date().toISOString() }, { onConflict: "key" })
  if (error) throw new Error(`saveConfig: ${error.message}`)
}

// ---- Settings (preferências gerais) — tabela app_settings (linha única id=1) ----

export async function getSettings(): Promise<Record<string, any> | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("id", 1)
    .maybeSingle()
  if (error) throw new Error(`getSettings: ${error.message}`)
  return data ? (data.value as Record<string, any>) : null
}

export async function saveSettings(value: Record<string, any>): Promise<Record<string, any>> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("app_settings")
    .upsert({ id: 1, value }, { onConflict: "id" })
  if (error) throw new Error(`saveSettings: ${error.message}`)
  return value
}

// ---- Admins — tabela admins (email/password) ----

export async function findAdminByEmail(
  email: string,
): Promise<{ email: string; password: string } | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("admins")
    .select("email, password")
    .ilike("email", email)
    .maybeSingle()
  if (error) throw new Error(`findAdminByEmail: ${error.message}`)
  return data ? { email: data.email, password: data.password } : null
}

// Troca a senha do admin validando a senha atual. Retorna true se trocou.
export async function changeAdminPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const admin = await findAdminByEmail(email)
  if (!admin || !verifyPassword(currentPassword, admin.password)) return false
  const { error } = await supabase
    .from("admins")
    .update({ password: hashPassword(newPassword) })
    .ilike("email", email)
  if (error) throw new Error(`changeAdminPassword: ${error.message}`)
  return true
}
