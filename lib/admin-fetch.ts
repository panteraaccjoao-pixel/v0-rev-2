"use client"

// Helper de fetch autenticado para o painel admin.
// Anexa o token salvo em localStorage (admin_session) no header Authorization,
// pois o cookie sameSite=strict é bloqueado dentro do iframe do preview.
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("admin_session")
    if (!raw) return null
    const session = JSON.parse(raw)
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem("admin_session")
      return null
    }
    return session.token || null
  } catch {
    return null
  }
}

export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAdminToken()
  const headers = new Headers(init.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)
  return fetch(input, { ...init, headers })
}
