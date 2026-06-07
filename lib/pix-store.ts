// Fonte única dos pagamentos PIX, compartilhada entre /api/pix e /api/checkout.
// Substituir por banco de dados em produção.

import type { Product } from "@/lib/stock-store"

export interface PixPayment {
  id: string
  amount: number
  status: "pending" | "paid" | "expired"
  pixCode: string
  qrCodeUrl: string
  createdAt: Date
  expiresAt: Date
  userEmail?: string
  userId?: string
  userName?: string
  // "recharge" credita saldo ao confirmar; "purchase" entrega os cartões.
  purpose: "recharge" | "purchase"
  // Recarga: marca se o saldo já foi creditado (idempotência).
  credited?: boolean
  // Compra: marca se os cartões já foram entregues (idempotência).
  delivered?: boolean
  // Compra: cartões reservados (já removidos do estoque) aguardando pagamento.
  reservedCards: Product[]
  couponCode?: string
  items: Array<{
    level: string
    brand: string
    quantity: number
    price: number
  }>
}

const globalForPix = globalThis as unknown as { __pixPayments?: PixPayment[] }
const pixPayments: PixPayment[] = globalForPix.__pixPayments ?? (globalForPix.__pixPayments = [])

export function getPixPayments(): PixPayment[] {
  return pixPayments
}

export function addPixPayment(payment: PixPayment): void {
  pixPayments.push(payment)
}

export function findPixPayment(id: string): PixPayment | undefined {
  return pixPayments.find((p) => p.id === id)
}
