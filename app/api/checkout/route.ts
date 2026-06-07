import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/security"
import { createPix } from "@/lib/pix-gateway"
import { getUserByEmail, setBalance } from "@/lib/repositories/users"
import { findMatchingStock, removeStockById } from "@/lib/repositories/stock"
import { addPixPayment } from "@/lib/repositories/pix"
import type { Product, PixPayment } from "@/lib/repositories/types"
import { validateCouponServer, useCouponServer } from "@/app/api/cupons/route"
import { fulfillDelivery } from "@/lib/fulfillment"

interface CheckoutItem {
  level: string
  brand: string
  quantity: number
}

// POST - Processa o checkout de uma compra.
// 1. Calcula o total no servidor a partir do estoque real (preço confiável).
// 2. Aplica cupom (validado no servidor).
// 3. Se o usuário tem saldo suficiente: desconta o saldo, baixa o estoque e
//    entrega os cartões imediatamente.
// 4. Se não tem saldo: gera o PIX e reserva os cartões (remove do estoque)
//    até o pagamento ser confirmado.
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(clientIP, "pix")
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const body = await request.json()
    const { items, couponCode, userEmail, userId, userName } = body as {
      items: CheckoutItem[]
      couponCode?: string
      userEmail?: string
      userId?: string
      userName?: string
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 })
    }

    // 1. Seleciona cartões reais do estoque para cada item e calcula o subtotal.
    const selectedCards: Product[] = []
    const usedIds = new Set<string>()

    for (const item of items) {
      const matching = await findMatchingStock(item.level, item.brand)
      const available = matching.filter((p) => !usedIds.has(p.id))
      const qty = Math.max(1, Number(item.quantity) || 1)

      if (available.length < qty) {
        return NextResponse.json(
          { error: `Estoque insuficiente para ${item.level} ${item.brand}` },
          { status: 409 },
        )
      }

      for (let i = 0; i < qty; i++) {
        selectedCards.push(available[i])
        usedIds.add(available[i].id)
      }
    }

    const subtotal = selectedCards.reduce((sum, c) => sum + Number(c.price ?? 0), 0)

    // 2. Aplica cupom (validado no servidor).
    let discountAmount = 0
    let validCoupon: ReturnType<typeof validateCouponServer> = null
    if (couponCode) {
      validCoupon = validateCouponServer(couponCode, subtotal)
      if (validCoupon) {
        discountAmount = validCoupon.discountAmount
      }
    }

    const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100)

    const profile = userEmail ? await getUserByEmail(userEmail) : null
    const balance = Number(profile?.balance ?? 0)

    // 3. Pagamento com saldo (cobre total, inclusive total = 0).
    if (profile && balance >= total) {
      // Desconta o saldo.
      await setBalance(profile.id, balance - total)

      // Baixa o estoque (remove os cartões vendidos).
      const removed: Product[] = []
      for (const card of selectedCards) {
        const r = await removeStockById(card.id)
        if (r) removed.push(r)
      }

      // Consome o cupom.
      if (validCoupon) useCouponServer(validCoupon.code)

      // Entrega: cria pedidos e atualiza estatísticas.
      const delivered = await fulfillDelivery({
        cards: removed,
        userEmail,
        userId,
        userName,
      })

      return NextResponse.json({
        success: true,
        method: "balance",
        paid: true,
        cards: delivered,
        total,
        newBalance: balance - total,
      })
    }

    // 4. Sem saldo suficiente: gera PIX e reserva os cartões.
    if (total <= 0) {
      return NextResponse.json({ error: "Valor inválido para pagamento" }, { status: 400 })
    }

    const pix = await createPix({ amount: total, userId, userEmail })

    const qrCodeUrl =
      pix.qrCodeBase64 ||
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pix.pixCode)}`

    // Reserva os cartões removendo-os do estoque (evita venda dupla).
    const reservedCards: Product[] = []
    for (const card of selectedCards) {
      const r = await removeStockById(card.id)
      if (r) reservedCards.push(r)
    }

    const payment: PixPayment = {
      id: pix.txId,
      amount: total,
      status: "pending",
      pixCode: pix.pixCode,
      qrCodeUrl,
      createdAt: new Date(),
      expiresAt: pix.expiresAt ? new Date(pix.expiresAt) : new Date(Date.now() + 30 * 60 * 1000),
      userEmail: userEmail ? String(userEmail).toLowerCase() : undefined,
      userId: userId || undefined,
      userName: userName || undefined,
      purpose: "purchase",
      delivered: false,
      reservedCards,
      couponCode: validCoupon?.code,
      items: items.map((i) => ({
        level: i.level,
        brand: i.brand,
        quantity: Math.max(1, Number(i.quantity) || 1),
        price: 0,
      })),
    }

    await addPixPayment(payment)

    return NextResponse.json({
      success: true,
      method: "pix",
      paid: false,
      payment: {
        id: payment.id,
        amount: payment.amount,
        pixCode: payment.pixCode,
        qrCodeUrl: payment.qrCodeUrl,
        expiresAt: payment.expiresAt,
      },
    })
  } catch (error) {
    console.error("Error processing checkout:", error)
    return NextResponse.json({ error: "Erro ao processar checkout" }, { status: 500 })
  }
}
