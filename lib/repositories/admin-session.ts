// Sessão de admin: tokens STATELESS assinados por HMAC.
//
// IMPORTANTE: antes os tokens ficavam em um Map em memória. Isso quebra em
// produção serverless (Vercel), onde cada requisição pode cair em uma
// instância diferente / cold start: o login criava o token numa instância e o
// POST /api/estoque caía em outra que não conhecia o token -> 401. Resultado:
// "logava mas não conseguia adicionar estoque".
//
// Agora o token é um HMAC assinado (igual à sessão de usuário em
// lib/user-session.ts), verificável por QUALQUER instância sem estado
// compartilhado. O mesmo vale para o segredo interno, derivado de forma
// determinística do segredo do ambiente.

import { createHmac, timingSafeEqual } from "crypto"

const ADMIN_TOKEN_TTL_SECONDS = 60 * 60 * 24 // 24h

interface AdminTokenPayload {
  role: "admin"
  iat: number // emitido em (segundos)
  exp: number // expira em (segundos)
}

function getSecret(): string {
  const secret =
    process.env.SUPABASE_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  if (!secret) {
    throw new Error("Nenhum segredo disponível para assinar a sessão de admin.")
  }
  // Namespacing para não colidir com o token de usuário.
  return `admin-session:${secret}`
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4))
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64")
}

function sign(data: string): string {
  return base64url(createHmac("sha256", getSecret()).update(data).digest())
}

// Cria um token de admin assinado (stateless).
export function createAdminToken(): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminTokenPayload = {
    role: "admin",
    iat: now,
    exp: now + ADMIN_TOKEN_TTL_SECONDS,
  }
  const body = base64url(JSON.stringify(payload))
  const signature = sign(body)
  return `${body}.${signature}`
}

// Verifica a assinatura e a expiração. Retorna false se inválido/adulterado.
export function isValidAdminToken(token?: string | null): boolean {
  if (!token || typeof token !== "string") return false
  const parts = token.split(".")
  if (parts.length !== 2) return false

  const [body, signature] = parts
  const expected = sign(body)

  // Comparação em tempo constante para evitar timing attacks.
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return false
  }

  try {
    const payload = JSON.parse(base64urlDecode(body).toString("utf8")) as AdminTokenPayload
    if (payload?.role !== "admin" || !payload?.exp) return false
    if (payload.exp < Math.floor(Date.now() / 1000)) return false
    return true
  } catch {
    return false
  }
}

// Modelo stateless não mantém lista de tokens; revogação seria via blacklist.
// O logout apaga o cookie/localStorage no cliente. Mantido como no-op para
// preservar a API existente.
export function revokeAdminToken(_token?: string | null): void {
  // no-op (stateless)
}

// Segredo interno determinístico (server-to-server), estável entre instâncias.
export function getInternalSecret(): string {
  return base64url(createHmac("sha256", getSecret()).update("internal-secret").digest())
}
