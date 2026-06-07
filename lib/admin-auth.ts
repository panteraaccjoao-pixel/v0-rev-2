import { NextResponse } from "next/server"
import { isValidAdminToken, getInternalSecret } from "@/lib/data-store"

// Verifica se a requisição vem de um admin autenticado (cookie admin_token válido).
export function isAuthenticatedAdmin(request: Request): boolean {
  // Lê o cookie admin_token do header de cookies
  const cookieHeader = request.headers.get("cookie") || ""
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  return isValidAdminToken(token)
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
