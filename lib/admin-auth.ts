import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { isValidAdminToken, getInternalSecret } from "@/lib/repositories/admin-session"

// Verifica se a requisição vem de um admin autenticado.
// Aceita o token via cookie admin_token OU header Authorization: Bearer.
// O fallback por header é necessário porque o preview roda em iframe e
// navegadores bloqueiam cookies sameSite=strict em contexto de terceiros.
export function isAuthenticatedAdmin(request: Request): boolean {
  // Always evaluate both paths to avoid timing leaks revealing which method is in use.
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/)
  const cookieToken = match ? decodeURIComponent(match[1]) : null

  const authHeader = request.headers.get("authorization") || ""
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null

  const cookieValid = isValidAdminToken(cookieToken)
  const bearerValid = isValidAdminToken(bearer)

  return cookieValid || bearerValid
}

// Verifica se a requisição é uma chamada interna (server-to-server) válida.
export function isInternalRequest(request: Request): boolean {
  const provided = request.headers.get("x-internal-secret") || ""
  const expected = getInternalSecret()
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    return a.length > 0 && a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// Resposta padrão de não autorizado.
export function unauthorizedResponse(message = "Não autorizado") {
  return NextResponse.json({ error: message }, { status: 401 })
}
