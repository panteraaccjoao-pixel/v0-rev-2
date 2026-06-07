// Stub do repositório de usuários para Supabase.
//
// QUANDO CONECTAR O SUPABASE:
// 1. Criar a tabela `profiles`:
//      id           text primary key
//      name         text not null
//      email        text unique not null
//      password     text            -- hash scrypt (salt:hash). Se usar Supabase
//                                    -- Auth nativo, este campo pode sair.
//      created_at   timestamptz default now()
//      balance      numeric default 0
//      total_spent  numeric default 0
//      purchases    integer default 0
//      status       text default 'active'  -- 'active' | 'blocked'
//      discord_id   text
// 2. Implementar cada função abaixo usando o client do Supabase (server-side,
//    com service role key) mantendo EXATAMENTE as mesmas assinaturas do
//    users-memory.ts.
// 3. Habilitar RLS na tabela e criar policies adequadas.

import type { Profile, CreateUserInput } from "../types"

const NOT_IMPLEMENTED = "Supabase users repository ainda não implementado. Conecte o Supabase e implemente users-supabase.ts."

export async function getUserByEmail(_email: string): Promise<Profile | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function getUserById(_id: string): Promise<Profile | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function listUsers(): Promise<Profile[]> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function createUser(_data: CreateUserInput): Promise<Profile> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function verifyLogin(_email: string, _password: string): Promise<Profile | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function updateUser(_id: string, _patch: Partial<Profile>): Promise<Profile | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function setBalance(_id: string, _balance: number): Promise<Profile | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function addBalance(_id: string, _amount: number): Promise<Profile | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function setStatus(_id: string, _status: "active" | "blocked"): Promise<Profile | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function setDiscordId(_id: string, _discordId: string): Promise<Profile | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function deleteUser(_id: string): Promise<boolean> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function recordPurchase(_id: string, _amount: number): Promise<Profile | null> {
  throw new Error(NOT_IMPLEMENTED)
}
