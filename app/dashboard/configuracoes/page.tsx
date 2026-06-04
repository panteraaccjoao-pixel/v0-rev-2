"use client"

import { useState } from "react"
import { User, Bell, Shield, Palette, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function ConfiguracoesPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    drops: true,
    promocoes: false,
  })

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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Seu nome" defaultValue="Usuário" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" disabled />
            </div>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Salvar alterações
          </Button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Bell className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Notificações</h2>
            <p className="text-sm text-muted-foreground">Escolha como deseja ser notificado</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por e-mail</p>
              <p className="text-sm text-muted-foreground">Receba atualizações importantes</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Alertas de Drops</p>
              <p className="text-sm text-muted-foreground">Seja notificado sobre novos drops</p>
            </div>
            <Switch
              checked={notifications.drops}
              onCheckedChange={(checked) => setNotifications({ ...notifications, drops: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Promoções</p>
              <p className="text-sm text-muted-foreground">Receba ofertas e descontos especiais</p>
            </div>
            <Switch
              checked={notifications.promocoes}
              onCheckedChange={(checked) => setNotifications({ ...notifications, promocoes: checked })}
            />
          </div>
        </div>
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
