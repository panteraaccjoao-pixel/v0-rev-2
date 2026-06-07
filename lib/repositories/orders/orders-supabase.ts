// Stub do repositório de pedidos para Supabase.
//
// QUANDO CONECTAR O SUPABASE:
// 1. Criar a tabela `orders`:
//      id          text primary key
//      oder_id     text            -- código exibido (#ABCD1234)
//      user_id     text not null   -- id do perfil OU email
//      user_name   text
//      product     text not null
//      level       text
//      brand       text
//      quantity    integer default 1
//      total       numeric default 0
//      date        timestamptz default now()
//      status      text default 'entregue'
//      card_data   jsonb           -- dados entregues (cartão)
// 2. Implementar as funções abaixo mantendo as mesmas assinaturas.
//    Em listOrders, o filtro deve casar user_id com userId OU email.

import type { Order, CreateOrderInput, ListOrdersFilter } from "../types"

const NOT_IMPLEMENTED = "Supabase orders repository ainda não implementado. Conecte o Supabase e implemente orders-supabase.ts."

export async function createOrder(_data: CreateOrderInput): Promise<Order> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function listOrders(_filter?: ListOrdersFilter): Promise<Order[]> {
  throw new Error(NOT_IMPLEMENTED)
}
export async function updateOrderStatus(_id: string, _status: Order["status"]): Promise<Order | null> {
  throw new Error(NOT_IMPLEMENTED)
}
