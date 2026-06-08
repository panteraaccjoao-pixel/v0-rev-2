// Implementação em memória do repositório de cupons.
import state from "../memory-state"
import type { Cupom } from "../types"

export interface CreateCupomInput {
  code: string
  discount: number | string
  type?: "percent" | "fixed"
  maxUses?: number | string | null
  expiry?: string | null
}

export interface UpdateCupomInput {
  discount?: number | string
  type?: "percent" | "fixed"
  maxUses?: number | string | null
  expiry?: string | null
}

export interface CouponValidation {
  code: string
  discount: number
  type: "percent" | "fixed"
  discountAmount: number
}

// Marca como expirados os cupons vencidos / esgotados (efeito colateral leve).
function refreshExpired(): void {
  const now = new Date()
  for (const c of state.cupons) {
    if (c.status === "ativo") {
      if (c.expiry && new Date(c.expiry) < now) c.status = "expirado"
      else if (c.maxUses && c.uses >= c.maxUses) c.status = "expirado"
    }
  }
}

export async function listCupons(): Promise<Cupom[]> {
  refreshExpired()
  return [...state.cupons].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function findCupomByCode(code: string): Promise<Cupom | null> {
  return state.cupons.find((c) => c.code === code.toUpperCase()) ?? null
}

export async function createCupom(data: CreateCupomInput): Promise<Cupom> {
  const cupom: Cupom = {
    id: `cupom_${Date.now()}`,
    code: data.code.toUpperCase(),
    discount: parseFloat(String(data.discount)),
    type: data.type || "percent",
    uses: 0,
    maxUses: data.maxUses ? parseInt(String(data.maxUses)) : null,
    status: "ativo",
    expiry: data.expiry || null,
    createdAt: new Date().toISOString(),
  }
  state.cupons.push(cupom)
  return cupom
}

export async function updateCupom(id: string, data: UpdateCupomInput): Promise<Cupom | null> {
  const cupom = state.cupons.find((c) => c.id === id)
  if (!cupom) return null
  if (data.discount !== undefined) cupom.discount = parseFloat(String(data.discount))
  if (data.type) cupom.type = data.type
  if (data.maxUses !== undefined) cupom.maxUses = data.maxUses ? parseInt(String(data.maxUses)) : null
  if (data.expiry !== undefined) cupom.expiry = data.expiry || null
  return cupom
}

export async function toggleCupomStatus(id: string): Promise<Cupom | null> {
  const cupom = state.cupons.find((c) => c.id === id)
  if (!cupom) return null
  cupom.status = cupom.status === "ativo" ? "desativado" : "ativo"
  return cupom
}

export async function deleteCupom(id: string): Promise<boolean> {
  const index = state.cupons.findIndex((c) => c.id === id)
  if (index === -1) return false
  state.cupons.splice(index, 1)
  return true
}

// Valida um cupom e calcula o desconto para um subtotal. NÃO consome.
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponValidation | null> {
  if (!code) return null
  const cupom = state.cupons.find((c) => c.code === code.toUpperCase() && c.status === "ativo")
  if (!cupom) return null
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

// Consome (incrementa o uso de) um cupom. Retorna true se consumiu.
export async function useCoupon(code: string): Promise<boolean> {
  if (!code) return false
  const cupom = state.cupons.find((c) => c.code === code.toUpperCase() && c.status === "ativo")
  if (!cupom) return false
  cupom.uses++
  if (cupom.maxUses && cupom.uses >= cupom.maxUses) cupom.status = "expirado"
  return true
}
