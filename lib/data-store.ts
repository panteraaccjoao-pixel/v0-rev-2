// Armazenamento em memória que substitui o Supabase.
// ATENÇÃO: os dados são voláteis e reiniciam quando o servidor reinicia.
// Use um banco de dados real para produção.

import { scryptSync, randomBytes, timingSafeEqual } from "crypto"

export interface Profile {
  id: string
  name: string
  email: string
  password?: string
  created_at: string
  balance: number
  total_spent: number
  purchases: number
  status: "active" | "blocked"
  discord_id?: string
}

interface DataStore {
  profiles: Profile[]
  config: Record<string, Record<string, any>>
  settings: Record<string, any> | null
  admins: { email: string; password: string }[]
  adminTokens: Map<string, number> // token -> expiração (timestamp)
  internalSecret: string
}

// Faz o hash de uma senha usando scrypt (formato: salt:hash em hex).
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

// Verifica uma senha contra um valor armazenado.
// Suporta tanto hashes scrypt (salt:hash) quanto senhas em texto puro (legado/seed).
export function verifyPassword(password: string, stored?: string): boolean {
  if (!stored) return false

  // Senha em texto puro (dados de seed antigos) — comparação simples
  if (!stored.includes(":")) {
    return stored === password
  }

  const [salt, key] = stored.split(":")
  if (!salt || !key) return false

  try {
    const hashedBuffer = scryptSync(password, salt, 64)
    const keyBuffer = Buffer.from(key, "hex")
    if (hashedBuffer.length !== keyBuffer.length) return false
    return timingSafeEqual(hashedBuffer, keyBuffer)
  } catch {
    return false
  }
}

// Mantém o store entre hot-reloads em desenvolvimento.
const globalForStore = globalThis as unknown as { __dataStore?: DataStore }

const store: DataStore =
  globalForStore.__dataStore ??
  (globalForStore.__dataStore = {
    profiles: [],
    config: {},
    settings: null,
    admins: [{ email: "admin@teste.com", password: hashPassword("admin123") }],
    adminTokens: new Map<string, number>(),
    internalSecret: randomBytes(32).toString("hex"),
  })

// Garante que campos novos existam mesmo num store criado por hot-reload antigo.
if (!store.adminTokens) {
  store.adminTokens = new Map<string, number>()
}
if (!store.internalSecret) {
  store.internalSecret = randomBytes(32).toString("hex")
}

// Garante que o admin exista mesmo após hot-reloads.
if (!store.admins.some((a) => a.email === "admin@teste.com")) {
  store.admins.unshift({ email: "admin@teste.com", password: hashPassword("admin123") })
}

// Garante que o usuário de teste exista mesmo após hot-reloads.
if (!store.profiles.some((p) => p.email === "teste@teste.com")) {
  store.profiles.unshift({
    id: "user_seed_teste",
    name: "Teste",
    email: "teste@teste.com",
    password: hashPassword("teste123"),
    created_at: new Date().toISOString(),
    balance: 0,
    total_spent: 0,
    purchases: 0,
    status: "active",
    discord_id: "",
  })
}

export default store

// ---- Autenticação de admin (tokens em memória) ----

const ADMIN_TOKEN_TTL = 60 * 60 * 24 * 1000 // 24h

export function createAdminToken(): string {
  const token = randomBytes(32).toString("hex")
  store.adminTokens.set(token, Date.now() + ADMIN_TOKEN_TTL)
  return token
}

export function isValidAdminToken(token?: string | null): boolean {
  if (!token) return false
  const expiresAt = store.adminTokens.get(token)
  if (!expiresAt) return false
  if (expiresAt < Date.now()) {
    store.adminTokens.delete(token)
    return false
  }
  return true
}

export function revokeAdminToken(token?: string | null): void {
  if (token) store.adminTokens.delete(token)
}

export function getInternalSecret(): string {
  return store.internalSecret
}

// ---- Helpers de perfil ----

export function findProfileByEmail(email: string): Profile | undefined {
  return store.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase())
}

export function findProfileById(id: string): Profile | undefined {
  return store.profiles.find((p) => p.id === id)
}

export function createProfile(data: {
  name: string
  email: string
  password?: string
}): Profile {
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
  store.profiles.unshift(profile)
  return profile
}
