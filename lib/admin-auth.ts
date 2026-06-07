import { NextResponse } from "next/server"
import { isValidAdminToken, getInternalSecret } from "@/lib/data-store"

// Verifica se a requisição vem de um admin autenticado.
// Aceita o token via cookie admin_token OU header Authorization: Bearer.
// O fallback por header é necessário porque o preview roda em iframe e
// navegadores bloqueiam cookies sameSite=strict em contexto de terceiros.
export function isAuthenticatedAdmin(request: Request): boolean {
  // 1. Cookie admin_token
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/)
  const cookieToken = match ? decodeURIComponent(match[1]) : null
  if (isValidAdminToken(cookieToken)) return true

  // 2. Header Authorization: Bearer <token>
  const authHeader = request.headers.get("authorization") || ""
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null
  return isValidAdminToken(bearer)
}

// Verifica se a requisição é uma chamada interna (server-to-server) válida.
export function isInternalRequest(request: Request): boolean {
  const secret = request.headers.get("x-internal-secret")
  return !!secret && secret === getInternalSecret()
}

// Resposta padrão de não autorizado.
export function unauthorizedResponse(message = "Não autorizado") {
  return NextResponse.json({ error: message }, { status: 401 })
}
