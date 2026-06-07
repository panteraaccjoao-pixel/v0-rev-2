// Sessão de admin: tokens e segredo interno.
// Mantidos SÍNCRONOS e em memória de propósito — são estado de sessão, não
// dados de negócio persistentes. Continuam válidos mesmo com o Supabase ligado.

import { randomBytes } from "crypto"
import state from "./memory-state"

const ADMIN_TOKEN_TTL = 60 * 60 * 24 * 1000 // 24h

export function createAdminToken(): string {
  const token = randomBytes(32).toString("hex")
  state.adminTokens.set(token, Date.now() + ADMIN_TOKEN_TTL)
  return token
}

export function isValidAdminToken(token?: string | null): boolean {
  if (!token) return false
  const expiresAt = state.adminTokens.get(token)
  if (!expiresAt) return false
  if (expiresAt < Date.now()) {
    state.adminTokens.delete(token)
    return false
  }
  return true
}

export function revokeAdminToken(token?: string | null): void {
  if (token) state.adminTokens.delete(token)
}

export function getInternalSecret(): string {
  return state.internalSecret
}
