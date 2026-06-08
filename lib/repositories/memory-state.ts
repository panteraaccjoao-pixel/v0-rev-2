// Estado em memória compartilhado entre as implementações *-memory.ts.
// ATENÇÃO: volátil — reinicia quando o servidor reinicia. Sobrevive a
// hot-reloads via globalThis. Substituído pelo Supabase quando conectado.

import { randomBytes } from "crypto"
import { hashPassword } from "./crypto"
import type {
  Profile,
  Product,
  Order,
  PixPayment,
  AdminAccount,
  Cupom,
} from "./types"

interface MemoryState {
  profiles: Profile[]
  orders: Order[]
  stock: Product[]
  pixPayments: PixPayment[]
  cupons: Cupom[]
  config: Record<string, Record<string, any>>
  settings: Record<string, any> | null
  admins: AdminAccount[]
  adminTokens: Map<string, number> // token -> expiração (timestamp)
  internalSecret: string
}

const globalForMemory = globalThis as unknown as { __memoryState_v1?: MemoryState }

const state: MemoryState =
  globalForMemory.__memoryState_v1 ??
  (globalForMemory.__memoryState_v1 = {
    profiles: [],
    orders: [],
    stock: [],
    pixPayments: [],
    cupons: [],
    config: {},
    settings: null,
    admins: [{ email: "admin@teste.com", password: hashPassword("admin123") }],
    adminTokens: new Map<string, number>(),
    internalSecret: randomBytes(32).toString("hex"),
  })

// Garante campos novos mesmo num state criado por hot-reload antigo.
if (!state.adminTokens) state.adminTokens = new Map<string, number>()
if (!state.internalSecret) state.internalSecret = randomBytes(32).toString("hex")
if (!state.cupons) state.cupons = []

// Seed: admin de teste.
if (!state.admins.some((a) => a.email === "admin@teste.com")) {
  state.admins.unshift({ email: "admin@teste.com", password: hashPassword("admin123") })
}

// Seed: usuário de teste.
if (!state.profiles.some((p) => p.email === "teste@teste.com")) {
  state.profiles.unshift({
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

export default state
