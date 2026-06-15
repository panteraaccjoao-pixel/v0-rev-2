import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { findPixPayment } from "@/lib/repositories/pix"
import { confirmPayment } from "@/app/api/pix/route"
import { getInternalSecret } from "@/lib/repositories/admin-session"

// Nonces usados (protege contra replay attacks). Em produção, usar Redis.
const usedNonces = new Map<string, number>()
const NONCE_TTL_MS = 10 * 60 * 1000 // 10 minutos
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000 // 5 minutos

function cleanExpiredNonces() {
  const cutoff = Date.now() - NONCE_TTL_MS
  for (const [nonce, ts] of usedNonces.entries()) {
    if (ts < cutoff) usedNonces.delete(nonce)
  }
}

function isValidWebhookSecret(request: Request): boolean {
  const expected = process.env.WEBHOOK_SECRET
  if (!expected) {
    console.error("[Webhook] WEBHOOK_SECRET não configurado — recusando por segurança.")
    return false
  }
  // Aceita via header (preferido) ou query string (necessário para gateways como VeloraPay
  // que não suportam headers customizados — o secret viaja em HTTPS, não em logs de browser).
  const url = new URL(request.url)
  const provided =
    request.headers.get("x-webhook-secret") ||
    url.searchParams.get("s") ||
    ""
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// Proteção contra replay: valida timestamp e nonce únicos.
function isReplayProtected(request: Request): boolean {
  const timestamp = request.headers.get("x-webhook-timestamp")
  const nonce = request.headers.get("x-webhook-nonce")

  // Se a gateway não envia timestamp nem nonce, exige ao menos que o secret já tenha sido validado.
  // Não retornamos true aqui — sem esses headers qualquer replay com o secret passa; log e continua.
  if (!timestamp && !nonce) {
    console.warn("[Webhook] Sem timestamp/nonce — replay não pode ser detectado. Confie apenas no secret.")
    return true // aceitável quando a gateway não suporta esses headers (VeloraPay)
  }

  if (timestamp) {
    const ts = parseInt(timestamp, 10) * 1000
    if (Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
      console.warn("[Webhook] Timestamp fora da janela — possível replay.")
      return false
    }
  }

  if (nonce) {
    cleanExpiredNonces()
    if (usedNonces.has(nonce)) {
      console.warn("[Webhook] Nonce já utilizado — replay detectado.")
      return false
    }
    usedNonces.set(nonce, Date.now())
  }

  return true
}

function sanitizeForLog(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj
  const sensitive = ["cpf", "cardnumber", "fullcard", "cvv", "password", "token", "secret", "apikey", "birthdate", "ssn"]
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    result[k] = sensitive.some((s) => k.toLowerCase().includes(s)) ? "***" : sanitizeForLog(v)
  }
  return result
}

export async function POST(request: Request) {
  try {
    if (!isValidWebhookSecret(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (!isReplayProtected(request)) {
      return NextResponse.json({ error: "Requisição inválida" }, { status: 400 })
    }

    const payload = await request.json()

    console.log("[Webhook] Payment notification received:", JSON.stringify(sanitizeForLog(payload), null, 2))
    
    // Detect gateway by payload structure
    let paymentData = {
      id: "",
      status: "",
      amount: 0,
      externalId: "",
      payer: "",
      provider: "unknown"
    }
    
    // Mercado Pago
    if (payload.action === "payment.created" || payload.action === "payment.updated") {
      paymentData = {
        id: payload.data?.id || payload.id,
        status: payload.action === "payment.created" ? "pending" : "approved",
        amount: payload.data?.transaction_amount || 0,
        externalId: payload.data?.external_reference || "",
        payer: payload.data?.payer?.email || "",
        provider: "mercadopago"
      }
    }
    
    // Asaas
    if (payload.event?.startsWith("PAYMENT_")) {
      const statusMap: Record<string, string> = {
        "PAYMENT_CREATED": "pending",
        "PAYMENT_RECEIVED": "approved",
        "PAYMENT_CONFIRMED": "approved",
        "PAYMENT_OVERDUE": "expired",
        "PAYMENT_REFUNDED": "refunded"
      }
      paymentData = {
        id: payload.payment?.id,
        status: statusMap[payload.event] || "pending",
        amount: payload.payment?.value || 0,
        externalId: payload.payment?.externalReference || "",
        payer: payload.payment?.customer || "",
        provider: "asaas"
      }
    }
    
    // EfiPay / Gerencianet
    if (payload.pix) {
      paymentData = {
        id: payload.pix[0]?.txid || payload.txid,
        status: "approved",
        amount: parseFloat(payload.pix[0]?.valor || payload.valor || 0),
        externalId: payload.pix[0]?.txid || "",
        payer: payload.pix[0]?.pagador?.nome || "",
        provider: "efipay"
      }
    }
    
    // OpenPix
    if (payload.charge || payload.pixQrCode) {
      const statusMap: Record<string, string> = {
        "ACTIVE": "pending",
        "COMPLETED": "approved",
        "EXPIRED": "expired"
      }
      paymentData = {
        id: payload.charge?.correlationID || payload.pixQrCode?.identifier,
        status: statusMap[payload.charge?.status] || "pending",
        amount: (payload.charge?.value || 0) / 100,
        externalId: payload.charge?.correlationID || "",
        payer: payload.charge?.customer?.name || "",
        provider: "openpix"
      }
    }
    
    // PrimePag / PushinPay (generic structure)
    if (payload.transaction_id || payload.transactionId) {
      paymentData = {
        id: payload.transaction_id || payload.transactionId,
        status: payload.status === "paid" || payload.status === "approved" ? "approved" : payload.status,
        amount: payload.amount || payload.value || 0,
        externalId: payload.external_id || payload.externalId || "",
        payer: payload.payer_email || payload.customer?.email || "",
        provider: payload.provider || "custom"
      }
    }
    
    // Process the payment
    if (paymentData.status === "approved" && paymentData.amount > 0) {
      console.log("[Webhook] Payment approved:", paymentData)

      // Confirma o pagamento no nosso store: credita saldo (recarga)
      // ou entrega os cartões e baixa o estoque (compra).
      const paymentId = paymentData.externalId || paymentData.id
      const payment = paymentId ? await findPixPayment(String(paymentId)) : null

      if (payment && payment.status !== "paid") {
        try {
          await confirmPayment(payment)
          console.log("[Webhook] Payment confirmed and fulfilled:", payment.id, payment.purpose)
        } catch (fulfillError) {
          console.error("[Webhook] Failed to fulfill payment:", fulfillError)
        }
      } else if (!payment) {
        console.warn("[Webhook] Payment not found in store for id:", paymentId)
      }

      // Update dashboard stats in real-time
      try {
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : "http://localhost:3000"
          
        await fetch(`${baseUrl}/api/admin/stats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": getInternalSecret(),
          },
          body: JSON.stringify({
            action: "add_sale",
            data: {
              value: paymentData.amount,
              user: paymentData.payer || "Cliente",
              product: "Recarga PIX"
            }
          })
        })
        
        console.log("[Webhook] Stats updated successfully")
      } catch (statsError) {
        console.error("[Webhook] Failed to update stats:", statsError)
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Webhook] Error processing payment:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// Some gateways send GET request to verify webhook URL
export async function GET() {
  return NextResponse.json({ status: "Webhook is active" })
}
