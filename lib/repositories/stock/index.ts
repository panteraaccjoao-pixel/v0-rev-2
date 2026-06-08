// Repositório de estoque — ponto único de acesso.
import { isSupabaseEnabled } from "../backend"
import * as memory from "./stock-memory"
import * as supabase from "./stock-supabase"

const impl = isSupabaseEnabled() ? supabase : memory

export const listStock = impl.listStock
export const addStock = impl.addStock
export const findStockById = impl.findStockById
export const removeStockById = impl.removeStockById
export const updateStock = impl.updateStock
export const findMatchingStock = impl.findMatchingStock
