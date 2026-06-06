import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, config, dbConfig, gatewayConfig } = body
    
    const cookieStore = await cookies()
    
    // Handle new format with type field
    if (type === "gateway") {
      // Preserve existing config and only update non-masked values
      const existingConfig = cookieStore.get("rev_gateway_config")?.value
      let existing = existingConfig ? JSON.parse(existingConfig) : {}
      
      const updatedConfig = {
        ...existing,
        gateway: config.gateway,
        environment: config.environment,
        pixKey: config.pixKey,
        updatedAt: new Date().toISOString(),
      }
      
      // Only update keys if they're not masked
      if (config.apiKey && !config.apiKey.startsWith("***")) {
        updatedConfig.apiKey = config.apiKey
      }
      if (config.secretKey && !config.secretKey.startsWith("***")) {
        updatedConfig.secretKey = config.secretKey
      }
      if (config.webhookSecret && !config.webhookSecret.startsWith("***")) {
        updatedConfig.webhookSecret = config.webhookSecret
      }
      
      cookieStore.set("rev_gateway_config", JSON.stringify(updatedConfig), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 365,
      })
      
      return NextResponse.json({ success: true, message: "Configuracoes salvas com sucesso" })
    }

    if (type === "captcha") {
      const existingConfig = cookieStore.get("rev_captcha_config")?.value
      const existing = existingConfig ? JSON.parse(existingConfig) : {}

      const updatedConfig: Record<string, unknown> = {
        ...existing,
        provider: config.provider,
        enabled: config.enabled,
        siteKey: config.siteKey,
        updatedAt: new Date().toISOString(),
      }

      // Only update secret key if it's not masked
      if (config.secretKey && !config.secretKey.startsWith("***")) {
        updatedConfig.secretKey = config.secretKey
      }

      cookieStore.set("rev_captcha_config", JSON.stringify(updatedConfig), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 365,
      })

      return NextResponse.json({ success: true, message: "Configuracoes salvas com sucesso" })
    }

    if (dbConfig) {
      cookieStore.set("rev_db_config", JSON.stringify(dbConfig), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 365,
      })
    }
    
    if (gatewayConfig) {
      cookieStore.set("rev_gateway_config", JSON.stringify(gatewayConfig), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 365,
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving config:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const dbConfig = cookieStore.get("rev_db_config")?.value
    const gatewayConfig = cookieStore.get("rev_gateway_config")?.value
    const captchaConfig = cookieStore.get("rev_captcha_config")?.value
    
    const parsedGateway = gatewayConfig ? JSON.parse(gatewayConfig) : null
    const parsedCaptcha = captchaConfig ? JSON.parse(captchaConfig) : null
    
    // Mask sensitive data for frontend display
    const maskedGateway = parsedGateway ? {
      gateway: parsedGateway.gateway || "",
      environment: parsedGateway.environment || "sandbox",
      apiKey: parsedGateway.apiKey ? "***" + parsedGateway.apiKey.slice(-4) : "",
      secretKey: parsedGateway.secretKey ? "***" + parsedGateway.secretKey.slice(-4) : "",
      pixKey: parsedGateway.pixKey || "",
      webhookSecret: parsedGateway.webhookSecret ? "***" + parsedGateway.webhookSecret.slice(-4) : "",
      isConfigured: !!(parsedGateway.apiKey && parsedGateway.gateway),
    } : null

    const maskedCaptcha = parsedCaptcha ? {
      provider: parsedCaptcha.provider || "recaptcha",
      enabled: parsedCaptcha.enabled ?? false,
      siteKey: parsedCaptcha.siteKey || "",
      secretKey: parsedCaptcha.secretKey ? "***" + parsedCaptcha.secretKey.slice(-4) : "",
      isConfigured: !!(parsedCaptcha.siteKey && parsedCaptcha.secretKey),
    } : null
    
    return NextResponse.json({
      dbConfig: dbConfig ? JSON.parse(dbConfig) : null,
      gatewayConfig: maskedGateway,
      captchaConfig: maskedCaptcha,
    })
  } catch (error) {
    console.error("Error getting config:", error)
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 })
  }
}

// Helper function to get raw gateway config (for internal API use)
export async function getGatewayConfigRaw() {
  const cookieStore = await cookies()
  const gatewayConfig = cookieStore.get("rev_gateway_config")?.value
  return gatewayConfig ? JSON.parse(gatewayConfig) : null
}

// Helper function to get raw captcha config (for internal API use)
export async function getCaptchaConfigRaw() {
  const cookieStore = await cookies()
  const captchaConfig = cookieStore.get("rev_captcha_config")?.value
  return captchaConfig ? JSON.parse(captchaConfig) : null
}
