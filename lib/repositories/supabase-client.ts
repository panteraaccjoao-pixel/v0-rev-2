// Client Supabase server-side para a camada de repositórios.
//
// Usa a SERVICE ROLE KEY (bypassa RLS). Este client NUNCA deve ser importado
// em código client-side — apenas em rotas/route handlers e nos repositórios
// *-supabase.ts que rodam no servidor.
//
// O app não usa Supabase Auth: a autenticação é própria (tabela profiles +
// scrypt). Por isso todas as tabelas têm RLS habilitado sem policies públicas,
// e somente este client (service role) consegue ler/escrever.

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const globalForSupabase = globalThis as unknown as {
  __supabaseAdmin?: SupabaseClient
}

function buildClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    )
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Singleton para evitar recriar o client a cada chamada / hot-reload.
export function getSupabaseAdmin(): SupabaseClient {
  return (globalForSupabase.__supabaseAdmin ??= buildClient())
}
