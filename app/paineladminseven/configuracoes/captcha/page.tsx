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
import { Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle, Loader2 } from "lucide-react"

const providers = [
  { value: "recaptcha", label: "Google reCAPTCHA v2/v3" },
  { value: "hcaptcha", label: "hCaptcha" },
  { value: "turnstile", label: "Cloudflare Turnstile" },
]

export default function CaptchaPage() {
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const [config, setConfig] = useState({
    provider: "recaptcha",
    enabled: false,
    siteKey: "",
    secretKey: "",
  })

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/config")
        const data = await res.json()
        if (data.captchaConfig) {
          setConfig({
            provider: data.captchaConfig.provider || "recaptcha",
            enabled: data.captchaConfig.enabled ?? false,
            siteKey: data.captchaConfig.siteKey || "",
            secretKey: data.captchaConfig.secretKey || "",
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

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "captcha", config }),
      })

      const data = await res.json()
      if (data.success) {
        setSaveMessage("Configuracoes salvas com sucesso!")
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage("Erro ao salvar configuracoes")
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

  const selectedProvider = providers.find((p) => p.value === config.provider)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Captcha</h1>
        <p className="text-muted-foreground">Configure o serviço de captcha para proteger seus formulários contra bots</p>
      </div>

      <div className="max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <div>
            <h2 className="font-semibold">Configuração do Captcha</h2>
            <p className="text-sm text-muted-foreground">Insira as chaves pública e secreta do seu provedor</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
            <div>
              <p className="font-medium">Ativar Captcha</p>
              <p className="text-sm text-muted-foreground">Exige verificação nos formulários de login e cadastro</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
              <div className="h-6 w-11 rounded-full bg-secondary peer-checked:bg-accent after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <div className="space-y-2">
            <Label>Provedor</Label>
            <Select value={config.provider} onValueChange={(value) => setConfig({ ...config, provider: value })}>
              <SelectTrigger className="h-12 bg-secondary border-border">
                <SelectValue placeholder="Selecione o provedor" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteKey">Chave Pública (Site Key)</Label>
            <Input
              id="siteKey"
              placeholder="Sua chave pública (visível no front-end)"
              value={config.siteKey}
              onChange={(e) => setConfig({ ...config, siteKey: e.target.value })}
              className="h-12 bg-secondary border-border font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Usada no navegador para renderizar o widget do captcha.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secretKey">Chave Secreta (Secret Key)</Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecretKey ? "text" : "password"}
                placeholder="Sua chave secreta (usada no servidor)"
                value={config.secretKey}
                onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}
                className="h-12 bg-secondary border-border pr-12 font-mono text-sm"
              />
              <button
                type="button"
                aria-label={showSecretKey ? "Ocultar chave" : "Mostrar chave"}
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showSecretKey ? <EyeOff className="h-5 w-5 pointer-events-none" /> : <Eye className="h-5 w-5 pointer-events-none" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mantida em segredo no servidor para validar as respostas. Nunca compartilhe esta chave.
            </p>
          </div>
        </div>

        {saveMessage && (
          <div
            className={`flex items-center gap-2 rounded-lg p-3 ${
              saveMessage.includes("Erro")
                ? "bg-red-500/10 text-red-500"
                : "bg-green-500/10 text-green-500"
            }`}
          >
            {saveMessage.includes("Erro") ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            <span>{saveMessage}</span>
          </div>
        )}

        <div className="flex gap-3 pt-4">
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
              "Salvar Configurações"
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl rounded-lg border border-border bg-card p-6">
        <h3 className="mb-2 font-semibold">Onde encontrar as chaves?</h3>
        <p className="text-sm text-muted-foreground">
          {config.provider === "recaptcha" && "Acesse o Google reCAPTCHA Admin Console, registre seu site e copie a Site Key e a Secret Key."}
          {config.provider === "hcaptcha" && "Acesse o painel do hCaptcha, crie um site e copie a Site Key e a Secret Key."}
          {config.provider === "turnstile" && "Acesse o dashboard da Cloudflare em Turnstile, adicione seu site e copie a Site Key e a Secret Key."}
        </p>
        {selectedProvider && (
          <p className="mt-2 text-xs text-muted-foreground">Provedor selecionado: {selectedProvider.label}</p>
        )}
      </div>
    </div>
  )
}
