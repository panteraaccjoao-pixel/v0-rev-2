"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, QrCode, Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"

const predefinedValues = [
  { value: 10, label: "R$ 10" },
  { value: 25, label: "R$ 25" },
  { value: 50, label: "R$ 50" },
  { value: 100, label: "R$ 100" },
  { value: 200, label: "R$ 200" },
  { value: 500, label: "R$ 500" },
]

interface PixResponse {
  success: boolean
  pixCode: string
  qrCodeBase64?: string
  expiresAt?: string
  txId?: string
  error?: string
}

export default function RecarregarPage() {
  const router = useRouter()
  const [rechargeValue, setRechargeValue] = useState<number>(0)
  const [customValue, setCustomValue] = useState("")
  const [pixData, setPixData] = useState<PixResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentBalance] = useState(0)

  const handleValueSelect = (value: number) => {
    // Soma o valor ao invés de substituir
    setRechargeValue(prev => prev + value)
    setCustomValue("")
    setPixCode(null)
  }

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setCustomValue(value)
    setRechargeValue(0)
    setPixData(null)
    setError(null)
  }

  const getFinalValue = () => {
    if (rechargeValue > 0) return rechargeValue
    if (customValue) return parseInt(customValue)
    return 0
  }

  const handleClearValue = () => {
    setRechargeValue(0)
    setCustomValue("")
    setPixData(null)
    setError(null)
  }

  const handleGeneratePix = async () => {
    const value = getFinalValue()
    if (value < 5) return

    setLoading(true)
    setError(null)

    try {
      // Get user data from session
      const userSession = localStorage.getItem("user_session")
      const userData = userSession ? JSON.parse(userSession) : {}

      const response = await fetch("/api/pix/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          userId: userData.userId,
          userEmail: userData.email,
        }),
      })

      const data: PixResponse = await response.json()

      if (data.success && data.pixCode) {
        setPixData(data)
      } else {
        setError(data.error || "Erro ao gerar PIX. Tente novamente.")
      }
    } catch (err) {
      console.error("Erro ao gerar PIX:", err)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPix = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode)
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

        {/* Recharge Value Display */}
        {getFinalValue() > 0 && (
          <div className="mb-6 rounded-lg border-2 border-accent bg-accent/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor a recarregar</p>
                <p className="text-2xl font-bold text-accent">
                  R$ {getFinalValue().toFixed(2).replace(".", ",")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearValue}
                className="text-muted-foreground hover:text-foreground"
              >
                Limpar
              </Button>
            </div>
          </div>
        )}

        {/* Predefined Values */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Valores sugeridos <span className="text-xs">(clique para somar)</span></p>
          <div className="grid grid-cols-3 gap-3">
            {predefinedValues.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setRechargeValue(prev => prev + item.value)
                  setCustomValue("")
                  setPixData(null)
                }}
                className="rounded-lg border border-border bg-card px-4 py-4 text-center font-semibold transition-all hover:border-accent hover:bg-accent/10 active:scale-95"
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
        {!pixData ? (
          <>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}
            <Button
              onClick={handleGeneratePix}
              disabled={loading || getFinalValue() < 5}
              className="h-14 w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando código PIX...
                </>
              ) : (
                "Gerar código PIX"
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            {/* QR Code Display */}
            {pixData.qrCodeBase64 && (
              <div className="flex justify-center rounded-lg bg-white p-6">
                <Image
                  src={pixData.qrCodeBase64.startsWith("data:") 
                    ? pixData.qrCodeBase64 
                    : `data:image/png;base64,${pixData.qrCodeBase64}`
                  }
                  alt="QR Code PIX"
                  width={200}
                  height={200}
                  className="h-48 w-48"
                />
              </div>
            )}

            {/* PIX Code Display */}
            <div className="rounded-lg bg-card p-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">PIX Copia e Cola:</p>
              <div className="relative">
                <p className="break-all rounded bg-secondary/50 p-3 pr-12 text-xs text-muted-foreground font-mono">
                  {pixData.pixCode}
                </p>
              </div>
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
              {pixData.expiresAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Expira em: {new Date(pixData.expiresAt).toLocaleTimeString("pt-BR")}
                </p>
              )}
              {pixData.txId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  ID: {pixData.txId}
                </p>
              )}
            </div>

            {/* Generate New PIX */}
            <Button
              variant="outline"
              onClick={() => {
                setPixData(null)
                setRechargeValue(0)
                setCustomValue("")
              }}
              className="w-full"
            >
              Gerar novo PIX
            </Button>
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
