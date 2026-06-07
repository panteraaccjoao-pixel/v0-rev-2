// Repositório de pedidos — ponto único de acesso.
import { isSupabaseEnabled } from "../backend"
import * as memory from "./orders-memory"
import * as supabase from "./orders-supabase"

const impl = isSupabaseEnabled() ? supabase : memory

export const createOrder = impl.createOrder
export const listOrders = impl.listOrders
export const updateOrderStatus = impl.updateOrderStatus
