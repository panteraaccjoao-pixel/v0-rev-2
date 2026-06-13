// Implementação Supabase do repositório de cupons.
// Mantém as mesmas assinaturas do cupons-memory.ts.
import { getSupabaseAdmin } from "../supabase-client"
import type { Cupom } from "../types"
import type {
  CreateCupomInput,
  UpdateCupomInput,
  CouponValidation,
} from "./cupons-memory"

const TABLE = "cupons"

function rowToCupom(row: any): Cupom {
  return {
    id: row.id,
    code: row.code,
    discount: Number(row.discount ?? 0),
    type: (row.type ?? "percent") as Cupom["type"],
    uses: Number(row.uses ?? 0),
    maxUses: row.max_uses ?? null,
    status: (row.status ?? "ativo") as Cupom["status"],
    expiry: row.expiry ?? null,
    createdAt: row.created_at,
  }
}

export async function listCupons(): Promise<Cupom[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(`listCupons: ${error.message}`)
  return (data ?? []).map(rowToCupom)
}

export async function findCupomByCode(code: string): Promise<Cupom | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle()
  if (error) throw new Error(`findCupomByCode: ${error.message}`)
  return data ? rowToCupom(data) : null
}

export async function createCupom(data: CreateCupomInput): Promise<Cupom> {
  const supabase = getSupabaseAdmin()
  const row = {
    id: `cupom_${Date.now()}`,
    code: data.code.toUpperCase(),
    discount: parseFloat(String(data.discount)),
    type: data.type || "percent",
    uses: 0,
    max_uses: data.maxUses ? parseInt(String(data.maxUses)) : null,
    status: "ativo",
    expiry: data.expiry || null,
    created_at: new Date().toISOString(),
  }
  const { data: inserted, error } = await supabase.from(TABLE).insert(row).select("*").single()
  if (error) throw new Error(`createCupom: ${error.message}`)
  return rowToCupom(inserted)
}

export async function updateCupom(id: string, data: UpdateCupomInput): Promise<Cupom | null> {
  const supabase = getSupabaseAdmin()
  const row: Record<string, any> = {}
  if (data.discount !== undefined) row.discount = parseFloat(String(data.discount))
  if (data.type) row.type = data.type
  if (data.maxUses !== undefined) row.max_uses = data.maxUses ? parseInt(String(data.maxUses)) : null
  if (data.expiry !== undefined) row.expiry = data.expiry || null

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw new Error(`updateCupom: ${error.message}`)
  return updated ? rowToCupom(updated) : null
}

export async function toggleCupomStatus(id: string): Promise<Cupom | null> {
  const supabase = getSupabaseAdmin()
  const current = await supabase.from(TABLE).select("status").eq("id", id).maybeSingle()
  if (current.error) throw new Error(`toggleCupomStatus: ${current.error.message}`)
  if (!current.data) return null
  const next = current.data.status === "ativo" ? "desativado" : "ativo"
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: next })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw new Error(`toggleCupomStatus: ${error.message}`)
  return data ? rowToCupom(data) : null
}

export async function deleteCupom(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select("id")
  if (error) throw new Error(`deleteCupom: ${error.message}`)
  return (data ?? []).length > 0
}

export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponValidation | null> {
  if (!code) return null
  const cupom = await findCupomByCode(code)
  if (!cupom || cupom.status !== "ativo") return null
  if (cupom.expiry && new Date(cupom.expiry) < new Date()) return null
  if (cupom.maxUses && cupom.uses >= cupom.maxUses) return null

  const discountAmount =
    cupom.type === "percent" ? subtotal * (cupom.discount / 100) : Math.min(cupom.discount, subtotal)

  return {
    code: cupom.code,
    discount: cupom.discount,
    type: cupom.type,
    discountAmount: Math.max(0, discountAmount),
  }
}

// Consome o cupom de forma atômica via RPC (incrementa uses e expira se atingir
// max_uses). Retorna true se consumiu um cupom ativo e válido.
export async function useCoupon(code: string): Promise<boolean> {
  if (!code) return false
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc("use_coupon", { p_code: code.toUpperCase() })
  if (error) throw new Error(`useCoupon: ${error.message}`)
  return data === true
}
