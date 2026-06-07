// Seletor de backend de dados.
// Hoje: memória (padrão). Futuro: Supabase, quando as env vars existirem.
//
// Para ativar o Supabase no futuro, basta conectar a integração (que define
// NEXT_PUBLIC_SUPABASE_URL) e implementar os arquivos *-supabase.ts. Nenhuma
// rota precisa mudar.

export function isSupabaseEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  )
}

// Escolhe entre a implementação em memória e a do Supabase.
export function pickBackend<T>(memoryImpl: T, supabaseImpl: T): T {
  return isSupabaseEnabled() ? supabaseImpl : memoryImpl
}
