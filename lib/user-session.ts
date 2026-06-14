import { createHmac, timingSafeEqual } from "crypto"

// Sessão de usuário REAL, validada pelo servidor.
//
// O token é um JWT-like HMAC stateless: payload assinado com SUPABASE_JWT_SECRET.
// Stateless é importante porque o app roda em ambiente serverless (várias
// instâncias / cold starts) — um token assinado pode ser verificado por
// qualquer instância sem precisar de estado compartilhado em memória.
//
// O segredo é reutilizado do ambiente (SUPABASE_JWT_SECRET) para não exigir
// configuração nova. Se ele faltar, caímos em SUPABASE_SERVICE_ROLE_KEY.

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 dias
export const USER_SESSION_COOKIE = "user_token"

export interface UserSessionPayload {
  uid: string // id do usuário (profile.id)
  email: string
  name: string
  iat: number // emitido em (segundos)
  exp: number // expira em (segundos)
}

function getSecret(): string {
  const secret =
    process.env.SUPABASE_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  if (!secret) {
    throw new Error("Nenhum segredo disponível para assinar a sessão do usuário.")
  }
  // Namespacing para o token de usuário não colidir com outros usos do segredo.
  return `user-session:${secret}`
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

// Cria um token de sessão assinado para um usuário.
export function createUserToken(user: { id: string; email: string; name?: string }): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: UserSessionPayload = {
    uid: String(user.id),
    email: user.email || "",
    name: user.name || "",
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  }
  const body = base64url(JSON.stringify(payload))
  const signature = sign(body)
  return `${body}.${signature}`
}

// Verifica e decodifica um token. Retorna null se inválido/expirado/adulterado.
export function verifyUserToken(token?: string | null): UserSessionPayload | null {
  if (!token || typeof token !== "string") return null
  const parts = token.split(".")
  if (parts.length !== 2) return null

  const [body, signature] = parts
  const expected = sign(body)

  // Comparação em tempo constante para evitar timing attacks.
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(base64urlDecode(body).toString("utf8")) as UserSessionPayload
    if (!payload?.uid || !payload?.exp) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// Extrai o token da requisição: cookie user_token OU header Authorization: Bearer.
// O fallback por header é necessário porque o preview roda em iframe e alguns
// navegadores bloqueiam cookies em contexto de terceiros.
export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)user_token=([^;]+)/)
  if (match) return decodeURIComponent(match[1])

  const authHeader = request.headers.get("authorization") || ""
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim()

  return null
}

// Atalho: retorna o payload da sessão do usuário a partir da requisição.
export function getUserSession(request: Request): UserSessionPayload | null {
  return verifyUserToken(getTokenFromRequest(request))
}

// Opções padronizadas do cookie de sessão.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  }
}
