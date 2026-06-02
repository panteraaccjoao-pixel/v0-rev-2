"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, QrCode, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Link from "next/link"

const predefinedValues = [
  { value: 10, label: "R$ 10" },
  { value: 25, label: "R$ 25" },
  { value: 50, label: "R$ 50" },
  { value: 100, label: "R$ 100" },
  { value: 200, label: "R$ 200" },
  { value: 500, label: "R$ 500" },
]

export default function RecarregarPage() {
  const router = useRouter()
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [customValue, setCustomValue] = useState("")
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentBalance] = useState(0)

  const handleValueSelect = (value: number) => {
    setSelectedValue(value)
    setCustomValue("")
    setPixCode(null)
  }

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setCustomValue(value)
    setSelectedValue(null)
    setPixCode(null)
  }

  const getFinalValue = () => {
    if (selectedValue) return selectedValue
    if (customValue) return parseInt(customValue)
    return 0
  }

  const handleGeneratePix = async () => {
    const value = getFinalValue()
    if (value < 5) return

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${value.toFixed(2)}5802BR5913REV SYSTEM6008SAOPAULO62070503***6304`
      setPixCode(mockPixCode)
    } catch (err) {
      console.error("Erro ao gerar PIX:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPix = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="p-4">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-lg px-4 pb-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Recarregar saldo</h1>
          <p className="mt-2 text-muted-foreground">Selecione um valor ou digite um valor personalizado</p>
        </div>

        {/* Current Balance */}
        <div className="mb-8 rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Saldo atual</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            R$ {currentBalance.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {/* Predefined Values */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Valores sugeridos</p>
          <div className="grid grid-cols-3 gap-3">
            {predefinedValues.map((item) => (
              <button
                key={item.value}
                onClick={() => handleValueSelect(item.value)}
                className={cn(
                  "rounded-lg border border-border bg-card px-4 py-4 text-center font-semibold transition-all hover:border-muted-foreground",
                  selectedValue === item.value && "border-accent bg-accent/10 text-accent"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Value */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Ou digite um valor personalizado</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
            <Input
              type="text"
              placeholder="0,00"
              value={customValue}
              onChange={handleCustomValueChange}
              className="h-14 bg-card pl-12 text-lg"
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Valor mínimo: R$ 5,00</p>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Método de pagamento</p>
          <div className="rounded-lg border-2 border-accent bg-accent/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                <QrCode className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-foreground">PIX</p>
                <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Generate PIX Button */}
        {!pixCode ? (
          <Button
            onClick={handleGeneratePix}
            disabled={loading || getFinalValue() < 5}
            className="h-14 w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {loading ? "Gerando código PIX..." : "Gerar código PIX"}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* PIX Code Display */}
            <div className="rounded-lg bg-card p-4">
              <p className="mb-2 text-sm text-muted-foreground">Código PIX copia e cola:</p>
              <p className="break-all rounded bg-secondary/50 p-3 text-sm text-muted-foreground">{pixCode}</p>
            </div>

            {/* Copy Button */}
            <Button
              onClick={handleCopyPix}
              className="h-14 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  Copiar código PIX
                </>
              )}
            </Button>

            {/* Value Summary */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valor da recarga:</span>
                <span className="text-xl font-bold text-accent">
                  R$ {getFinalValue().toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">Como funciona?</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Selecione ou digite o valor desejado</li>
            <li>2. Clique em &quot;Gerar código PIX&quot;</li>
            <li>3. Copie o código ou escaneie o QR Code</li>
            <li>4. O saldo é creditado automaticamente</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
