// Repositório de usuários — ponto único de acesso.
// Seleciona o backend (memória hoje, Supabase no futuro) por env var.
import { isSupabaseEnabled } from "../backend"
import * as memory from "./users-memory"
import * as supabase from "./users-supabase"

const impl = isSupabaseEnabled() ? supabase : memory

export const getUserByEmail = impl.getUserByEmail
export const getUserById = impl.getUserById
export const listUsers = impl.listUsers
export const createUser = impl.createUser
export const verifyLogin = impl.verifyLogin
export const updateUser = impl.updateUser
export const setBalance = impl.setBalance
export const addBalance = impl.addBalance
export const setStatus = impl.setStatus
export const setDiscordId = impl.setDiscordId
export const deleteUser = impl.deleteUser
export const recordPurchase = impl.recordPurchase
