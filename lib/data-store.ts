// COMPAT: este arquivo foi migrado para a camada de repositórios em
// `lib/repositories/`. Mantido como re-export fino para não quebrar imports
// existentes. Prefira importar de `@/lib/repositories/...` em código novo.
//
// O `store` em memória continua acessível para compatibilidade, mas o acesso
// canônico aos dados agora é via repositórios assíncronos.

import state from "./repositories/memory-state"

// Cripto de senha (síncrono).
export { hashPassword, verifyPassword } from "./repositories/crypto"

// Sessão de admin (síncrono).
export {
  createAdminToken,
  isValidAdminToken,
  revokeAdminToken,
  getInternalSecret,
} from "./repositories/admin-session"

// Tipos.
export type { Profile } from "./repositories/types"

// Acesso direto ao estado em memória (compat com código legado).
export default state

// ---- Helpers de perfil (compat, agora delegando ao estado em memória) ----
// Mantidos SÍNCRONOS aqui pois alguns pontos legados ainda os usam de forma
// síncrona. Código novo deve usar `@/lib/repositories/users`.
import type { Profile } from "./repositories/types"
import { hashPassword as _hashPassword } from "./repositories/crypto"

export function findProfileByEmail(email: string): Profile | undefined {
  return state.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase())
}

export function findProfileById(id: string): Profile | undefined {
  return state.profiles.find((p) => p.id === id)
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
    password: data.password ? _hashPassword(data.password) : undefined,
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
