import { NextResponse } from "next/server"

interface Cupom {
  id: string
  code: string
  discount: number
  type: "percent" | "fixed"
  uses: number
  maxUses: number | null
  status: "ativo" | "expirado" | "desativado"
  expiry: string | null
  createdAt: string
}

// In-memory storage for cupons
const globalForCupons = globalThis as unknown as { __cuponsStore?: Cupom[] }
const cupons: Cupom[] = globalForCupons.__cuponsStore ?? (globalForCupons.__cuponsStore = [])

// Valida um cupom no servidor e retorna o desconto calculado para um subtotal.
// Não consome o cupom. Retorna null se inválido.
export function validateCouponServer(
  code: string,
  subtotal: number,
): { code: string; discount: number; type: "percent" | "fixed"; discountAmount: number } | null {
  if (!code) return null
  const cupom = cupons.find((c) => c.code === code.toUpperCase() && c.status === "ativo")
  if (!cupom) return null
  if (cupom.expiry && new Date(cupom.expiry) < new Date()) return null
  if (cupom.maxUses && cupom.uses >= cupom.maxUses) return null

  const discountAmount =
    cupom.type === "percent"
      ? subtotal * (cupom.discount / 100)
      : Math.min(cupom.discount, subtotal)

  return {
    code: cupom.code,
    discount: cupom.discount,
    type: cupom.type,
    discountAmount: Math.max(0, discountAmount),
  }
}

// Consome (incrementa o uso de) um cupom no servidor.
export function useCouponServer(code: string): boolean {
  if (!code) return false
  const cupom = cupons.find((c) => c.code === code.toUpperCase() && c.status === "ativo")
  if (!cupom) return false
  cupom.uses++
  if (cupom.maxUses && cupom.uses >= cupom.maxUses) {
    cupom.status = "expirado"
  }
  return true
}

export async function GET() {
  // Check and update expired coupons
  const now = new Date()
  cupons.forEach(cupom => {
    if (cupom.expiry && new Date(cupom.expiry) < now && cupom.status === "ativo") {
      cupom.status = "expirado"
    }
    if (cupom.maxUses && cupom.uses >= cupom.maxUses && cupom.status === "ativo") {
      cupom.status = "expirado"
    }
  })

  const ativos = cupons.filter(c => c.status === "ativo")
  const expirados = cupons.filter(c => c.status === "expirado")
  const totalUsos = cupons.reduce((acc, c) => acc + c.uses, 0)

  return NextResponse.json({
    cupons: cupons.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    stats: {
      total: cupons.length,
      ativos: ativos.length,
      expirados: expirados.length,
      totalUsos
    }
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, cupomId, ...data } = body

    if (action === "create") {
      // Check if code already exists
      if (cupons.some(c => c.code === data.code.toUpperCase())) {
        return NextResponse.json({ error: "Código já existe" }, { status: 400 })
      }

      const newCupom: Cupom = {
        id: `cupom_${Date.now()}`,
        code: data.code.toUpperCase(),
        discount: parseFloat(data.discount),
        type: data.type || "percent",
        uses: 0,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        status: "ativo",
        expiry: data.expiry || null,
        createdAt: new Date().toISOString()
      }
      cupons.push(newCupom)
      return NextResponse.json({ success: true, cupom: newCupom })
    }

    if (action === "validate" && data.code) {
      const cupom = cupons.find(c => c.code === data.code.toUpperCase() && c.status === "ativo")
      if (cupom) {
        // Check expiry
        if (cupom.expiry && new Date(cupom.expiry) < new Date()) {
          return NextResponse.json({ valid: false, error: "Cupom expirado" }, { status: 400 })
        }
        // Check max uses
        if (cupom.maxUses && cupom.uses >= cupom.maxUses) {
          return NextResponse.json({ valid: false, error: "Cupom esgotado" }, { status: 400 })
        }
        return NextResponse.json({ 
          valid: true, 
          cupom: {
            code: cupom.code,
            discount: cupom.discount,
            type: cupom.type
          }
        })
      }
      return NextResponse.json({ valid: false, error: "Cupom invalido" }, { status: 400 })
    }

    if (action === "use" && data.code) {
      const cupom = cupons.find(c => c.code === data.code.toUpperCase() && c.status === "ativo")
      if (cupom) {
        cupom.uses++
        if (cupom.maxUses && cupom.uses >= cupom.maxUses) {
          cupom.status = "expirado"
        }
        return NextResponse.json({ success: true, cupom })
      }
      return NextResponse.json({ error: "Cupom inválido ou expirado" }, { status: 400 })
    }

    if (action === "toggle_status" && cupomId) {
      const cupom = cupons.find(c => c.id === cupomId)
      if (cupom) {
        cupom.status = cupom.status === "ativo" ? "desativado" : "ativo"
        return NextResponse.json({ success: true, cupom })
      }
      return NextResponse.json({ error: "Cupom not found" }, { status: 404 })
    }

    if (action === "update" && cupomId) {
      const cupom = cupons.find(c => c.id === cupomId)
      if (cupom) {
        if (data.discount !== undefined) cupom.discount = parseFloat(data.discount)
        if (data.type) cupom.type = data.type
        if (data.maxUses !== undefined) cupom.maxUses = data.maxUses ? parseInt(data.maxUses) : null
        if (data.expiry !== undefined) cupom.expiry = data.expiry || null
        return NextResponse.json({ success: true, cupom })
      }
      return NextResponse.json({ error: "Cupom not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing cupom:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  const index = cupons.findIndex(c => c.id === id)
  if (index === -1) {
    return NextResponse.json({ error: "Cupom not found" }, { status: 404 })
  }

  cupons.splice(index, 1)
  return NextResponse.json({ success: true })
}
