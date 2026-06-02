"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Lock, Bell, Palette } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do painel admin
        </p>
      </div>

      <div className="grid gap-6">
        {/* Security */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                className="bg-secondary border-border max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                className="bg-secondary border-border max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                className="bg-secondary border-border max-w-md"
              />
            </div>
            <Button>Alterar Senha</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novas vendas</p>
                <p className="text-sm text-muted-foreground">
                  Receber notificação quando uma venda for realizada
                </p>
              </div>
              <Button variant="outline" size="sm">Ativar</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novos usuários</p>
                <p className="text-sm text-muted-foreground">
                  Receber notificação quando um usuário se cadastrar
                </p>
              </div>
              <Button variant="outline" size="sm">Ativar</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tickets de suporte</p>
                <p className="text-sm text-muted-foreground">
                  Receber notificação quando abrirem um ticket
                </p>
              </div>
              <Button variant="secondary" size="sm">Desativar</Button>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Nome do Site</Label>
              <Input
                id="site-name"
                defaultValue="REV SYSTEM"
                className="bg-secondary border-border max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select defaultValue="brl">
                <SelectTrigger className="bg-secondary border-border max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="brl">Real (R$)</SelectItem>
                  <SelectItem value="usd">Dólar ($)</SelectItem>
                  <SelectItem value="eur">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix-key">Chave PIX</Label>
              <Input
                id="pix-key"
                placeholder="Sua chave PIX"
                className="bg-secondary border-border max-w-md"
              />
            </div>
            <Button>Salvar Configurações</Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tema</Label>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1">
                  Escuro
                </Button>
                <Button variant="outline" className="flex-1">
                  Claro
                </Button>
                <Button variant="outline" className="flex-1">
                  Sistema
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor de Destaque</Label>
              <div className="flex gap-3">
                <button className="h-8 w-8 rounded-full bg-green-500 ring-2 ring-offset-2 ring-offset-background ring-green-500" />
                <button className="h-8 w-8 rounded-full bg-blue-500" />
                <button className="h-8 w-8 rounded-full bg-orange-500" />
                <button className="h-8 w-8 rounded-full bg-pink-500" />
                <button className="h-8 w-8 rounded-full bg-cyan-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
