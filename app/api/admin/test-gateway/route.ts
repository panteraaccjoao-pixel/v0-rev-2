import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const gatewayConfig = await request.json()
    
    if (!gatewayConfig.apiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 })
    }
    
    const baseUrls: Record<string, { sandbox: string; production: string }> = {
      mercadopago: {
        sandbox: "https://api.mercadopago.com",
        production: "https://api.mercadopago.com"
      },
      pagseguro: {
        sandbox: "https://sandbox.api.pagseguro.com",
        production: "https://api.pagseguro.com"
      },
      asaas: {
        sandbox: "https://sandbox.asaas.com/api/v3",
        production: "https://api.asaas.com/api/v3"
      },
      efipay: {
        sandbox: "https://pix-h.api.efipay.com.br",
        production: "https://pix.api.efipay.com.br"
      },
      stripe: {
        sandbox: "https://api.stripe.com",
        production: "https://api.stripe.com"
      },
      openpix: {
        sandbox: "https://api.openpix.com.br/api",
        production: "https://api.openpix.com.br/api"
      },
      primepag: {
        sandbox: "https://api.primepag.com.br",
        production: "https://api.primepag.com.br"
      },
      pushinpay: {
        sandbox: "https://api.pushinpay.com.br",
        production: "https://api.pushinpay.com.br"
      }
    }
    
    const provider = gatewayConfig.provider
    const env = gatewayConfig.environment as "sandbox" | "production"
    
    // For demo purposes, validate config format
    // In production, make actual API call to verify credentials
    if (baseUrls[provider]) {
      return NextResponse.json({ 
        success: true, 
        message: "Gateway connected",
        baseUrl: baseUrls[provider][env]
      })
    }
    
    // Custom or unknown provider
    return NextResponse.json({ 
      success: true, 
      message: "Configuration saved" 
    })
  } catch (error) {
    console.error("Gateway connection test failed:", error)
    return NextResponse.json({ error: "Connection failed" }, { status: 500 })
  }
}
