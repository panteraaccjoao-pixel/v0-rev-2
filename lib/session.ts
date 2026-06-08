// Helpers para a sessão do usuário guardada no localStorage.

export interface UserSession {
  success: boolean
  userId?: string
  name?: string
  email?: string
  token?: string
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("user_session")
    return raw ? (JSON.parse(raw) as UserSession) : null
  } catch {
    return null
  }
}

export function getSessionEmail(): string {
  return getSession()?.email || ""
}

export function getSessionToken(): string {
  return getSession()?.token || ""
}

// Persiste a sessão após login/registro (inclui o token de sessão assinado).
export function saveSession(data: {
  userId?: string
  name?: string
  email?: string
  token?: string
}): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("user_session", JSON.stringify({ success: true, ...data }))
  } catch {
    // ignore
  }
}

// Atualiza nome/email da sessão preservando os demais campos (ex.: token).
export function setSessionProfile(data: { name?: string; email?: string }): void {
  if (typeof window === "undefined") return
  try {
    const current = getSession() || { success: true }
    const updated = { ...current, ...data }
    localStorage.setItem("user_session", JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem("user_session")
  } catch {
    // ignore
  }
}

// fetch autenticado: envia o cookie (same-origin) E o token como Bearer,
// garantindo que funcione também dentro do iframe do preview, onde o
// cookie cross-site pode ser bloqueado pelo navegador.
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getSessionToken()
  const headers = new Headers(init.headers || {})
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers, credentials: "include" })
}
