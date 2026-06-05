import { NextRequest, NextResponse } from "next/server"

// Get secret key from environment (used for API authentication)
const PIX_SECRET_KEY = process.env.PIX_SECRET_KEY

// In-memory storage for PIX payments
interface PixPayment {
  id: string
  amount: number
  status: "pending" | "paid" | "expired"
  pixCode: string
  qrCodeUrl: string
  createdAt: Date
  expiresAt: Date
  items: Array<{
    level: string
    brand: string
    quantity: number
    price: number
  }>
}

export const pixPayments: PixPayment[] = []

// Generate a fake PIX code (in production, this would come from a payment provider)
function generatePixCode(amount: number, paymentId: string): string {
  const baseCode = "00020126580014br.gov.bcb.pix0136"
  const randomKey = `${paymentId}-${Date.now()}`
  const formattedAmount = amount.toFixed(2).replace(".", "")
  return `${baseCode}${randomKey}5204000053039865404${formattedAmount}5802BR5925REVSYSTEM6009SAO PAULO62140510${paymentId}6304`
}

// Generate QR code URL using a free QR code API
function generateQRCodeUrl(pixCode: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`
}

// POST - Create new PIX payment
export async function POST(request: NextRequest) {
  try {
    // PIX_SECRET_KEY is optional - will be used when integrating with real payment gateway
    // For now, we generate mock PIX codes for testing
    
    const data = await request.json()
    const { amount, items } = data

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valor invalido" }, { status: 400 })
    }

    const paymentId = `PIX${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const pixCode = generatePixCode(amount, paymentId)
    const qrCodeUrl = generateQRCodeUrl(pixCode)

    const payment: PixPayment = {
      id: paymentId,
      amount,
      status: "pending",
      pixCode,
      qrCodeUrl,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
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

// PATCH - Simulate payment confirmation (for testing)
export async function PATCH(request: NextRequest) {
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
