"use client"

import { FileText, AlertTriangle, Video, Clock, CheckCircle2 } from "lucide-react"

export default function TrocasPage() {
  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/50 via-background to-background p-8">
        {/* Decorative gradient */}
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        
        <div className="relative flex items-start justify-between">
          <div className="max-w-2xl space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm font-medium text-emerald-400">
              <FileText className="h-4 w-4" />
              TERMOS DE TROCA
            </div>
            
            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Regras para solicitação de troca
            </h1>
            
            {/* Description */}
            <p className="text-base text-muted-foreground">
              Para manter o processo objetivo e justo, toda análise de troca segue os
              critérios abaixo. Solicitações fora dessas regras não entram em aprovação.
            </p>
          </div>
          
          {/* Decorative checklist illustration */}
          <div className="hidden lg:block">
            <div className="relative h-32 w-40 rounded-xl border border-border/50 bg-card/50 p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-muted-foreground/30" />
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="h-2 w-20 rounded-full bg-emerald-500/50" />
                <div className="h-2 w-14 rounded-full bg-emerald-500/30" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Troca limitada */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Troca limitada</h3>
          <p className="text-sm text-muted-foreground">
            Trocas somente por die ou saldo insuficiente.
          </p>
        </div>

        {/* Prova obrigatória */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Video className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Prova obrigatória</h3>
          <p className="text-sm text-muted-foreground">
            É obrigatório enviar vídeo mostrando claramente o erro e a info do material.
          </p>
        </div>

        {/* Prazo máximo */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Prazo máximo</h3>
          <p className="text-sm text-muted-foreground">
            O vídeo precisa ser enviado dentro dos 10 minutos após a entrega.
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Checklist */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Checklist para troca aceita</h3>
              <p className="text-sm text-muted-foreground">Envie tudo corretamente para evitar recusa.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                Mostrar claramente o erro ocorrido no momento da tentativa.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                Mostrar a info completa do material no mesmo vídeo.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                Enviar o vídeo dentro da janela de 10 minutos após a entrega.
              </p>
            </div>
          </div>
        </div>

        {/* Time Window */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Janela de envio</h3>
              <p className="text-sm text-muted-foreground">Após esse prazo, a troca não entra em análise.</p>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-yellow-950/50 to-yellow-900/20 p-6 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-yellow-500">
              PRAZO LIMITE
            </p>
            <p className="mb-3 text-6xl font-bold text-foreground">
              10 <span className="text-4xl">min</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Conte a partir do momento em que a entrega foi concluída no pedido.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
