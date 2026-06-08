// Repositório de cupons — ponto único de acesso.
import { isSupabaseEnabled } from "../backend"
import * as memory from "./cupons-memory"
import * as supabase from "./cupons-supabase"

export type {
  CreateCupomInput,
  UpdateCupomInput,
  CouponValidation,
} from "./cupons-memory"

const impl = isSupabaseEnabled() ? supabase : memory

export const listCupons = impl.listCupons
export const findCupomByCode = impl.findCupomByCode
export const createCupom = impl.createCupom
export const updateCupom = impl.updateCupom
export const toggleCupomStatus = impl.toggleCupomStatus
export const deleteCupom = impl.deleteCupom
export const validateCoupon = impl.validateCoupon
export const useCoupon = impl.useCoupon
