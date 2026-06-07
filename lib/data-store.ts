// Armazenamento em memória que substitui o Supabase.
// ATENÇÃO: os dados são voláteis e reiniciam quando o servidor reinicia.
// Use um banco de dados real para produção.

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
}

// Mantém o store entre hot-reloads em desenvolvimento.
const globalForStore = globalThis as unknown as { __dataStore?: DataStore }

const store: DataStore =
  globalForStore.__dataStore ??
  (globalForStore.__dataStore = {
    profiles: [],
    config: {},
    settings: null,
    admins: [{ email: "admin@teste.com", password: "admin123" }],
  })

// Garante que o admin exista mesmo após hot-reloads.
if (!store.admins.some((a) => a.email === "admin@teste.com")) {
  store.admins.unshift({ email: "admin@teste.com", password: "admin123" })
}

// Garante que o usuário de teste exista mesmo após hot-reloads.
if (!store.profiles.some((p) => p.email === "teste@teste.com")) {
  store.profiles.unshift({
    id: "user_seed_teste",
    name: "Teste",
    email: "teste@teste.com",
    password: "teste123",
    created_at: new Date().toISOString(),
    balance: 0,
    total_spent: 0,
    purchases: 0,
    status: "active",
    discord_id: "",
  })
}

export default store

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
    password: data.password,
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
