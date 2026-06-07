// Stub do repositório de settings/config/admins para Supabase.
//
// QUANDO CONECTAR O SUPABASE:
// 1. Criar as tabelas:
//    `app_config`   (config por chave: gateway, captcha, db...)
//        key         text primary key
//        value       jsonb not null
//        updated_at  timestamptz default now()
//    `app_settings` (linha única de preferências gerais)
//        id          int primary key default 1
//        value       jsonb not null
//    `admins`
//        email       text primary key
//        password    text not null   -- hash scrypt (salt:hash)
// 2. Implementar as funções mantendo as mesmas assinaturas.

const NOT_IMPLEMENTED = "Supabase settings repository ainda não implementado. Conecte o Supabase e implemente settings-supabase.ts."

export async function getConfig(_key: string): Promise<Record<string, any> | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function saveConfig(_key: string, _value: Record<string, any>): Promise<void> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function getSettings(): Promise<Record<string, any> | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function saveSettings(_value: Record<string, any>): Promise<Record<string, any>> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function findAdminByEmail(_email: string): Promise<{ email: string; password: string } | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function changeAdminPassword(_email: string, _currentPassword: string, _newPassword: string): Promise<boolean> {
  throw new Error(NOT_IMPLEMENTED)
}
