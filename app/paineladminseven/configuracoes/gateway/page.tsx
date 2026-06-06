"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff, CreditCard, CheckCircle2, XCircle, Loader2, Copy, Check } from "lucide-react"

const gateways = [
  { value: "mercadopago", label: "Mercado Pago" },
  { value: "pagseguro", label: "PagSeguro" },
  { value: "asaas", label: "Asaas" },
  { value: "efipay", label: "EfiPay (Gerencianet)" },
  { value: "picpay", label: "PicPay" },
  { value: "pagarme", label: "Pagar.me" },
  { value: "cielo", label: "Cielo" },
  { value: "stripe", label: "Stripe" },
  { value: "openpix", label: "OpenPix" },
  { value: "primepag", label: "PrimePag" },
  { value: "pushinpay", label: "PushinPay" },
]

export default function GatewayPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  
  const [config, setConfig] = useState({
    gateway: "",
    environment: "sandbox",
    apiKey: "",
    secretKey: "",
    pixKey: "",
    webhookSecret: "",
  })

  const webhookUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/api/webhook/pagamento`
    : "/api/webhook/pagamento"

  // Load existing config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/config")
        const data = await res.json()
        if (data.gatewayConfig) {
          setConfig({
            gateway: data.gatewayConfig.gateway || "",
            environment: data.gatewayConfig.environment || "sandbox",
            apiKey: data.gatewayConfig.apiKey || "",
            secretKey: data.gatewayConfig.secretKey || "",
            pixKey: data.gatewayConfig.pixKey || "",
            webhookSecret: data.gatewayConfig.webhookSecret || "",
          })
        }
      } catch (error) {
        console.error("Erro ao carregar configuracoes:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch("/api/admin/test-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      
      if (res.ok) {
        setTestResult("success")
      } else {
        setTestResult("error")
      }
    } catch {
      setTestResult("error")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "gateway", config }),
      })
      
      const data = await res.json()
      if (data.success) {
        setSaveMessage("Configuracoes salvas com sucesso!")
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setSaveMessage("Erro ao salvar configuracoes")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Gateway PIX</h1>
        <p className="text-muted-foreground">Configure sua gateway de pagamento para receber via PIX</p>
      </div>

      <div className="max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <CreditCard className="h-6 w-6 text-accent" />
          <div>
            <h2 className="font-semibold">Configuracao da Gateway</h2>
            <p className="text-sm text-muted-foreground">Configure as credenciais da sua gateway de pagamento</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gateway</Label>
              <Select value={config.gateway} onValueChange={(value) => setConfig({ ...config, gateway: value })}>
                <SelectTrigger className="h-12 bg-secondary border-border">
                  <SelectValue placeholder="Selecione a gateway" />
                </SelectTrigger>
                <SelectContent>
                  {gateways.map((gw) => (
                    <SelectItem key={gw.value} value={gw.value}>
                      {gw.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select value={config.environment} onValueChange={(value) => setConfig({ ...config, environment: value })}>
                <SelectTrigger className="h-12 bg-secondary border-border">
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                  <SelectItem value="production">Producao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key / Client ID</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="Sua chave de API"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="h-12 bg-secondary border-border pr-12"
              />
              <button
                type="button"
                aria-label={showApiKey ? "Ocultar chave" : "Mostrar chave"}
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretKey">Secret Key / Client Secret</Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecretKey ? "text" : "password"}
                placeholder="Sua chave secreta"
                value={config.secretKey}
                onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                className="h-12 bg-secondary border-border pr-12"
              />
              <button
                type="button"
                aria-label={showSecretKey ? "Ocultar chave" : "Mostrar chave"}
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showSecretKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixKey">Chave PIX (opcional)</Label>
            <Input
              id="pixKey"
              placeholder="Sua chave PIX cadastrada na gateway"
              value={config.pixKey}
              onChange={(e) => setConfig({ ...config, pixKey: e.target.value })}
              className="h-12 bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="h-12 bg-secondary border-border font-mono text-sm"
              />
              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12"
                onClick={handleCopyWebhook}
              >
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure esta URL no painel da sua gateway para receber notificacoes de pagamento
            </p>
          </div>
        </div>

        {(testResult || saveMessage) && (
          <div className={`flex items-center gap-2 rounded-lg p-3 ${
            testResult === "success" || (saveMessage && !saveMessage.includes("Erro")) 
              ? "bg-green-500/10 text-green-500" 
              : "bg-red-500/10 text-red-500"
          }`}>
            {testResult === "success" || (saveMessage && !saveMessage.includes("Erro")) ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>{saveMessage || "Gateway conectada com sucesso!"}</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span>{saveMessage || "Falha na conexao. Verifique as credenciais."}</span>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isTesting || !config.apiKey}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              "Testar Conexao"
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configuracoes"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
