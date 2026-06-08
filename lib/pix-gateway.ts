"use server"

import QRCode from "qrcode"
import { getGatewayConfigRaw } from "@/app/api/admin/config/route"

// Gateway URLs by provider
const GATEWAY_URLS: Record<string, { sandbox: string; production: string }> = {
  mercadopago: {
    sandbox: "https://api.mercadopago.com",
    production: "https://api.mercadopago.com",
  },
  pagseguro: {
    sandbox: "https://sandbox.api.pagseguro.com",
    production: "https://api.pagseguro.com",
  },
  asaas: {
    sandbox: "https://sandbox.asaas.com/api/v3",
    production: "https://api.asaas.com/api/v3",
  },
  efipay: {
    sandbox: "https://pix-h.api.efipay.com.br",
    production: "https://pix.api.efipay.com.br",
  },
  openpix: {
    sandbox: "https://api.openpix.com.br/api/v1",
    production: "https://api.openpix.com.br/api/v1",
  },
  primepag: {
    sandbox: "https://api.primepag.com.br",
    production: "https://api.primepag.com.br",
  },
  pushinpay: {
    sandbox: "https://api.pushinpay.com.br/api/pix",
    production: "https://api.pushinpay.com.br/api/pix",
  },
  velorapay: {
    sandbox: "https://api.velorapay.com.br",
    production: "https://api.velorapay.com.br",
  },
}

export interface PixResult {
  success: boolean
  pixCode: string
  qrCodeBase64: string
  expiresAt: string
  txId: string
  gatewayId?: string
}

// Considera mascarada qualquer chave salva no formato "***1234".
// Nunca usamos uma chave mascarada como credencial real.
function isMaskedKey(value?: string) {
  return typeof value === "string" && value.startsWith("***")
}

// Obtém a configuração da gateway.
// Prioridade: 1) painel admin  2) variáveis de ambiente (VeloraPay) como fallback.
export async function getGatewayConfig() {
  // 1. Painel admin tem prioridade (configurável pela interface sem mexer no deploy).
  // Se a leitura falhar (banco indisponível, tabela ausente etc.), não derruba a
  // geração de PIX: apenas seguimos para o fallback das variáveis de ambiente.
  let adminConfig: Record<string, any> | null = null
  try {
    adminConfig = await getGatewayConfigRaw()
  } catch (err) {
    console.error("[v0] Falha ao ler config do gateway (usando fallback de env):", err)
    adminConfig = null
  }
  if (
    adminConfig?.gateway &&
    adminConfig?.apiKey &&
    !isMaskedKey(adminConfig.apiKey) &&
    !isMaskedKey(adminConfig.secretKey)
  ) {
    return {
      gateway: adminConfig.gateway,
      environment: adminConfig.environment || "sandbox",
      apiKey: adminConfig.apiKey,
      secretKey: adminConfig.secretKey || "",
      pixKey: adminConfig.pixKey || "",
    }
  }

  // 2. Fallback: variáveis de ambiente (VeloraPay)
  const veloraPublic = process.env.VELORAPAY_API_KEYPUBLIC
  const veloraSecret = process.env.VELORAPAY_API_KEYSECRET

  if (veloraPublic && veloraSecret) {
    return {
      gateway: "velorapay",
      environment: process.env.VELORAPAY_ENVIRONMENT || "sandbox",
      apiKey: veloraPublic,
      secretKey: veloraSecret,
    }
  }

  // 3. Sem credenciais: retorna config do painel (pode ter só pixKey p/ PIX estático)
  return adminConfig
}

// Ponto de entrada único: gera o PIX usando a gateway configurada ou o fallback estático.
export async function createPix({
  amount,
  userId,
  userEmail,
}: {
  amount: number
  userId?: string
  userEmail?: string
}): Promise<PixResult> {
  const config = await getGatewayConfig()

  if (config?.apiKey && config?.gateway) {
    return await generatePixFromGateway({
      amount,
      userId,
      userEmail,
      config: config as {
        gateway: string
        environment: string
        apiKey: string
        secretKey?: string
        pixKey?: string
      },
    })
  }

  // Fallback: PIX estático (sem gateway) para testes
  const pixData = await generateStaticPix({
    amount,
    txId: `REV${Date.now()}`,
    pixKey: config?.pixKey || "",
  })

  return {
    success: true,
    pixCode: pixData.pixCode,
    qrCodeBase64: pixData.qrCodeBase64,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    txId: pixData.txId,
  }
}

async function generatePixFromGateway({
  amount,
  userId,
  userEmail,
  config,
}: {
  amount: number
  userId?: string
  userEmail?: string
  config: {
    gateway: string
    environment: string
    apiKey: string
    secretKey?: string
    pixKey?: string
  }
}): Promise<PixResult> {
  const baseUrl = GATEWAY_URLS[config.gateway]?.[config.environment as "sandbox" | "production"]

  if (!baseUrl) {
    throw new Error(`Gateway ${config.gateway} nao suportada`)
  }

  switch (config.gateway) {
    case "mercadopago":
      return await mercadoPagoCreatePix({ amount, userId, userEmail, config, baseUrl })
    case "asaas":
      return await asaasCreatePix({ amount, userId, userEmail, config, baseUrl })
    case "openpix":
      return await openPixCreatePix({ amount, userId, userEmail, config, baseUrl })
    case "pushinpay":
      return await pushinPayCreatePix({ amount, userId, userEmail, config, baseUrl })
    case "velorapay":
      return await veloraPayCreatePix({ amount, userId, userEmail, config, baseUrl })
    default:
      return await genericGatewayCreatePix({ amount, userId, userEmail, config, baseUrl })
  }
}

// Mercado Pago
async function mercadoPagoCreatePix({ amount, userId, userEmail, config, baseUrl }: any): Promise<PixResult> {
  const response = await fetch(`${baseUrl}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "X-Idempotency-Key": `${userId}-${Date.now()}`,
    },
    body: JSON.stringify({
      transaction_amount: amount,
      payment_method_id: "pix",
      payer: { email: userEmail || "cliente@email.com" },
      description: "Recarga REV SYSTEM",
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Erro no Mercado Pago")

  return {
    success: true,
    pixCode: data.point_of_interaction?.transaction_data?.qr_code,
    qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    expiresAt: data.date_of_expiration,
    txId: data.id?.toString(),
    gatewayId: data.id,
  }
}

// Asaas
async function asaasCreatePix({ amount, userId, userEmail, config, baseUrl }: any): Promise<PixResult> {
  const response = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: config.apiKey },
    body: JSON.stringify({
      customer: userId,
      billingType: "PIX",
      value: amount,
      description: "Recarga REV SYSTEM",
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.errors?.[0]?.description || "Erro no Asaas")

  const pixResponse = await fetch(`${baseUrl}/payments/${data.id}/pixQrCode`, {
    headers: { access_token: config.apiKey },
  })
  const pixData = await pixResponse.json()

  return {
    success: true,
    pixCode: pixData.payload,
    qrCodeBase64: pixData.encodedImage,
    expiresAt: data.dueDate,
    txId: data.id,
    gatewayId: data.id,
  }
}

// OpenPix
async function openPixCreatePix({ amount, userId, userEmail, config, baseUrl }: any): Promise<PixResult> {
  const response = await fetch(`${baseUrl}/charge`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: config.apiKey },
    body: JSON.stringify({
      correlationID: `REV-${Date.now()}`,
      value: amount * 100,
      comment: "Recarga REV SYSTEM",
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error || "Erro no OpenPix")

  return {
    success: true,
    pixCode: data.charge?.brCode,
    qrCodeBase64: data.charge?.qrCodeImage,
    expiresAt: data.charge?.expiresDate,
    txId: data.charge?.correlationID,
    gatewayId: data.charge?.id,
  }
}

// PushinPay
async function pushinPayCreatePix({ amount, userId, userEmail, config, baseUrl }: any): Promise<PixResult> {
  const response = await fetch(`${baseUrl}/cashIn`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ value: amount * 100, webhook_url: config.webhookUrl }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Erro no PushinPay")

  return {
    success: true,
    pixCode: data.qrcode,
    qrCodeBase64: data.qrcode_base64,
    expiresAt: data.expiration_date,
    txId: data.id,
    gatewayId: data.id,
  }
}

// VeloraPay
// Doc oficial: https://velorapay.com.br/docs
// Headers x-api-key (público) + x-api-secret (segredo). POST /payments/create.
async function veloraPayCreatePix({ amount, userId, userEmail, config, baseUrl }: any): Promise<PixResult> {
  const publicKey = config.apiKey
  const secretKey = config.secretKey || ""

  const response = await fetch(`${baseUrl}/payments/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": publicKey,
      "x-api-secret": secretKey,
      "Idempotency-Key": `rev-${userId || "anon"}-${Date.now()}`,
    },
    body: JSON.stringify({
      amount: Number(amount.toFixed(2)),
      payerName: "Cliente REV SYSTEM",
      payerDocument: "12345678900",
      description: "Recarga REV SYSTEM",
      source: "rev-system",
    }),
  })

  const rawText = await response.text()
  let data: any = {}
  try {
    data = JSON.parse(rawText)
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Erro na VeloraPay (HTTP ${response.status})`)
  }

  const tx = data.data || data.payment || data.transaction || data

  const pixCode = tx.copyAndPaste || tx.copyPaste || tx.pixCopiaECola || tx.brCode || tx.emv

  let qrCodeBase64 = tx.qrCode || tx.qrCodeBase64 || tx.qrCodeImage || ""

  if (qrCodeBase64 && !qrCodeBase64.startsWith("data:") && !qrCodeBase64.startsWith("http")) {
    qrCodeBase64 = `data:image/png;base64,${qrCodeBase64}`
  }

  if (!qrCodeBase64 && pixCode) {
    try {
      qrCodeBase64 = await QRCode.toDataURL(pixCode, { width: 300, margin: 1, errorCorrectionLevel: "M" })
    } catch (err) {
      console.error("[v0] Erro ao gerar QR VeloraPay:", err)
    }
  }

  return {
    success: true,
    pixCode,
    qrCodeBase64,
    expiresAt:
      tx.expiresAt || tx.expiration_date || tx.dueDate || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    txId: tx.transactionId || tx.internalId || tx.id || `REV${Date.now()}`,
    gatewayId: tx.transactionId || tx.id,
  }
}

// Generic gateway
async function genericGatewayCreatePix({ amount, userId, userEmail, config, baseUrl }: any): Promise<PixResult> {
  const response = await fetch(`${baseUrl}/pix/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      amount: amount * 100,
      description: `Recarga REV SYSTEM - ${userEmail || userId}`,
      externalReference: userId,
    }),
  })

  if (!response.ok) throw new Error("Erro na gateway de pagamento")

  const data = await response.json()

  return {
    success: true,
    pixCode: data.pixCopiaECola || data.qrcode || data.pix_code || data.brCode,
    qrCodeBase64: data.qrCodeBase64 || data.qr_code_base64 || data.imagemQrcode || data.qrCodeImage,
    expiresAt: data.expiresAt || data.expiration_date || data.expiresDate,
    txId: data.txId || data.id || data.transaction_id || data.correlationID,
    gatewayId: data.id,
  }
}

// PIX estático (EMV) - fallback sem gateway
async function generateStaticPix({
  amount,
  txId,
  pixKey,
}: {
  amount: number
  txId: string
  pixKey: string
}) {
  const merchantName = "REV SYSTEM".substring(0, 25)
  const merchantCity = "SAO PAULO".substring(0, 15)
  const amountStr = amount.toFixed(2)

  const payload = buildEmvPayload({
    pixKey: pixKey || "sua-chave-pix",
    merchantName,
    merchantCity,
    amount: amountStr,
    txId,
  })

  let qrCodeBase64 = ""
  try {
    qrCodeBase64 = await QRCode.toDataURL(payload, { width: 300, margin: 1, errorCorrectionLevel: "M" })
  } catch (err) {
    console.error("Error generating QR code:", err)
  }

  return { pixCode: payload, qrCodeBase64, txId }
}

function buildEmvPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txId,
}: {
  pixKey: string
  merchantName: string
  merchantCity: string
  amount: string
  txId: string
}) {
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, "0")
    return `${id}${len}${value}`
  }

  const gui = formatField("00", "br.gov.bcb.pix")
  const key = formatField("01", pixKey)
  const merchantAccountInfo = formatField("26", gui + key)

  let payload = ""
  payload += formatField("00", "01")
  payload += merchantAccountInfo
  payload += formatField("52", "0000")
  payload += formatField("53", "986")
  payload += formatField("54", amount)
  payload += formatField("58", "BR")
  payload += formatField("59", merchantName)
  payload += formatField("60", merchantCity)
  payload += formatField("62", formatField("05", txId))
  payload += "6304"

  const crc = calculateCRC16(payload)
  payload = payload.slice(0, -4) + formatField("63", crc)

  return payload
}

function calculateCRC16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0")
}
