"use client"

import { useState, useEffect } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import Link from "next/link"
import { Database, CreditCard, Settings, ChevronRight, MessageCircle, Save, ExternalLink, ShieldCheck, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const configSections = [
  {
    title: "Banco de Dados",
    description: "Configure a conexao com seu banco de dados (PostgreSQL, MySQL, MongoDB)",
    href: "/gestaorevsystem/configuracoes/banco-de-dados",
    icon: Database,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Gateway PIX",
    description: "Configure sua gateway de pagamento para receber via PIX",
    href: "/gestaorevsystem/configuracoes/gateway",
    icon: CreditCard,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Captcha",
    description: "Configure as chaves pública e secreta do serviço de captcha (reCAPTCHA, hCaptcha, Turnstile)",
    href: "/gestaorevsystem/configuracoes/captcha",
    icon: ShieldCheck,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Senha do Admin",
    description: "Altere a senha de acesso ao painel administrativo",
    href: "/gestaorevsystem/configuracoes/senha",
    icon: KeyRound,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
]

export default function ConfiguracoesPage() {
  const [discordAuthUrl, setDiscordAuthUrl] = useState("")
  const [discordServerUrl, setDiscordServerUrl] = useState("")
  const [discordEnabled, setDiscordEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load settings
    adminFetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        setDiscordAuthUrl(data.discordAuthUrl || "")
        setDiscordServerUrl(data.discordServerUrl || "")
        setDiscordEnabled(data.discordEnabled ?? true)
      })
      .catch(console.error)
  }, [])

  const handleSaveDiscord = async () => {
    setSaving(true)
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordAuthUrl, discordServerUrl, discordEnabled })
      })
      
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error("Error saving:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">Gerencie as configuracoes do sistema</p>
      </div>

      <div className="grid gap-4">
        {configSections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-6 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${section.bgColor}`}>
                <section.icon className={`h-6 w-6 ${section.color}`} />
              </div>
              <div>
                <h2 className="font-semibold">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Discord Integration Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
            <MessageCircle className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="font-semibold">Integracao Discord</h2>
            <p className="text-sm text-muted-foreground">Configure a autenticacao de membros do Discord</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Vincular Discord Ativo</p>
              <p className="text-sm text-muted-foreground">Permite usuarios vincularem Discord</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input 
                type="checkbox" 
                className="peer sr-only" 
                checked={discordEnabled}
                onChange={(e) => setDiscordEnabled(e.target.checked)}
              />
              <div className="h-6 w-11 rounded-full bg-secondary peer-checked:bg-indigo-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discordUrl">URL de Autenticacao Discord (OAuth)</Label>
            <div className="flex gap-2">
              <Input
                id="discordUrl"
                placeholder="https://discord.com/api/oauth2/authorize?client_id=..."
                value={discordAuthUrl}
                onChange={(e) => setDiscordAuthUrl(e.target.value)}
                className="bg-secondary border-border font-mono text-sm"
              />
              {discordAuthUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(discordAuthUrl, "_blank")}
                  title="Testar link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Cole aqui o link OAuth do Discord para autenticacao de membros. Os usuarios serao redirecionados para este link ao clicar em &quot;Vincular Discord&quot;.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discordServerUrl">Link do Servidor Discord</Label>
            <div className="flex gap-2">
              <Input
                id="discordServerUrl"
                placeholder="https://discord.gg/seu-servidor"
                value={discordServerUrl}
                onChange={(e) => setDiscordServerUrl(e.target.value)}
                className="bg-secondary border-border font-mono text-sm"
              />
              {discordServerUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(discordServerUrl, "_blank")}
                  title="Testar link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Link de convite do seu servidor Discord. Sera exibido no botao &quot;Entrar no Discord&quot; no footer do site.
            </p>
          </div>

          <Button 
            onClick={handleSaveDiscord} 
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? (
              "Salvando..."
            ) : saved ? (
              "Salvo com sucesso!"
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configuracoes Discord
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Settings className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Configuracoes Gerais</h2>
            <p className="text-sm text-muted-foreground">Outras configuracoes do painel</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Notificacoes por Email</p>
              <p className="text-sm text-muted-foreground">Receba alertas de vendas e recargas</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" defaultChecked />
              <div className="h-6 w-11 rounded-full bg-secondary peer-checked:bg-accent after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Notificacoes Push</p>
              <p className="text-sm text-muted-foreground">Receba notificacoes no navegador</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-secondary peer-checked:bg-accent after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Modo Manutencao</p>
              <p className="text-sm text-muted-foreground">Desativa temporariamente o site para usuarios</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-secondary peer-checked:bg-accent after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
