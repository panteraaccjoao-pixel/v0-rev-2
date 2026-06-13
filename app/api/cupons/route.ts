import { NextResponse } from "next/server"
import { isAuthenticatedAdmin, isInternalRequest, unauthorizedResponse } from "@/lib/admin-auth"
import {
  listCupons,
  createCupom,
  updateCupom,
  toggleCupomStatus,
  deleteCupom,
  findCupomByCode,
  validateCoupon,
  useCoupon,
} from "@/lib/repositories/cupons"

// Validação/consumo de cupom no servidor (reexportados para o checkout).
// Agora assíncronos, pois consultam o backend (memória ou Supabase).
export async function validateCouponServer(code: string, subtotal: number) {
  return validateCoupon(code, subtotal)
}

export async function useCouponServer(code: string): Promise<boolean> {
  return useCoupon(code)
}

export async function GET(request: Request) {
  // Lista completa de cupons + estatísticas é dado administrativo.
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
  const cupons = await listCupons()

  const ativos = cupons.filter((c) => c.status === "ativo")
  const expirados = cupons.filter((c) => c.status === "expirado")
  const totalUsos = cupons.reduce((acc, c) => acc + c.uses, 0)

  return NextResponse.json({
    cupons,
    stats: {
      total: cupons.length,
      ativos: ativos.length,
      expirados: expirados.length,
      totalUsos,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, cupomId, ...data } = body

    // Apenas a validação de cupom é pública (usada no checkout pelo cliente).
    // Todas as demais ações são administrativas/internas.
    const isPublicAction = action === "validate"
    if (!isPublicAction && !isAuthenticatedAdmin(request) && !isInternalRequest(request)) {
      return unauthorizedResponse()
    }

    if (action === "create") {
      const existing = await findCupomByCode(data.code)
      if (existing) {
        return NextResponse.json({ error: "Código já existe" }, { status: 400 })
      }
      const cupom = await createCupom({
        code: data.code,
        discount: data.discount,
        type: data.type || "percent",
        maxUses: data.maxUses,
        expiry: data.expiry,
      })
      return NextResponse.json({ success: true, cupom })
    }

    if (action === "validate" && data.code) {
      const cupom = await findCupomByCode(data.code)
      if (cupom && cupom.status === "ativo") {
        if (cupom.expiry && new Date(cupom.expiry) < new Date()) {
          return NextResponse.json({ valid: false, error: "Cupom expirado" }, { status: 400 })
        }
        if (cupom.maxUses && cupom.uses >= cupom.maxUses) {
          return NextResponse.json({ valid: false, error: "Cupom esgotado" }, { status: 400 })
        }
        return NextResponse.json({
          valid: true,
          cupom: { code: cupom.code, discount: cupom.discount, type: cupom.type },
        })
      }
      return NextResponse.json({ valid: false, error: "Cupom invalido" }, { status: 400 })
    }

    if (action === "use" && data.code) {
      const ok = await useCoupon(data.code)
      if (ok) {
        const cupom = await findCupomByCode(data.code)
        return NextResponse.json({ success: true, cupom })
      }
      return NextResponse.json({ error: "Cupom inválido ou expirado" }, { status: 400 })
    }

    if (action === "toggle_status" && cupomId) {
      const cupom = await toggleCupomStatus(cupomId)
      if (cupom) return NextResponse.json({ success: true, cupom })
      return NextResponse.json({ error: "Cupom not found" }, { status: 404 })
    }

    if (action === "update" && cupomId) {
      const cupom = await updateCupom(cupomId, {
        discount: data.discount,
        type: data.type,
        maxUses: data.maxUses,
        expiry: data.expiry,
      })
      if (cupom) return NextResponse.json({ success: true, cupom })
      return NextResponse.json({ error: "Cupom not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing cupom:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  const ok = await deleteCupom(id)
  if (!ok) {
    return NextResponse.json({ error: "Cupom not found" }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
