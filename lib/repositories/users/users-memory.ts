// Implementação em memória do repositório de usuários.
import state from "../memory-state"
import { hashPassword, verifyPassword } from "../crypto"
import type { Profile, CreateUserInput } from "../types"

export async function getUserByEmail(email: string): Promise<Profile | null> {
  const p = state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase())
  return p ?? null
}

export async function getUserById(id: string): Promise<Profile | null> {
  return state.profiles.find((p) => p.id === id) ?? null
}

export async function listUsers(): Promise<Profile[]> {
  return state.profiles
}

export async function createUser(data: CreateUserInput): Promise<Profile> {
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
  state.profiles.unshift(profile)
  return profile
}

export async function verifyLogin(email: string, password: string): Promise<Profile | null> {
  const profile = await getUserByEmail(email)
  if (!profile) return null
  if (profile.password && !verifyPassword(password, profile.password)) return null
  return profile
}

export async function updateUser(id: string, patch: Partial<Profile>): Promise<Profile | null> {
  const profile = state.profiles.find((p) => p.id === id)
  if (!profile) return null
  Object.assign(profile, patch)
  return profile
}

export async function setBalance(id: string, balance: number): Promise<Profile | null> {
  return updateUser(id, { balance })
}

export async function addBalance(id: string, amount: number): Promise<Profile | null> {
  const profile = state.profiles.find((p) => p.id === id)
  if (!profile) return null
  profile.balance = Number(profile.balance ?? 0) + Number(amount ?? 0)
  return profile
}

export async function setStatus(id: string, status: "active" | "blocked"): Promise<Profile | null> {
  return updateUser(id, { status })
}

export async function setDiscordId(id: string, discordId: string): Promise<Profile | null> {
  return updateUser(id, { discord_id: discordId })
}

export async function deleteUser(id: string): Promise<boolean> {
  const index = state.profiles.findIndex((p) => p.id === id)
  if (index === -1) return false
  state.profiles.splice(index, 1)
  return true
}

// Registra estatísticas de uma compra (incrementa contadores).
export async function recordPurchase(id: string, amount: number): Promise<Profile | null> {
  const profile = state.profiles.find((p) => p.id === id)
  if (!profile) return null
  profile.purchases = Number(profile.purchases ?? 0) + 1
  profile.total_spent = Number(profile.total_spent ?? 0) + Number(amount ?? 0)
  return profile
}
