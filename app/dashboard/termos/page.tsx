"use client"

import { FileText, Shield, AlertTriangle, CheckCircle } from "lucide-react"

export default function TermosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Termos de Uso</h1>
        <p className="text-muted-foreground">
          Leia atentamente os termos e condições de uso da plataforma
        </p>
      </div>

      {/* Last Update */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Última atualização: 01 de Junho de 2026
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold">1. Aceitação dos Termos</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ao acessar e utilizar a plataforma REV SYSTEM, você concorda com estes termos de uso. 
            Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.
            O uso continuado da plataforma constitui aceitação de quaisquer alterações futuras.
          </p>
        </div>

        {/* Section 2 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold">2. Uso da Plataforma</h2>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              A plataforma é destinada exclusivamente para uso pessoal e não comercial.
              É proibido:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>Compartilhar sua conta com terceiros</li>
              <li>Utilizar bots ou automações não autorizadas</li>
              <li>Tentar burlar os sistemas de segurança</li>
              <li>Revender ou redistribuir produtos adquiridos</li>
              <li>Realizar atividades que violem leis locais ou internacionais</li>
            </ul>
          </div>
        </div>

        {/* Section 3 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <h2 className="text-lg font-semibold">3. Política de Reembolso</h2>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Reembolsos são concedidos apenas nos seguintes casos:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>Produto entregue com defeito comprovado</li>
              <li>Erro da plataforma na entrega</li>
              <li>Duplicação de cobrança</li>
            </ul>
            <p className="mt-4 font-medium text-foreground">
              Prazo para solicitação: até 10 minutos<br />
              após a compra com prova em vídeo.
            </p>
          </div>
        </div>

        {/* Section 4 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold">4. Responsabilidades do Usuário</h2>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              O usuário é responsável por:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>Manter suas credenciais de acesso seguras</li>
              <li>Utilizar os produtos de forma ética e legal</li>
              <li>Verificar a compatibilidade dos produtos antes da compra</li>
              <li>Reportar qualquer problema ou irregularidade</li>
            </ul>
          </div>
        </div>

        {/* Section 5 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-lg font-semibold">5. Privacidade e Dados</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Respeitamos sua privacidade. Os dados coletados são utilizados apenas para 
            operação da plataforma e melhoria dos serviços. Não compartilhamos informações 
            pessoais com terceiros sem seu consentimento expresso, exceto quando exigido por lei.
          </p>
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-accent/50 bg-accent/5 p-6">
          <h3 className="mb-2 font-semibold">Dúvidas sobre os Termos?</h3>
          <p className="text-sm text-muted-foreground">
            Entre em contato conosco através do sistema de tickets ou pelo Discord oficial.
            Estamos disponíveis para esclarecer qualquer dúvida sobre nossos termos de uso.
          </p>
        </div>
      </div>
    </div>
  )
}
