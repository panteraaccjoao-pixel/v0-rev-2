// Repositório de pagamentos PIX — ponto único de acesso.
import { isSupabaseEnabled } from "../backend"
import * as memory from "./pix-memory"
import * as supabase from "./pix-supabase"

const impl = isSupabaseEnabled() ? supabase : memory

export const addPixPayment = impl.addPixPayment
export const findPixPayment = impl.findPixPayment
export const listPixPayments = impl.listPixPayments
export const updatePixPayment = impl.updatePixPayment
