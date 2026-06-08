// Repositório de logins — ponto único de acesso.
// Seleciona o backend (memória ou Supabase) por env var.
import { isSupabaseEnabled } from "../backend"
import * as memory from "./logins-memory"
import * as supabase from "./logins-supabase"

export type {
  LoginRecord,
  AddLoginInput,
  LoginStats,
  ListLoginsResult,
} from "./logins-memory"

const impl = isSupabaseEnabled() ? supabase : memory

export const addLoginRecord = impl.addLoginRecord
export const listLoginRecords = impl.listLoginRecords
export const clearLoginRecords = impl.clearLoginRecords
