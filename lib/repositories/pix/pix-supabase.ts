// Stub do repositório de pagamentos PIX para Supabase.
//
// QUANDO CONECTAR O SUPABASE:
// 1. Criar a tabela `pix_payments`:
//      id            text primary key
//      amount        numeric not null
//      status        text default 'pending'  -- 'pending' | 'paid' | 'expired'
//      pix_code      text
//      qr_code_url   text
//      created_at    timestamptz default now()
//      expires_at    timestamptz
//      user_email    text
//      user_id       text
//      user_name     text
//      purpose       text not null           -- 'recharge' | 'purchase'
//      credited      boolean default false
//      delivered     boolean default false
//      reserved_cards jsonb default '[]'     -- cartões reservados (compra)
//      coupon_code   text
//      items         jsonb default '[]'
// 2. Implementar as funções mantendo as mesmas assinaturas.
//    ATENÇÃO: updatePixPayment de credited/delivered deve ser idempotente
//    (condicionar o update a credited=false/delivered=false) para evitar
//    crédito ou entrega em dobro em webhooks repetidos.

import type { PixPayment } from "../types"

const NOT_IMPLEMENTED = "Supabase pix repository ainda não implementado. Conecte o Supabase e implemente pix-supabase.ts."

export async function addPixPayment(_payment: PixPayment): Promise<void> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function findPixPayment(_id: string): Promise<PixPayment | null> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function listPixPayments(): Promise<PixPayment[]> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function updatePixPayment(_id: string, _patch: Partial<PixPayment>): Promise<PixPayment | null> {
  throw new Error(NOT_IMPLEMENTED)
}
