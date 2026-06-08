// Repositório de settings/config/admins — ponto único de acesso.
import { isSupabaseEnabled } from "../backend"
import * as memory from "./settings-memory"
import * as supabase from "./settings-supabase"

const impl = isSupabaseEnabled() ? supabase : memory

export const getConfig = impl.getConfig
export const saveConfig = impl.saveConfig
export const getSettings = impl.getSettings
export const saveSettings = impl.saveSettings
export const findAdminByEmail = impl.findAdminByEmail
export const changeAdminPassword = impl.changeAdminPassword
