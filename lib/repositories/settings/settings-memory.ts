// Implementação em memória do repositório de settings/config/admins.
import state from "../memory-state"
import { hashPassword, verifyPassword } from "../crypto"

// ---- Config (gateway, captcha, db...) ----

export async function getConfig(key: string): Promise<Record<string, any> | null> {
  return state.config[key] || null
}

export async function saveConfig(key: string, value: Record<string, any>): Promise<void> {
  state.config[key] = { ...value, updated_at: new Date().toISOString() }
}

// ---- Settings (preferências gerais do site) ----

export async function getSettings(): Promise<Record<string, any> | null> {
  return state.settings
}

export async function saveSettings(value: Record<string, any>): Promise<Record<string, any>> {
  state.settings = value
  return value
}

// ---- Admins ----

export async function findAdminByEmail(
  email: string,
): Promise<{ email: string; password: string } | null> {
  return state.admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null
}

// Troca a senha do admin validando a senha atual. Retorna true se trocou.
export async function changeAdminPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  const admin = state.admins.find((a) => a.email.toLowerCase() === email.toLowerCase())
  if (!admin || !verifyPassword(currentPassword, admin.password)) return false
  admin.password = hashPassword(newPassword)
  return true
}
