"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  HelpCircle, 
  Sparkles, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  Globe, 
  AlertTriangle, 
  Home,
  Zap,
  ShieldCheck,
  ChevronDown,
  MessageCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FaqItem {
  icon: React.ElementType
  question: string
  answer: string
  iconColor?: string
}

const duvidasGerais: FaqItem[] = [
  {
    icon: CreditCard,
    iconColor: "text-purple-500",
    question: "O que é Black, Premium e outros produtos?",
    answer: "Todos os produtos do site são cartões de níveis bons com saldo garantido, onde pegamos da melhor qualidade e com alta chance de aprovação."
  },
  {
    icon: FileText,
    iconColor: "text-blue-500",
    question: "O que são LOGS?",
    answer: "Logs são contas já aquecidas e antigas que já realizaram compras nos sites onde você irá tentar aprovação. Quanto mais antiga a conta e mais pedidos ela possuir, maior a probabilidade de conseguir aprovar."
  },
  {
    icon: CheckCircle,
    iconColor: "text-green-500",
    question: "O que é Aprovação?",
    answer: "Aprovação é o termo usado para compras bem-sucedidas utilizando o material disponibilizado. Uma boa aprovação depende de vários fatores: qualidade do material, login utilizado e o site escolhido."
  },
  {
    icon: Globe,
    iconColor: "text-cyan-500",
    question: "Quais sites vocês recomendam?",
    answer: "Sites grandes onde você tiver contas com histórico de compras: Shopee, AliExpress, Mercado Livre, Amazon, Kabum, Magalu, entre outros. Quanto mais a conta foi utilizada, maior a chance de aprovação."
  },
  {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    question: "O que devo evitar?",
    answer: "Se você já tentou aprovar com outros materiais, ative o 4G e certifique-se de que seu IP não esteja queimado. Um IP limpo é essencial para boas aprovações."
  },
  {
    icon: Home,
    iconColor: "text-orange-500",
    question: "Posso colocar para receber em casa?",
    answer: "SIM! Se você nunca fez envio para sua residência, é totalmente seguro colocar seu endereço. Isso é um mito — o uso é completamente tranquilo e normal."
  }
]

const duvidasTecnicas: FaqItem[] = [
  {
    icon: Zap,
    iconColor: "text-yellow-400",
    question: "O que é LIVE/DIE?",
    answer: "LIVE significa que o material está funcionando perfeitamente (funcional). DIE significa que o material está ruim ou morto (não funcional)."
  },
  {
    icon: ShieldCheck,
    iconColor: "text-yellow-400",
    question: "O que é VBV?",
    answer: "VBV (Verified by Visa) é uma etapa de segurança que confirma a identidade do comprador durante uma transação online. Cair no VBV não significa que o cartão está ruim — apenas que a loja possui essa verificação ativa."
  }
]

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  const Icon = item.icon
  
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/50"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", item.iconColor || "text-muted-foreground")} />
          <span className="font-medium text-foreground">{item.question}</span>
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      {isOpen && (
        <div className="border-t border-border bg-secondary/30 px-4 py-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function DuvidasPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "geral-0": true,
    "geral-1": true,
    "geral-2": true,
    "geral-3": true,
    "geral-4": true,
    "geral-5": true,
    "tecnica-0": true,
    "tecnica-1": true,
  })

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          {/* Page Title */}
          <div className="mb-8 flex items-start gap-3">
            <HelpCircle className="mt-1 h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Perguntas Frequentes</h1>
              <p className="text-muted-foreground">Entenda os principais conceitos e como funciona nossa plataforma</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Dúvidas Gerais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Dúvidas Gerais
              </div>
              <div className="space-y-3">
                {duvidasGerais.map((item, index) => (
                  <AccordionItem
                    key={`geral-${index}`}
                    item={item}
                    isOpen={openItems[`geral-${index}`] || false}
                    onToggle={() => toggleItem(`geral-${index}`)}
                  />
                ))}
              </div>
            </div>

            {/* Dúvidas Técnicas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                Dúvidas Técnicas
              </div>
              <div className="space-y-3">
                {duvidasTecnicas.map((item, index) => (
                  <AccordionItem
                    key={`tecnica-${index}`}
                    item={item}
                    isOpen={openItems[`tecnica-${index}`] || false}
                    onToggle={() => toggleItem(`tecnica-${index}`)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Avaliações CTA */}
          <div className="mt-8 rounded-lg border border-border bg-card p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground">Aprovou? Envie suas avaliações!</h3>
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              Dúvidas? Entre em contato com nosso suporte
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
