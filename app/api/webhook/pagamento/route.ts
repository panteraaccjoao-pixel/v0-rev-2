import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { findPixPayment } from "@/lib/repositories/pix"
import { confirmPayment } from "@/app/api/pix/route"
import { getInternalSecret } from "@/lib/repositories/admin-session"

// This webhook receives payment notifications from your gateway
// Configure this URL in your gateway's webhook settings

// Valida o segredo do webhook. A gateway precisa enviar o segredo via header
// `x-webhook-secret` OU via query string `?secret=...` (configurado na URL do
// webhook no painel da gateway). Sem isso, QUALQUER pessoa poderia falsificar
// uma confirmação de pagamento e receber os cartões sem pagar.
// Fail-closed: se WEBHOOK_SECRET não estiver definido, recusa tudo.
function isValidWebhookSecret(request: Request): boolean {
  const expected = process.env.WEBHOOK_SECRET
  if (!expected) {
    console.error("[Webhook] WEBHOOK_SECRET não configurado — recusando por segurança.")
    return false
  }
  const url = new URL(request.url)
  const provided =
    request.headers.get("x-webhook-secret") ||
    url.searchParams.get("secret") ||
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

export async function POST(request: Request) {
  try {
    // Bloqueia qualquer chamada que não comprove o segredo do webhook.
    if (!isValidWebhookSecret(request)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const payload = await request.json()
    
    console.log("[Webhook] Payment notification received:", JSON.stringify(payload, null, 2))
    
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
    
    return NextResponse.json({ received: true, data: paymentData })
  } catch (error) {
    console.error("[Webhook] Error processing payment:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// Some gateways send GET request to verify webhook URL
export async function GET() {
  return NextResponse.json({ status: "Webhook is active" })
}
