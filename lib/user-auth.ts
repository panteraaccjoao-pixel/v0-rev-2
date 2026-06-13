import { NextResponse } from "next/server"
import { getUserSession, type UserSessionPayload } from "@/lib/user-session"

// Exige uma sessão de usuário válida (assinada pelo servidor).
// Retorna o payload ({ uid, email, name }) ou null.
// Use o `uid` retornado como fonte de verdade — NUNCA confie em email/userId
// vindos do corpo ou da query da requisição.
export function requireUser(request: Request): UserSessionPayload | null {
  return getUserSession(request)
}

export function unauthorizedResponse(message = "Faça login para continuar") {
  return NextResponse.json({ error: message }, { status: 401 })
}
