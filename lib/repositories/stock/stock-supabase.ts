// Stub do repositório de estoque para Supabase.
//
// QUANDO CONECTAR O SUPABASE:
// 1. Criar a tabela `stock`:
//      id          text primary key
//      bin         text
//      full_card   text
//      expiry      text
//      cvv         text
//      bank        text
//      type        text default 'CREDIT'
//      level       text
//      price       numeric default 0
//      brand       text default 'visa'
//      created_at  timestamptz default now()
//      holder_name text
//      cpf         text
//      birth_date  text
// 2. Implementar as funções mantendo as mesmas assinaturas.
//    ATENÇÃO: removeStockById deve ser atômico (ex: delete ... returning *)
//    para evitar entregar o mesmo cartão duas vezes em compras concorrentes.

import type { Product } from "../types"

const NOT_IMPLEMENTED = "Supabase stock repository ainda não implementado. Conecte o Supabase e implemente stock-supabase.ts."

export async function listStock(): Promise<Product[]> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function addStock(_data: Partial<Product>): Promise<Product> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function findStockById(_id: string): Promise<Product | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function removeStockById(_id: string): Promise<Product | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function updateStock(_id: string, _data: Partial<Product>): Promise<Product | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function findMatchingStock(_level: string, _brand: string): Promise<Product[]> {
  throw new Error(NOT_IMPLEMENTED)
}
