"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Shield, Copy, Check, Loader2, QrCode, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
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

interface PixPayment {
  id: string
  amount: number
  pixCode: string
  qrCodeUrl: string
  expiresAt: string
}

export default function RecarregarPage() {
  const [rechargeValue, setRechargeValue] = useState<number>(0)
  const [customValue, setCustomValue] = useState("")
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null)
  const [copied, setCopied] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "expired">("pending")
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [currentBalance, setCurrentBalance] = useState(0)
  const [creditedAmount, setCreditedAmount] = useState(0)

  // Load current balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const res = await fetch("/api/users")
        const data = await res.json()
        const user = data.users?.find((u: { email: string; balance: number }) => u.email === "teste@teste.com")
        if (user) setCurrentBalance(user.balance)
      } catch {
        // ignore
      }
    }
    loadBalance()
  }, [])

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    // Trava o valor máximo em R$ 1.000
    if (value && parseInt(value) > 1000) {
      value = "1000"
    }
    setCustomValue(value)
    setRechargeValue(0)
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
    setError(null)
  }

  // Credit balance after payment confirmed
  const creditBalance = useCallback(async (amount: number) => {
    try {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_balance",
          email: "teste@teste.com",
          amount: amount,
        }),
      })
      setCreditedAmount(amount)
      setCurrentBalance((prev) => prev + amount)
    } catch (err) {
      console.error("Error crediting balance:", err)
    }
  }, [])

  // Poll for payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!pixPayment) return

    try {
      const res = await fetch(`/api/pix?id=${pixPayment.id}`)
      const data = await res.json()

      if (data.status === "paid") {
        setPaymentStatus("paid")
        creditBalance(pixPayment.amount)
      } else if (data.status === "expired") {
        setPaymentStatus("expired")
      }
    } catch (err) {
      console.error("Error checking payment:", err)
    }
  }, [pixPayment, creditBalance])

  useEffect(() => {
    if (pixPayment && paymentStatus === "pending") {
      const interval = setInterval(checkPaymentStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [pixPayment, paymentStatus, checkPaymentStatus])

  // Countdown timer
  useEffect(() => {
    if (pixPayment && paymentStatus === "pending") {
      const updateTimer = () => {
        const now = new Date().getTime()
        const expiry = new Date(pixPayment.expiresAt).getTime()
        const diff = expiry - now

        if (diff <= 0) {
          setTimeLeft("Expirado")
          setPaymentStatus("expired")
          return
        }

        const minutes = Math.floor(diff / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [pixPayment, paymentStatus])

  const handleGeneratePix = async () => {
    const value = getFinalValue()
    if (value < 15) {
      setError("O valor mínimo para recarga é R$ 15,00.")
      return
    }
    if (value > 1000) {
      setError("O valor máximo para recarga é R$ 1.000,00.")
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const res = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          items: [{ level: "Recarga", brand: "Saldo", quantity: 1, price: value }],
        }),
      })

      const data = await res.json()

      if (data.success) {
        setPixPayment(data.payment)
      } else {
        setError(data.error || "Erro ao gerar PIX. Tente novamente.")
      }
    } catch (err) {
      console.error("Erro ao gerar PIX:", err)
      setError("Erro de conexao. Tente novamente.")
    } finally {
      setProcessing(false)
    }
  }

  const handleCopyPixCode = async () => {
    if (!pixPayment) return

    try {
      await navigator.clipboard.writeText(pixPayment.pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const textArea = document.createElement("textarea")
      textArea.value = pixPayment.pixCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleNewRecharge = () => {
    setPixPayment(null)
    setPaymentStatus("pending")
    setRechargeValue(0)
    setCustomValue("")
    setCreditedAmount(0)
    setError(null)
  }

  // PIX Payment Screen OR Success Screen
  if (pixPayment) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <Card className="max-w-lg mx-auto bg-card border-border">
          <CardContent className="p-6 space-y-6">
            {paymentStatus === "paid" ? (
              // Payment Success
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
                    <Check className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-500 mb-2">Pagamento Confirmado!</h2>
                  <p className="text-muted-foreground text-center">
                    Seu saldo foi recarregado com sucesso
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-secondary/30 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Valor recarregado</span>
                    <span className="text-xl font-bold text-emerald-500">
                      + R$ {creditedAmount.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="font-semibold">Saldo atual</span>
                    <span className="text-2xl font-bold text-accent">
                      R$ {currentBalance.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleNewRecharge}>
                    Nova recarga
                  </Button>
                  <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/dashboard">Ir ao painel</Link>
                  </Button>
                </div>
              </div>
            ) : paymentStatus === "expired" ? (
              // Expired
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                  <QrCode className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-red-500">PIX Expirado</h2>
                <p className="text-muted-foreground text-center">
                  O tempo para pagamento expirou. Gere um novo codigo PIX.
                </p>
                <Button onClick={handleNewRecharge} className="w-full">
                  Gerar novo PIX
                </Button>
              </div>
            ) : (
              // Pending Payment
              <>
                {/* Header */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Pague com PIX</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Escaneie o QR Code ou copie o codigo
                  </p>
                </div>

                {/* Timer */}
                {timeLeft && (
                  <div className="flex items-center justify-center">
                    <span className="rounded-full bg-secondary px-4 py-1 text-sm font-medium text-muted-foreground">
                      Expira em {timeLeft}
                    </span>
                  </div>
                )}

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="rounded-xl bg-white p-4">
                    <Image
                      src={pixPayment.qrCodeUrl}
                      alt="QR Code PIX"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-3xl font-bold text-accent">
                    R$ {pixPayment.amount.toFixed(2).replace(".", ",")}
                  </p>
                </div>

                {/* Copy PIX Code */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">PIX Copia e Cola</p>
                  <div className="relative">
                    <Input
                      value={pixPayment.pixCode}
                      readOnly
                      className="pr-24 bg-secondary border-border font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      className={`absolute right-1 top-1/2 -translate-y-1/2 ${copied ? "bg-emerald-600" : ""}`}
                      onClick={handleCopyPixCode}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Waiting for Payment */}
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Aguardando pagamento...</span>
                </div>

                {/* Security Footer */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Pagamento seguro via PIX</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Value Selection Screen
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
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Valores sugeridos <span className="text-xs">(clique para somar)</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {predefinedValues.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setRechargeValue((prev) => Math.min(prev + item.value, 1000))
                  setCustomValue("")
                }}
                className="rounded-lg border border-border bg-card px-4 py-4 text-center font-semibold transition-all hover:border-accent hover:bg-accent/10 active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Slider Value */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Ou ajuste o valor</p>
          <Slider
            min={10}
            max={1000}
            step={5}
            value={[Math.min(Math.max(getFinalValue() || 10, 10), 1000)]}
            onValueChange={(vals) => {
              setRechargeValue(vals[0])
              setCustomValue("")
              setError(null)
            }}
            className="[&_[data-slot=slider-range]]:bg-accent [&_[data-slot=slider-thumb]]:border-accent"
          />
          <div className="mt-2 flex justify-between text-sm text-muted-foreground">
            <span>R$ 10</span>
            <span>R$ 1.000</span>
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
          <p className="mt-2 text-sm text-muted-foreground">Valor minimo: R$ 15,00 • Valor maximo: R$ 1.000,00</p>
        </div>

        {/* Generate PIX Button */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}
        <Button
          onClick={handleGeneratePix}
          disabled={processing || getFinalValue() < 15 || getFinalValue() > 1000}
          className="h-14 w-full bg-emerald-600 text-white hover:bg-emerald-700 text-lg font-semibold"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando codigo PIX...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-5 w-5" />
              Recarregar via PIX
            </>
          )}
        </Button>

        {/* How it works */}
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">Como funciona?</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Selecione ou digite o valor desejado</li>
            <li>2. Clique em &quot;Recarregar via PIX&quot;</li>
            <li>3. Copie o codigo ou escaneie o QR Code</li>
            <li>4. O saldo e creditado automaticamente apos o pagamento</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
