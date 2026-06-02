"use client"

import { useState } from "react"
import { Wallet, QrCode, Copy, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const predefinedValues = [
  { value: 10, label: "R$ 10" },
  { value: 20, label: "R$ 20" },
  { value: 50, label: "R$ 50" },
  { value: 100, label: "R$ 100" },
  { value: 200, label: "R$ 200" },
  { value: 500, label: "R$ 500" },
]

export default function RecarregarPage() {
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [customValue, setCustomValue] = useState("")
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleValueSelect = (value: number) => {
    setSelectedValue(value)
    setCustomValue("")
    setPixCode(null)
    setError("")
  }

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setCustomValue(value)
    setSelectedValue(null)
    setPixCode(null)
    setError("")
  }

  const getFinalValue = () => {
    if (selectedValue) return selectedValue
    if (customValue) return parseInt(customValue)
    return 0
  }

  const handleGeneratePix = async () => {
    const value = getFinalValue()
    if (value < 5) {
      setError("O valor mínimo para recarga é R$ 5,00")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Simula geração do PIX - em produção, chamar a API da gateway
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Gera um código PIX fictício para demonstração
      const mockPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${value.toFixed(2)}5802BR5913REV SYSTEM6008SAOPAULO62070503***6304`
      setPixCode(mockPixCode)
    } catch (err) {
      setError("Erro ao gerar PIX. Tente novamente.")
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recarga de Saldo</h1>
        <p className="text-muted-foreground">Adicione saldo à sua conta via PIX</p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Value Selection */}
        <div className="space-y-6">
          {/* Predefined Values */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Selecione um valor</h2>
            <div className="grid grid-cols-3 gap-3">
              {predefinedValues.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleValueSelect(item.value)}
                  className={cn(
                    "rounded-lg border border-border bg-secondary/50 px-4 py-3 text-center font-medium transition-all hover:border-accent hover:bg-accent/10",
                    selectedValue === item.value && "border-accent bg-accent/10 text-accent"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Value */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Ou digite um valor personalizado</h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="text"
                placeholder="0,00"
                value={customValue}
                onChange={handleCustomValueChange}
                className="h-12 pl-12 text-lg"
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Valor mínimo: R$ 5,00</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGeneratePix}
            disabled={loading || getFinalValue() < 5}
            className="h-12 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? (
              "Gerando PIX..."
            ) : (
              <>
                <QrCode className="h-5 w-5" />
                Gerar PIX de R$ {getFinalValue().toFixed(2).replace(".", ",")}
              </>
            )}
          </Button>
        </div>

        {/* Right Column - PIX Code */}
        <div className="rounded-lg border border-border bg-card p-6">
          {pixCode ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <QrCode className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">PIX Gerado com Sucesso!</h2>
                <p className="text-muted-foreground">Copie o código abaixo e pague no seu banco</p>
              </div>

              {/* PIX Code Display */}
              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="break-all text-sm text-muted-foreground">{pixCode}</p>
              </div>

              {/* Copy Button */}
              <Button
                onClick={handleCopyPix}
                className="h-12 w-full gap-2"
                variant="outline"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copiar código PIX
                  </>
                )}
              </Button>

              {/* Info */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Após o pagamento, seu saldo será creditado automaticamente em alguns minutos. 
                  Caso demore mais de 10 minutos, entre em contato com o suporte.
                </p>
              </div>

              {/* Value Summary */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-muted-foreground">Valor da recarga:</span>
                <span className="text-xl font-bold text-accent">
                  R$ {getFinalValue().toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Selecione um valor</h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Escolha um dos valores pré-definidos ou digite um valor personalizado para gerar o código PIX.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
