"use server"

import { NextRequest, NextResponse } from "next/server"

// Gateway configuration - set these in your environment variables
const GATEWAY_API_URL = process.env.GATEWAY_API_URL || ""
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || ""
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || ""

// PIX key configuration
const PIX_KEY = process.env.PIX_KEY || ""
const PIX_MERCHANT_NAME = process.env.PIX_MERCHANT_NAME || "REV SYSTEM"
const PIX_MERCHANT_CITY = process.env.PIX_MERCHANT_CITY || "SAO PAULO"

export async function POST(request: NextRequest) {
  try {
    const { amount, userId, userEmail } = await request.json()

    if (!amount || amount < 5) {
      return NextResponse.json(
        { error: "Valor mínimo é R$ 5,00" },
        { status: 400 }
      )
    }

    // Check if gateway is configured
    if (GATEWAY_API_URL && GATEWAY_API_KEY) {
      // Use your payment gateway API
      const gatewayResponse = await generatePixFromGateway({
        amount,
        userId,
        userEmail,
      })
      
      return NextResponse.json(gatewayResponse)
    }

    // Fallback: Generate static PIX (for testing without gateway)
    const pixData = generateStaticPix({
      amount,
      txId: `REV${Date.now()}`,
    })

    return NextResponse.json({
      success: true,
      pixCode: pixData.pixCode,
      qrCodeBase64: pixData.qrCodeBase64,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
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

// Function to call your payment gateway API
async function generatePixFromGateway({
  amount,
  userId,
  userEmail,
}: {
  amount: number
  userId?: string
  userEmail?: string
}) {
  // Replace this with your actual gateway integration
  // Example for common gateways like Mercado Pago, PagSeguro, Asaas, etc.
  
  const response = await fetch(`${GATEWAY_API_URL}/pix/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GATEWAY_API_KEY}`,
      // Add any other headers your gateway requires
    },
    body: JSON.stringify({
      amount: amount * 100, // Most gateways use cents
      description: `Recarga REV SYSTEM - ${userEmail || userId}`,
      externalReference: userId,
      // Add other fields your gateway requires
    }),
  })

  if (!response.ok) {
    throw new Error("Gateway API error")
  }

  const data = await response.json()

  // Map the gateway response to our format
  // Adjust these fields based on your gateway's response structure
  return {
    success: true,
    pixCode: data.pixCopiaECola || data.qrcode || data.pix_code,
    qrCodeBase64: data.qrCodeBase64 || data.qr_code_base64 || data.imagemQrcode,
    expiresAt: data.expiresAt || data.expiration_date,
    txId: data.txId || data.id || data.transaction_id,
    gatewayId: data.id,
  }
}

// Generate static PIX code (EMV format) - fallback when no gateway
function generateStaticPix({
  amount,
  txId,
}: {
  amount: number
  txId: string
}) {
  // EMV PIX format
  const pixKey = PIX_KEY
  const merchantName = PIX_MERCHANT_NAME.substring(0, 25)
  const merchantCity = PIX_MERCHANT_CITY.substring(0, 15)
  const amountStr = amount.toFixed(2)

  // Build EMV payload
  const payload = buildEmvPayload({
    pixKey,
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
