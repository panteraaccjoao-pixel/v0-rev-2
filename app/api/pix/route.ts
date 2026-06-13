import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/security"
import { createPix } from "@/lib/pix-gateway"
import { addBalance } from "@/app/api/user/balance/route"
import { isAuthenticatedAdmin, isInternalRequest, unauthorizedResponse } from "@/lib/admin-auth"
import { requireUser } from "@/lib/user-auth"
import {
  addPixPayment,
  findPixPayment,
  updatePixPayment,
} from "@/lib/repositories/pix"
import { findMatchingStock, removeStockById } from "@/lib/repositories/stock"
import type { PixPayment, Product } from "@/lib/repositories/types"
import { fulfillDelivery, type DeliveredCard } from "@/lib/fulfillment"

// Confirma um pagamento: credita saldo (recarga) ou entrega cartões (compra).
// Idempotente e seguro para ser chamado por PATCH e pelo webhook da gateway.
export async function confirmPayment(payment: PixPayment): Promise<DeliveredCard[]> {
  if (payment.purpose === "recharge") {
    if (!payment.credited && payment.userEmail) {
      await addBalance(payment.userEmail, payment.amount)
      await updatePixPayment(payment.id, { status: "paid", credited: true })
    } else {
      await updatePixPayment(payment.id, { status: "paid" })
    }
    return []
  }

  await updatePixPayment(payment.id, { status: "paid" })
  return deliverPurchase(payment)
}

// Entrega os cartões de uma compra paga (idempotente).
// Como os cartões NÃO são reservados no checkout, a baixa do estoque acontece
// aqui, no momento da confirmação do pagamento. Para cada cartão selecionado,
// tentamos removê-lo do estoque; se já tiver sido vendido nesse intervalo,
// buscamos um substituto equivalente (mesmo nível/bandeira).
async function deliverPurchase(payment: PixPayment): Promise<DeliveredCard[]> {
  if (payment.purpose !== "purchase") return []
  if (payment.delivered) {
    // Já entregue: reconstrói a view a partir dos cartões já vendidos.
    return payment.reservedCards.map((c) => ({
      id: c.id,
      fullCard: c.fullCard,
      cvv: c.cvv,
      expiry: c.expiry,
      bin: c.bin,
      bank: c.bank,
      level: c.level,
      brand: c.brand,
      price: c.price,
      holderName: c.holderName,
      cpf: c.cpf,
      birthDate: c.birthDate,
    }))
  }

  // Baixa o estoque agora (pagamento aprovado).
  const soldCards: Product[] = []
  const usedIds = new Set<string>()
  for (const card of payment.reservedCards) {
    let removed = await removeStockById(card.id)
    // Cartão original já vendido? Tenta um substituto equivalente.
    if (!removed) {
      const matching = await findMatchingStock(card.level, card.brand)
      const candidate = matching.find((p) => !usedIds.has(p.id))
      if (candidate) removed = await removeStockById(candidate.id)
    }
    if (removed) {
      soldCards.push(removed)
      usedIds.add(removed.id)
    }
  }

  // Persiste os cartões efetivamente vendidos (para reconstruir a entrega depois).
  const delivered = await fulfillDelivery({
    cards: soldCards,
    userEmail: payment.userEmail,
    userId: payment.userId,
    userName: payment.userName,
  })
  await updatePixPayment(payment.id, { delivered: true, reservedCards: soldCards })
  return delivered
}

// POST - Cria pagamento PIX (usado pela recarga de saldo).
// Para compras de produto, use /api/checkout.
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(clientIP, "pix")
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    // Exige usuário autenticado. A recarga é creditada no PRÓPRIO usuário.
    const session = requireUser(request)
    if (!session) {
      return unauthorizedResponse()
    }
    const userEmail = session.email.toLowerCase()
    const userId = session.uid

    const data = await request.json()
    const { amount, items } = data

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor invalido" }, { status: 400 })
    }

    const pix = await createPix({ amount, userId, userEmail })

    const qrCodeUrl =
      pix.qrCodeBase64 ||
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pix.pixCode)}`

    const payment: PixPayment = {
      id: pix.txId,
      amount,
      status: "pending",
      pixCode: pix.pixCode,
      qrCodeUrl,
      createdAt: new Date(),
      expiresAt: pix.expiresAt ? new Date(pix.expiresAt) : new Date(Date.now() + 30 * 60 * 1000),
      userEmail: userEmail ? String(userEmail).toLowerCase() : undefined,
      userId: userId || undefined,
      purpose: "recharge",
      credited: false,
      reservedCards: [],
      items: items || [],
    }

    await addPixPayment(payment)

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        pixCode: payment.pixCode,
        qrCodeUrl: payment.qrCodeUrl,
        expiresAt: payment.expiresAt,
      },
    })
  } catch (error) {
    console.error("Error creating PIX payment:", error)
    console.log("[v0] PIX create error detail:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 })
  }
}

// GET - Verifica status do pagamento.
// Para compras pagas, retorna também os cartões entregues.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID do pagamento obrigatorio" }, { status: 400 })
    }

    const payment = await findPixPayment(id)

    if (!payment) {
      return NextResponse.json({ error: "Pagamento nao encontrado" }, { status: 404 })
    }

    // Marca como expirado se passou do prazo.
    if (payment.status === "pending" && new Date() > payment.expiresAt) {
      await updatePixPayment(payment.id, { status: "expired" })
      payment.status = "expired"
      // Nada a devolver: o estoque só é debitado na confirmação do pagamento.
    }

    const response: {
      id: string
      amount: number
      status: string
      expiresAt: Date
      purpose: string
      cards?: DeliveredCard[]
    } = {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      expiresAt: payment.expiresAt,
      purpose: payment.purpose,
    }

    // Se a compra já foi paga, garante a entrega e devolve os cartões.
    if (payment.status === "paid" && payment.purpose === "purchase") {
      response.cards = await deliverPurchase(payment)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error checking payment:", error)
    return NextResponse.json({ error: "Erro ao verificar pagamento" }, { status: 500 })
  }
}

// PATCH - Confirma/cancela pagamento.
// Restrito a admin autenticado ou chamada interna (ex: webhook da gateway).
// Recarga: credita saldo. Compra: entrega os cartões. Tudo no servidor.
export async function PATCH(request: NextRequest) {
  if (!isAuthenticatedAdmin(request) && !isInternalRequest(request)) {
    return unauthorizedResponse()
  }
  try {
    const data = await request.json()
    const { id, action } = data

    if (!id) {
      return NextResponse.json({ error: "ID do pagamento obrigatorio" }, { status: 400 })
    }

    const payment = await findPixPayment(id)

    if (!payment) {
      return NextResponse.json({ error: "Pagamento nao encontrado" }, { status: 404 })
    }

    if (action === "confirm") {
      const cards = await confirmPayment(payment)
      if (payment.purpose === "recharge") {
        return NextResponse.json({ success: true, status: "paid" })
      }
      return NextResponse.json({ success: true, status: "paid", cards })
    }

    if (action === "cancel") {
      await updatePixPayment(payment.id, { status: "expired" })
      // Nada a devolver: o estoque só é debitado na confirmação do pagamento.
      return NextResponse.json({ success: true, status: "expired" })
    }

    return NextResponse.json({ error: "Acao invalida" }, { status: 400 })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Erro ao atualizar pagamento" }, { status: 500 })
  }
}
