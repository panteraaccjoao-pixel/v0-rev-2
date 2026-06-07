"use client"

import { useState, useEffect } from "react"
import { User, Shield, Palette, LogOut, MessageCircle, Check, X, Loader2, ExternalLink } from "lucide-react"
import { getSessionEmail, setSessionProfile } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DiscordData {
  linked: boolean
  discordId?: string
  discordUsername?: string
  linkedAt?: string
}

interface AdminSettings {
  discordAuthUrl: string
  discordEnabled: boolean
}

export default function ConfiguracoesPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")

  const [discordData, setDiscordData] = useState<DiscordData>({ linked: false })
  const [discordId, setDiscordId] = useState("")
  const [isLinkingDiscord, setIsLinkingDiscord] = useState(false)
  const [discordError, setDiscordError] = useState("")
  const [discordSuccess, setDiscordSuccess] = useState("")
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({ discordAuthUrl: "", discordEnabled: true })

  useEffect(() => {
    fetchProfile()
    fetchDiscordStatus()
    fetchAdminSettings()
    
    // Check for Discord callback
    const urlParams = new URLSearchParams(window.location.search)
    const discordId = urlParams.get("discord_id")
    const discordUser = urlParams.get("discord_username")
    
    if (discordId && discordUser) {
      // User returned from Discord auth
      handleDiscordCallback(discordId, discordUser)
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  const fetchProfile = async () => {
    const sessionEmail = getSessionEmail()
    if (!sessionEmail) return
    try {
      const res = await fetch(`/api/user/profile?email=${encodeURIComponent(sessionEmail)}`)
      if (res.ok) {
        const data = await res.json()
        setName(data.name || "")
        setEmail(data.email || "")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const handleSaveProfile = async () => {
    setProfileError("")
    setProfileSuccess("")

    if (!name.trim()) {
      setProfileError("O nome não pode ficar vazio")
      return
    }

    const currentEmail = getSessionEmail()
    if (!currentEmail) {
      setProfileError("Sessão não encontrada. Faça login novamente.")
      return
    }

    setProfileLoading(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentEmail, name: name.trim(), email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setProfileError(data.error || "Erro ao salvar alterações")
        return
      }

      // Atualiza a sessão local com os novos dados
      setSessionProfile({ name: data.profile.name, email: data.profile.email })
      setName(data.profile.name)
      setEmail(data.profile.email)
      setProfileSuccess("Alterações salvas com sucesso!")
      setTimeout(() => setProfileSuccess(""), 3000)
    } catch {
      setProfileError("Erro ao salvar alterações")
    } finally {
      setProfileLoading(false)
    }
  }

  const fetchAdminSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        setAdminSettings(data)
      }
    } catch (error) {
      console.error("Error fetching admin settings:", error)
    }
  }

  const fetchDiscordStatus = async () => {
    try {
      const res = await fetch("/api/user/discord")
      if (res.ok) {
        const data = await res.json()
        setDiscordData(data)
      }
    } catch (error) {
      console.error("Error fetching discord status:", error)
    }
  }

  const handleDiscordCallback = async (discordId: string, discordUsername: string) => {
    setIsLinkingDiscord(true)
    try {
      const res = await fetch("/api/user/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId, discordUsername })
      })

      const data = await res.json()

      if (res.ok) {
        setDiscordData({
          linked: true,
          discordId: data.discordId,
          discordUsername: data.discordUsername,
          linkedAt: data.linkedAt
        })
        setDiscordSuccess("Discord vinculado com sucesso!")
        setTimeout(() => setDiscordSuccess(""), 3000)
      } else {
        setDiscordError(data.error || "Erro ao vincular Discord")
      }
    } catch {
      setDiscordError("Erro ao vincular Discord")
    } finally {
      setIsLinkingDiscord(false)
    }
  }

  const handleLinkDiscord = async () => {
    // If there's an OAuth URL configured, redirect to it
    if (adminSettings.discordAuthUrl) {
      // Add return URL for callback
      const returnUrl = encodeURIComponent(window.location.href)
      const authUrl = adminSettings.discordAuthUrl.includes("?") 
        ? `${adminSettings.discordAuthUrl}&state=${returnUrl}`
        : `${adminSettings.discordAuthUrl}?state=${returnUrl}`
      window.location.href = authUrl
      return
    }

    // Fallback to manual ID input
    if (!discordId.trim()) {
      setDiscordError("Digite seu ID do Discord")
      return
    }

    setIsLinkingDiscord(true)
    setDiscordError("")
    setDiscordSuccess("")

    try {
      const res = await fetch("/api/user/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: discordId.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        setDiscordError(data.error || "Erro ao vincular Discord")
        return
      }

      setDiscordData({
        linked: true,
        discordId: data.discordId,
        discordUsername: data.discordUsername,
        linkedAt: data.linkedAt
      })
      setDiscordId("")
      setDiscordSuccess("Discord vinculado com sucesso!")
      setTimeout(() => setDiscordSuccess(""), 3000)
    } catch {
      setDiscordError("Erro ao vincular Discord")
    } finally {
      setIsLinkingDiscord(false)
    }
  }

  const handleUnlinkDiscord = async () => {
    setIsLinkingDiscord(true)
    setDiscordError("")

    try {
      const res = await fetch("/api/user/discord", { method: "DELETE" })

      if (!res.ok) {
        const data = await res.json()
        setDiscordError(data.error || "Erro ao desvincular Discord")
        return
      }

      setDiscordData({ linked: false })
      setDiscordSuccess("Discord desvinculado com sucesso!")
      setTimeout(() => setDiscordSuccess(""), 3000)
    } catch {
      setDiscordError("Erro ao desvincular Discord")
    } finally {
      setIsLinkingDiscord(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <User className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Perfil</h2>
            <p className="text-sm text-muted-foreground">Informações da sua conta</p>
          </div>
        </div>

        <div className="space-y-4">
          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-500">
              <Check className="h-4 w-4" />
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
              <X className="h-4 w-4" />
              {profileError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={profileLoading}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar alterações
          </Button>
        </div>
      </div>

      {/* Discord Integration Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]/10">
            <MessageCircle className="h-5 w-5 text-[#5865F2]" />
          </div>
          <div>
            <h2 className="font-semibold">Discord</h2>
            <p className="text-sm text-muted-foreground">Vincule sua conta do Discord para receber notificações</p>
          </div>
        </div>

        {discordSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-500">
            <Check className="h-4 w-4" />
            {discordSuccess}
          </div>
        )}

        {discordError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
            <X className="h-4 w-4" />
            {discordError}
          </div>
        )}

        {discordData.linked ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-[#5865F2]/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5865F2]">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">{discordData.discordUsername}</p>
                  <p className="text-sm text-muted-foreground">
                    Vinculado em {new Date(discordData.linkedAt!).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  Conectado
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleUnlinkDiscord}
              disabled={isLinkingDiscord}
              className="border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              {isLinkingDiscord ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Desvincular Discord
            </Button>
          </div>
        ) : adminSettings.discordEnabled ? (
          <div className="space-y-4">
            {adminSettings.discordAuthUrl ? (
              // OAuth URL configured - show button to redirect
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Clique no botão abaixo para autenticar sua conta do Discord e vincular ao seu perfil.
                </p>
                <Button
                  onClick={handleLinkDiscord}
                  disabled={isLinkingDiscord}
                  className="w-full bg-[#5865F2] text-white hover:bg-[#5865F2]/90"
                >
                  {isLinkingDiscord ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Vincular Discord
                </Button>
              </div>
            ) : (
                    // No OAuth URL - fallback to manual input
                    <div className="space-y-2">
                      <Label htmlFor="discord-id">ID do Discord</Label>
                      <div className="flex gap-2">
                        <Input
                          id="discord-id"
                          placeholder="123456789012345678"
                          value={discordId}
                          onChange={(e) => setDiscordId(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleLinkDiscord}
                    disabled={isLinkingDiscord}
                    className="bg-[#5865F2] text-white hover:bg-[#5865F2]/90"
                  >
                    {isLinkingDiscord ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Vincular
                  </Button>
                </div>
                      <p className="text-xs text-muted-foreground">
                        Digite seu ID do Discord para receber notificações. Para encontrar seu ID, ative o Modo Desenvolvedor nas configurações do Discord.
                      </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>Vinculação com Discord está desativada no momento.</p>
          </div>
        )}
      </div>

      {/* Security Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Segurança</h2>
            <p className="text-sm text-muted-foreground">Proteja sua conta</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input id="current-password" type="password" placeholder="••••••••" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" />
            </div>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Alterar senha
          </Button>
        </div>
      </div>

      {/* Theme Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Palette className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Aparência</h2>
            <p className="text-sm text-muted-foreground">Personalize a interface</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-lg border-2 border-accent bg-zinc-900 p-2 text-xs">
            <div className="h-6 w-6 rounded-full bg-zinc-800" />
            <span>Escuro</span>
          </button>
          <button className="flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-white p-2 text-xs text-black">
            <div className="h-6 w-6 rounded-full bg-gray-200" />
            <span>Claro</span>
          </button>
          <button className="flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-zinc-800 p-2 text-xs">
            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-zinc-800 to-gray-200" />
            <span>Sistema</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <LogOut className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="font-semibold text-red-500">Zona de Perigo</h2>
            <p className="text-sm text-muted-foreground">Ações irreversíveis</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
            Desativar conta
          </Button>
          <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
            Excluir conta permanentemente
          </Button>
        </div>
      </div>
    </div>
  )
}
