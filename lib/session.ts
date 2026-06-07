// Helpers para a sessão do usuário guardada no localStorage.

export interface UserSession {
  success: boolean
  userId?: string
  name?: string
  email?: string
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

// Atualiza nome/email da sessão preservando os demais campos.
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
