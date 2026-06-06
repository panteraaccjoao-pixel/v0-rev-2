import { createClient } from "@supabase/supabase-js"

/**
 * Cliente administrativo do Supabase (server-side apenas).
 * Usa a SERVICE ROLE KEY e ignora as políticas de RLS.
 * NUNCA importe este arquivo em código que roda no navegador.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
