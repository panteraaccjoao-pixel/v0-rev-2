import { NextResponse } from "next/server"
import store from "@/lib/data-store"
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"

async function getConfig(key: string) {
  return store.config[key] || null
}

async function saveConfig(key: string, value: Record<string, any>) {
  store.config[key] = { ...value, updated_at: new Date().toISOString() }
}

export async function POST(request: Request) {
  if (!isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const body = await request.json()
    const { type, config, dbConfig, gatewayConfig } = body

    if (type === "gateway") {
      const existing = (await getConfig("gateway")) || {}
      const updatedConfig: Record<string, any> = {
        ...existing,
        gateway: config.gateway,
        environment: config.environment,
        pixKey: config.pixKey,
        updatedAt: new Date().toISOString(),
      }

      if (config.apiKey && !config.apiKey.startsWith("***")) {
        updatedConfig.apiKey = config.apiKey
      }
      if (config.secretKey && !config.secretKey.startsWith("***")) {
        updatedConfig.secretKey = config.secretKey
      }
      if (config.webhookSecret && !config.webhookSecret.startsWith("***")) {
        updatedConfig.webhookSecret = config.webhookSecret
      }

      await saveConfig("gateway", updatedConfig)
      return NextResponse.json({ success: true, message: "Configuracoes salvas com sucesso" })
    }

    if (type === "captcha") {
      const existing = (await getConfig("captcha")) || {}
      const updatedConfig: Record<string, any> = {
        ...existing,
        provider: config.provider,
        enabled: config.enabled,
        siteKey: config.siteKey,
        updatedAt: new Date().toISOString(),
      }

      if (config.secretKey && !config.secretKey.startsWith("***")) {
        updatedConfig.secretKey = config.secretKey
      }

      await saveConfig("captcha", updatedConfig)
      return NextResponse.json({ success: true, message: "Configuracoes salvas com sucesso" })
    }

    if (dbConfig) {
      await saveConfig("db", dbConfig)
    }

    if (gatewayConfig) {
      await saveConfig("gateway", gatewayConfig)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving config:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  if (!isAuthenticatedAdmin(request)) {
    return unauthorizedResponse()
  }
  try {
    const parsedDb = await getConfig("db")
    const parsedGateway = await getConfig("gateway")
    const parsedCaptcha = await getConfig("captcha")

    const maskedGateway = parsedGateway
      ? {
          gateway: parsedGateway.gateway || "",
          environment: parsedGateway.environment || "sandbox",
          apiKey: parsedGateway.apiKey ? "***" + String(parsedGateway.apiKey).slice(-4) : "",
          secretKey: parsedGateway.secretKey ? "***" + String(parsedGateway.secretKey).slice(-4) : "",
          pixKey: parsedGateway.pixKey || "",
          webhookSecret: parsedGateway.webhookSecret
            ? "***" + String(parsedGateway.webhookSecret).slice(-4)
            : "",
          isConfigured: !!(parsedGateway.apiKey && parsedGateway.gateway),
        }
      : null

    const maskedCaptcha = parsedCaptcha
      ? {
          provider: parsedCaptcha.provider || "recaptcha",
          enabled: parsedCaptcha.enabled ?? false,
          siteKey: parsedCaptcha.siteKey || "",
          secretKey: parsedCaptcha.secretKey ? "***" + String(parsedCaptcha.secretKey).slice(-4) : "",
          isConfigured: !!(parsedCaptcha.siteKey && parsedCaptcha.secretKey),
        }
      : null

    return NextResponse.json({
      dbConfig: parsedDb,
      gatewayConfig: maskedGateway,
      captchaConfig: maskedCaptcha,
    })
  } catch (error) {
    console.error("Error getting config:", error)
    return NextResponse.json({ error: "Failed to get config" }, { status: 500 })
  }
}

// Helper para obter config bruta do gateway (uso interno por outras rotas)
export async function getGatewayConfigRaw() {
  return getConfig("gateway")
}

// Helper para obter config bruta do captcha (uso interno por outras rotas)
export async function getCaptchaConfigRaw() {
  return getConfig("captcha")
}

// Helper para obter config bruta do banco (uso interno por outras rotas)
export async function getDbConfigRaw() {
  return getConfig("db")
}
