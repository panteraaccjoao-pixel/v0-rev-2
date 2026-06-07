import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIP } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/security"
import { createPix } from "@/lib/pix-gateway"
import { addBalance } from "@/app/api/user/balance/route"
import { isAuthenticatedAdmin, isInternalRequest, unauthorizedResponse } from "@/lib/admin-auth"

// In-memory storage for PIX payments
interface PixPayment {
  id: string
  amount: number
  status: "pending" | "paid" | "expired"
  pixCode: string
  qrCodeUrl: string
  createdAt: Date
  expiresAt: Date
  userEmail?: string
  userId?: string
  credited?: boolean
  items: Array<{
    level: string
    brand: string
    quantity: number
    price: number
  }>
}

export const pixPayments: PixPayment[] = []

// POST - Create new PIX payment (usa a gateway real configurada, ex: VeloraPay)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for PIX creation
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(clientIP, "pix")
    
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetIn)
    }

    const data = await request.json()
    const { amount, items, userId, userEmail } = data

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor invalido" }, { status: 400 })
    }

    // Gera o PIX real na gateway configurada (ou fallback estático em testes)
    const pix = await createPix({ amount, userId, userEmail })

    // Imagem do QR Code: a gateway retorna base64/data URL; se não, geramos via API pública
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
      credited: false,
      items: items || []
    }

    pixPayments.push(payment)

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        pixCode: payment.pixCode,
        qrCodeUrl: payment.qrCodeUrl,
        expiresAt: payment.expiresAt
      }
    })
  } catch (error) {
    console.error("Error creating PIX payment:", error)
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 })
  }
}

// GET - Check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID do pagamento obrigatorio" }, { status: 400 })
    }

    const payment = pixPayments.find(p => p.id === id)

    if (!payment) {
      return NextResponse.json({ error: "Pagamento nao encontrado" }, { status: 404 })
    }

    // Check if expired
    if (payment.status === "pending" && new Date() > payment.expiresAt) {
      payment.status = "expired"
    }

    return NextResponse.json({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      expiresAt: payment.expiresAt
    })
  } catch (error) {
    console.error("Error checking payment:", error)
    return NextResponse.json({ error: "Erro ao verificar pagamento" }, { status: 500 })
  }
}

// PATCH - Confirma/cancela pagamento.
// Restrito a admin autenticado ou chamada interna (ex: webhook da gateway).
// O crédito de saldo acontece aqui no servidor, nunca no client.
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

    const payment = pixPayments.find(p => p.id === id)

    if (!payment) {
      return NextResponse.json({ error: "Pagamento nao encontrado" }, { status: 404 })
    }

    if (action === "confirm") {
      payment.status = "paid"
      // Credita o saldo do dono do pagamento apenas uma vez
      if (!payment.credited && payment.userEmail) {
        await addBalance(payment.userEmail, payment.amount)
        payment.credited = true
      }
      return NextResponse.json({ success: true, status: "paid" })
    }

    if (action === "cancel") {
      payment.status = "expired"
      return NextResponse.json({ success: true, status: "expired" })
    }

    return NextResponse.json({ error: "Acao invalida" }, { status: 400 })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Erro ao atualizar pagamento" }, { status: 500 })
  }
}
