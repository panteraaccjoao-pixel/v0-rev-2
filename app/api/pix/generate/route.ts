"use server"

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

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
}

// Get gateway config from admin panel
async function getGatewayConfig() {
  const cookieStore = await cookies()
  const gatewayConfig = cookieStore.get("rev_gateway_config")?.value
  return gatewayConfig ? JSON.parse(gatewayConfig) : null
}

export async function POST(request: NextRequest) {
  try {
    const { amount, userId, userEmail } = await request.json()

    if (!amount || amount < 5) {
      return NextResponse.json(
        { error: "Valor minimo e R$ 5,00" },
        { status: 400 }
      )
    }

    // Get config from admin panel
    const config = await getGatewayConfig()

    if (config?.apiKey && config?.gateway) {
      // Use configured payment gateway
      const gatewayResponse = await generatePixFromGateway({
        amount,
        userId,
        userEmail,
        config,
      })
      
      return NextResponse.json(gatewayResponse)
    }

    // Fallback: Generate static PIX (for testing without gateway)
    const pixData = generateStaticPix({
      amount,
      txId: `REV${Date.now()}`,
      pixKey: config?.pixKey || "",
    })

    return NextResponse.json({
      success: true,
      pixCode: pixData.pixCode,
      qrCodeBase64: pixData.qrCodeBase64,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      txId: pixData.txId,
    })

  } catch (error) {
    console.error("Error generating PIX:", error)
    return NextResponse.json(
      { error: "Erro ao gerar PIX. Tente novamente." },
      { status: 500 }
    )
  }
}

// Function to call payment gateway API based on provider
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
}) {
  const baseUrl = GATEWAY_URLS[config.gateway]?.[config.environment as "sandbox" | "production"]
  
  if (!baseUrl) {
    throw new Error(`Gateway ${config.gateway} nao suportada`)
  }

  // Gateway-specific implementations
  switch (config.gateway) {
    case "mercadopago":
      return await mercadoPagoCreatePix({ amount, userId, userEmail, config, baseUrl })
    case "asaas":
      return await asaasCreatePix({ amount, userId, userEmail, config, baseUrl })
    case "openpix":
      return await openPixCreatePix({ amount, userId, userEmail, config, baseUrl })
    case "pushinpay":
      return await pushinPayCreatePix({ amount, userId, userEmail, config, baseUrl })
    default:
      return await genericGatewayCreatePix({ amount, userId, userEmail, config, baseUrl })
  }
}

// Mercado Pago integration
async function mercadoPagoCreatePix({ amount, userId, userEmail, config, baseUrl }: any) {
  const response = await fetch(`${baseUrl}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
      "X-Idempotency-Key": `${userId}-${Date.now()}`,
    },
    body: JSON.stringify({
      transaction_amount: amount,
      payment_method_id: "pix",
      payer: {
        email: userEmail || "cliente@email.com",
      },
      description: `Recarga REV SYSTEM`,
    }),
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || "Erro no Mercado Pago")
  }

  return {
    success: true,
    pixCode: data.point_of_interaction?.transaction_data?.qr_code,
    qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    expiresAt: data.date_of_expiration,
    txId: data.id?.toString(),
    gatewayId: data.id,
  }
}

// Asaas integration
async function asaasCreatePix({ amount, userId, userEmail, config, baseUrl }: any) {
  const response = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": config.apiKey,
    },
    body: JSON.stringify({
      customer: userId,
      billingType: "PIX",
      value: amount,
      description: "Recarga REV SYSTEM",
    }),
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.errors?.[0]?.description || "Erro no Asaas")
  }

  // Get PIX QR Code
  const pixResponse = await fetch(`${baseUrl}/payments/${data.id}/pixQrCode`, {
    headers: { "access_token": config.apiKey },
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

// OpenPix integration
async function openPixCreatePix({ amount, userId, userEmail, config, baseUrl }: any) {
  const response = await fetch(`${baseUrl}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": config.apiKey,
    },
    body: JSON.stringify({
      correlationID: `REV-${Date.now()}`,
      value: amount * 100, // OpenPix uses cents
      comment: "Recarga REV SYSTEM",
    }),
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || "Erro no OpenPix")
  }

  return {
    success: true,
    pixCode: data.charge?.brCode,
    qrCodeBase64: data.charge?.qrCodeImage,
    expiresAt: data.charge?.expiresDate,
    txId: data.charge?.correlationID,
    gatewayId: data.charge?.id,
  }
}

// PushinPay integration
async function pushinPayCreatePix({ amount, userId, userEmail, config, baseUrl }: any) {
  const response = await fetch(`${baseUrl}/cashIn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      value: amount * 100,
      webhook_url: config.webhookUrl,
    }),
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || "Erro no PushinPay")
  }

  return {
    success: true,
    pixCode: data.qrcode,
    qrCodeBase64: data.qrcode_base64,
    expiresAt: data.expiration_date,
    txId: data.id,
    gatewayId: data.id,
  }
}

// Generic gateway implementation
async function genericGatewayCreatePix({ amount, userId, userEmail, config, baseUrl }: any) {
  const response = await fetch(`${baseUrl}/pix/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      amount: amount * 100,
      description: `Recarga REV SYSTEM - ${userEmail || userId}`,
      externalReference: userId,
    }),
  })

  if (!response.ok) {
    throw new Error("Erro na gateway de pagamento")
  }

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

// Generate static PIX code (EMV format) - fallback when no gateway
function generateStaticPix({
  amount,
  txId,
  pixKey,
}: {
  amount: number
  txId: string
  pixKey: string
}) {
  // EMV PIX format
  const merchantName = "REV SYSTEM".substring(0, 25)
  const merchantCity = "SAO PAULO".substring(0, 15)
  const amountStr = amount.toFixed(2)

  // Build EMV payload
  const payload = buildEmvPayload({
    pixKey: pixKey || "sua-chave-pix",
    merchantName,
    merchantCity,
    amount: amountStr,
    txId,
  })

  // Generate QR code as base64 (placeholder - in production use a QR library)
  const qrCodeBase64 = "" // You would use a library like 'qrcode' to generate this

  return {
    pixCode: payload,
    qrCodeBase64,
    txId,
  }
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

  // Merchant Account Information (ID 26)
  const gui = formatField("00", "br.gov.bcb.pix")
  const key = formatField("01", pixKey)
  const merchantAccountInfo = formatField("26", gui + key)

  // Build payload without CRC
  let payload = ""
  payload += formatField("00", "01") // Payload Format Indicator
  payload += merchantAccountInfo // Merchant Account Information
  payload += formatField("52", "0000") // Merchant Category Code
  payload += formatField("53", "986") // Transaction Currency (BRL)
  payload += formatField("54", amount) // Transaction Amount
  payload += formatField("58", "BR") // Country Code
  payload += formatField("59", merchantName) // Merchant Name
  payload += formatField("60", merchantCity) // Merchant City
  payload += formatField("62", formatField("05", txId)) // Additional Data Field (txId)
  payload += "6304" // CRC placeholder

  // Calculate CRC16
  const crc = calculateCRC16(payload)
  payload = payload.slice(0, -4) + formatField("63", crc)

  return payload
}

function calculateCRC16(payload: string): string {
  let crc = 0xFFFF
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
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, "0")
}
