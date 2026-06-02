"use client"

import Link from "next/link"
import { Database, CreditCard, Settings, ChevronRight } from "lucide-react"

const configSections = [
  {
    title: "Banco de Dados",
    description: "Configure a conexao com seu banco de dados (PostgreSQL, MySQL, MongoDB)",
    href: "/paineladminseven/configuracoes/banco-de-dados",
    icon: Database,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Gateway PIX",
    description: "Configure sua gateway de pagamento para receber via PIX",
    href: "/paineladminseven/configuracoes/gateway",
    icon: CreditCard,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
]

export default function ConfiguracoesPage() {
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
