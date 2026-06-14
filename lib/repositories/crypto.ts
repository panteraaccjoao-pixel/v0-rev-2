// Utilitários de senha (scrypt) e tokens de admin.
// Permanecem SÍNCRONOS de propósito: não são dados persistentes e são usados
// em guards de rota. Quando o Supabase entrar, o armazenamento de usuários muda,
// mas estas funções de hash continuam válidas.

import { scryptSync, randomBytes, timingSafeEqual } from "crypto"

// Faz o hash de uma senha usando scrypt (formato: salt:hash em hex).
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

// Verifica uma senha contra um valor armazenado.
// Suporta hashes scrypt (salt:hash) e senhas em texto puro (legado/seed).
export function verifyPassword(password: string, stored?: string): boolean {
  if (!stored) return false

  if (!stored.includes(":")) {
    // Texto plano nunca é aceito em produção
    if (process.env.NODE_ENV !== "development") return false
    console.warn("[Security] Plain-text password detected — hash it immediately")
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
