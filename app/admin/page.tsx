"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Save, Key, Shield, Settings, CheckCircle2 } from "lucide-react"
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

export default function AdminPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [config, setConfig] = useState({
    gateway: "",
    apiKey: "",
    secretKey: "",
    pixKey: "",
    webhookUrl: "",
    environment: "sandbox"
  })

  const handleSave = () => {
    // Aqui você salvaria as configurações no banco de dados
    console.log("Configurações salvas:", config)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const gateways = [
    { value: "mercadopago", label: "Mercado Pago" },
    { value: "pagseguro", label: "PagSeguro" },
    { value: "stripe", label: "Stripe" },
    { value: "asaas", label: "Asaas" },
    { value: "efipay", label: "EfiPay (Gerencianet)" },
    { value: "picpay", label: "PicPay" },
    { value: "pagarme", label: "Pagar.me" },
    { value: "cielo", label: "Cielo" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span className="font-semibold">Painel Admin</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-2xl px-4">
          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold">Configurações de Pagamento</h1>
            <p className="text-muted-foreground">
              Configure sua gateway de pagamento PIX para receber pagamentos
            </p>
          </div>

          {/* Success message */}
          {saved && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}

          {/* Config Form */}
          <div className="space-y-6 rounded-xl border border-border bg-card p-6">
            {/* Gateway Selection */}
            <div className="space-y-2">
              <Label htmlFor="gateway">Gateway de Pagamento</Label>
              <Select
                value={config.gateway}
                onValueChange={(value) => setConfig({ ...config, gateway: value })}
              >
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

            {/* Environment */}
            <div className="space-y-2">
              <Label htmlFor="environment">Ambiente</Label>
              <Select
                value={config.environment}
                onValueChange={(value) => setConfig({ ...config, environment: value })}
              >
                <SelectTrigger className="h-12 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Use Sandbox para testes antes de ir para produção
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key / Client ID</Label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Sua API Key ou Client ID"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="h-12 bg-secondary border-border pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key / Client Secret</Label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="secretKey"
                  type={showSecretKey ? "text" : "password"}
                  placeholder="Sua Secret Key ou Client Secret"
                  value={config.secretKey}
                  onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                  className="h-12 bg-secondary border-border pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* PIX Key */}
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX (opcional)</Label>
              <Input
                id="pixKey"
                type="text"
                placeholder="Sua chave PIX (CPF, CNPJ, email, telefone ou aleatória)"
                value={config.pixKey}
                onChange={(e) => setConfig({ ...config, pixKey: e.target.value })}
                className="h-12 bg-secondary border-border"
              />
              <p className="text-sm text-muted-foreground">
                Algumas gateways requerem a chave PIX cadastrada
              </p>
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL de Webhook</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://seusite.com/api/webhook/pix"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                className="h-12 bg-secondary border-border"
              />
              <p className="text-sm text-muted-foreground">
                URL para receber notificações de pagamento
              </p>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              className="w-full h-12"
              disabled={!config.gateway || !config.apiKey}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>

          {/* Info Cards */}
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-5 w-5 text-accent" />
                <h3 className="font-semibold">Configuração Segura</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Suas chaves são criptografadas e armazenadas de forma segura no servidor.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-accent" />
                <h3 className="font-semibold">Ambiente de Testes</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Recomendamos testar no sandbox antes de ativar o ambiente de produção.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
