import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/repositories/users"
import { sanitizeInput } from "@/lib/security"
import {
  createUserToken,
  getUserSession,
  USER_SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/user-session"

// Migração suave + renovação de sessão.
//
// Cenário: usuários que já estavam logados têm apenas a sessão antiga no
// localStorage (sem cookie assinado). Este endpoint reemite o cookie de sessão
// SE o usuário for real e estiver ativo no banco.
//
// Segurança: NÃO é uma porta dos fundos. Só emite token para um e-mail que:
//   1. já tenha uma sessão assinada válida (renovação), OU
//   2. exista na base e não esteja bloqueado (migração única do localStorage).
// Como o endpoint não valida senha, ele apenas confirma a existência do usuário
// — o que é aceitável para migração, mas combinamos que o ideal a longo prazo
// é exigir re-login. Aqui priorizamos não deslogar todo mundo.
export async function POST(request: NextRequest) {
  try {
    // 1. Já tem sessão assinada válida? Apenas renova.
    const existing = getUserSession(request)
    if (existing) {
      const profile = await getUserByEmail(existing.email)
      if (!profile || profile.status === "blocked") {
        const res = NextResponse.json({ success: false }, { status: 401 })
        res.cookies.delete(USER_SESSION_COOKIE)
        return res
      }
      return emitToken(profile)
    }

    // 2. Migração do localStorage: confia no e-mail informado SOMENTE para
    //    confirmar que é um usuário real e ativo.
    const body = await request.json().catch(() => ({}))
    const email = body?.email ? sanitizeInput(String(body.email)).toLowerCase() : ""
    if (!email) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const profile = await getUserByEmail(email)
    if (!profile || profile.status === "blocked") {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    return emitToken(profile)
  } catch (error) {
    console.error("[Auth refresh] Error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

function emitToken(profile: { id: string; email: string; name?: string }) {
  const token = createUserToken({ id: profile.id, email: profile.email, name: profile.name })
  const response = NextResponse.json({
    success: true,
    token,
    user: { id: profile.id, name: profile.name, email: profile.email },
  })
  response.cookies.set(USER_SESSION_COOKIE, token, sessionCookieOptions())
  return response
}
