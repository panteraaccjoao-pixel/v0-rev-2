"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Database, 
  CreditCard, 
  Eye, 
  EyeOff, 
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy
} from "lucide-react"

export default function ConfiguracoesPage() {
  const [showDbPassword, setShowDbPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testingDb, setTestingDb] = useState(false)
  const [dbStatus, setDbStatus] = useState<"idle" | "success" | "error">("idle")
  const [testingGateway, setTestingGateway] = useState(false)
  const [gatewayStatus, setGatewayStatus] = useState<"idle" | "success" | "error">("idle")
  const [copied, setCopied] = useState(false)

  const [dbConfig, setDbConfig] = useState({
    type: "postgresql",
    host: "",
    port: "5432",
    database: "",
    user: "",
    password: "",
  })

  const [gatewayConfig, setGatewayConfig] = useState({
    provider: "mercadopago",
    environment: "sandbox",
    apiKey: "",
    secretKey: "",
    pixKey: "",
  })

  const webhookUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/api/webhook/pagamento`
    : ""

  useEffect(() => {
    const savedDbConfig = localStorage.getItem("rev_db_config")
    const savedGatewayConfig = localStorage.getItem("rev_gateway_config")
    if (savedDbConfig) setDbConfig(JSON.parse(savedDbConfig))
    if (savedGatewayConfig) setGatewayConfig(JSON.parse(savedGatewayConfig))
  }, [])

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    
    localStorage.setItem("rev_db_config", JSON.stringify(dbConfig))
    localStorage.setItem("rev_gateway_config", JSON.stringify(gatewayConfig))
    
    try {
      await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbConfig, gatewayConfig })
      })
    } catch (error) {
      console.error("Error saving config:", error)
    }
    
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const testDatabaseConnection = async () => {
    setTestingDb(true)
    setDbStatus("idle")
    
    try {
      const res = await fetch("/api/admin/test-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbConfig)
      })
      
      setDbStatus(res.ok ? "success" : "error")
    } catch {
      setDbStatus("error")
    }
    
    setTestingDb(false)
  }

  const testGatewayConnection = async () => {
    setTestingGateway(true)
    setGatewayStatus("idle")
    
    try {
      const res = await fetch("/api/admin/test-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gatewayConfig)
      })
      
      setGatewayStatus(res.ok ? "success" : "error")
    } catch {
      setGatewayStatus("error")
    }
    
    setTestingGateway(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure seu banco de dados e gateway de pagamento</p>
      </div>

      {/* Database Configuration */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Database className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Banco de Dados</h2>
            <p className="text-sm text-muted-foreground">Configure a conexão com seu banco de dados</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de Banco</Label>
            <select
              value={dbConfig.type}
              onChange={(e) => setDbConfig({ ...dbConfig, type: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-secondary px-3"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Host</Label>
            <Input
              value={dbConfig.host}
              onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
              placeholder="localhost ou IP do servidor"
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label>Porta</Label>
            <Input
              value={dbConfig.port}
              onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
              placeholder="5432"
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label>Nome do Banco</Label>
            <Input
              value={dbConfig.database}
              onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
              placeholder="revsystem"
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label>Usuário</Label>
            <Input
              value={dbConfig.user}
              onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
              placeholder="postgres"
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label>Senha</Label>
            <div className="relative">
              <Input
                type={showDbPassword ? "text" : "password"}
                value={dbConfig.password}
                onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                placeholder="••••••••"
                className="bg-secondary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowDbPassword(!showDbPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showDbPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="secondary" onClick={testDatabaseConnection} disabled={testingDb}>
            {testingDb && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Testar Conexão
          </Button>
          {dbStatus === "success" && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" /> Conectado com sucesso
            </span>
          )}
          {dbStatus === "error" && (
            <span className="flex items-center gap-1 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" /> Falha na conexão
            </span>
          )}
        </div>
      </div>

      {/* Gateway Configuration */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <CreditCard className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Gateway de Pagamento PIX</h2>
            <p className="text-sm text-muted-foreground">Configure sua gateway para receber pagamentos</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Provedor</Label>
            <select
              value={gatewayConfig.provider}
              onChange={(e) => setGatewayConfig({ ...gatewayConfig, provider: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-secondary px-3"
            >
              <option value="mercadopago">Mercado Pago</option>
              <option value="pagseguro">PagSeguro</option>
              <option value="asaas">Asaas</option>
              <option value="efipay">EfiPay (Gerencianet)</option>
              <option value="picpay">PicPay</option>
              <option value="pagarme">Pagar.me</option>
              <option value="cielo">Cielo</option>
              <option value="stripe">Stripe</option>
              <option value="openpix">OpenPix</option>
              <option value="primepag">PrimePag</option>
              <option value="pushinpay">PushinPay</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Ambiente</Label>
            <select
              value={gatewayConfig.environment}
              onChange={(e) => setGatewayConfig({ ...gatewayConfig, environment: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-secondary px-3"
            >
              <option value="sandbox">Sandbox (Testes)</option>
              <option value="production">Produção</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>API Key / Client ID / Access Token</Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={gatewayConfig.apiKey}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, apiKey: e.target.value })}
                placeholder="Sua chave de API"
                className="bg-secondary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secret Key / Client Secret</Label>
            <div className="relative">
              <Input
                type={showSecretKey ? "text" : "password"}
                value={gatewayConfig.secretKey}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, secretKey: e.target.value })}
                placeholder="Sua chave secreta"
                className="bg-secondary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Chave PIX (opcional)</Label>
            <Input
              value={gatewayConfig.pixKey}
              onChange={(e) => setGatewayConfig({ ...gatewayConfig, pixKey: e.target.value })}
              placeholder="email@exemplo.com, CPF, CNPJ ou chave aleatória"
              className="bg-secondary"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>URL de Webhook</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="bg-secondary"
              />
              <Button variant="secondary" onClick={handleCopyWebhook}>
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure esta URL na sua gateway para receber notificações de pagamento
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button variant="secondary" onClick={testGatewayConnection} disabled={testingGateway}>
            {testingGateway && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Testar Gateway
          </Button>
          {gatewayStatus === "success" && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle className="h-4 w-4" /> Gateway conectada
            </span>
          )}
          {gatewayStatus === "error" && (
            <span className="flex items-center gap-1 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" /> Falha na conexão
            </span>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Configurações
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-500">
            <CheckCircle className="h-4 w-4" /> Configurações salvas!
          </span>
        )}
      </div>
    </div>
  )
}
