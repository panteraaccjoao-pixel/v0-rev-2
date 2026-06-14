"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Shield, Copy, Check, Loader2, QrCode, Wallet, DollarSign, ChevronRight, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import Image from "next/image"
import { authFetch } from "@/lib/session"

const predefinedValues = [
  { value: 10, label: "R$ 10" },
  { value: 25, label: "R$ 25" },
  { value: 50, label: "R$ 50" },
  { value: 100, label: "R$ 100" },
  { value: 200, label: "R$ 200" },
  { value: 500, label: "R$ 500" },
]

const BONUS_MIN = 100   // valor mínimo para ganhar bônus
const BONUS_PCT = 0.10  // 10%

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

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const res = await authFetch("/api/user/balance")
        const data = await res.json()
        if (typeof data.balance === "number") setCurrentBalance(data.balance)
      } catch {}
    }
    loadBalance()
  }, [])

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value && parseInt(value) > 1000) value = "1000"
    setCustomValue(value)
    setRechargeValue(0)
    setError(null)
  }

  const getFinalValue = () => {
    if (rechargeValue > 0) return rechargeValue
    if (customValue) return parseInt(customValue)
    return 0
  }

  const getBonus = () => {
    const v = getFinalValue()
    return v >= BONUS_MIN ? Math.round(v * BONUS_PCT * 100) / 100 : 0
  }

  const checkPaymentStatus = useCallback(async () => {
    if (!pixPayment) return
    try {
      const res = await fetch(`/api/pix?id=${pixPayment.id}`)
      const data = await res.json()
      if (data.status === "paid") {
        setPaymentStatus("paid")
        setCreditedAmount(pixPayment.amount)
        setCurrentBalance((prev) => prev + pixPayment.amount)
      } else if (data.status === "expired") {
        setPaymentStatus("expired")
      }
    } catch {}
  }, [pixPayment])

  useEffect(() => {
    if (pixPayment && paymentStatus === "pending") {
      const interval = setInterval(checkPaymentStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [pixPayment, paymentStatus, checkPaymentStatus])

  useEffect(() => {
    if (pixPayment && paymentStatus === "pending") {
      const updateTimer = () => {
        const diff = new Date(pixPayment.expiresAt).getTime() - Date.now()
        if (diff <= 0) { setTimeLeft("Expirado"); setPaymentStatus("expired"); return }
        const m = Math.floor(diff / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
      }
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [pixPayment, paymentStatus])

  const handleGeneratePix = async () => {
    const value = getFinalValue()
    if (value < 10) { setError("O valor mínimo para recarga é R$ 10,00."); return }
    if (value > 1000) { setError("O valor máximo para recarga é R$ 1.000,00."); return }
    setProcessing(true)
    setError(null)
    try {
      const res = await authFetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, items: [{ level: "Recarga", brand: "Saldo", quantity: 1, price: value }] }),
      })
      const data = await res.json()
      if (data.success) setPixPayment(data.payment)
      else setError(data.error || "Erro ao gerar PIX. Tente novamente.")
    } catch { setError("Erro de conexão. Tente novamente.") }
    finally { setProcessing(false) }
  }

  const handleCopyPixCode = async () => {
    if (!pixPayment) return
    try { await navigator.clipboard.writeText(pixPayment.pixCode) }
    catch {
      const ta = document.createElement("textarea")
      ta.value = pixPayment.pixCode
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleNewRecharge = () => {
    setPixPayment(null); setPaymentStatus("pending")
    setRechargeValue(0); setCustomValue(""); setCreditedAmount(0); setError(null)
  }

  // ── PIX / Sucesso / Expirado ────────────────────────────────────────────
  if (pixPayment) {
    const bonus = pixPayment.amount >= BONUS_MIN ? Math.round(pixPayment.amount * BONUS_PCT * 100) / 100 : 0

    if (paymentStatus === "paid") {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900 p-8 text-center space-y-5">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/30">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pagamento Confirmado!</h2>
                <p className="text-sm text-zinc-400 mt-1">Seu saldo foi recarregado com sucesso</p>
              </div>
              <div className="rounded-xl bg-zinc-800 border border-zinc-700 divide-y divide-zinc-700">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-zinc-400">Valor adicionado</span>
                  <span className="font-bold text-emerald-400">+ R$ {creditedAmount.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-zinc-400">Novo saldo</span>
                  <span className="font-bold text-white">R$ {currentBalance.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700" onClick={handleNewRecharge}>Nova recarga</Button>
                <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                  <Link href="/dashboard">Ir ao painel</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (paymentStatus === "expired") {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-8 text-center space-y-5">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 ring-2 ring-red-500/30">
                  <QrCode className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">PIX Expirado</h2>
                <p className="text-sm text-zinc-400 mt-1">O tempo para pagamento expirou.</p>
              </div>
              <Button onClick={handleNewRecharge} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-11">Gerar novo PIX</Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mx-auto max-w-3xl space-y-4">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-white" />
              <div>
                <h1 className="text-lg font-bold text-white">Pagamento PIX</h1>
                <p className="text-xs text-zinc-400">Escaneie o QR Code ou copie o código para pagar</p>
              </div>
            </div>
            <button
              onClick={handleNewRecharge}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Nova Recarga
            </button>
          </div>

          {/* Two columns */}
          <div className="grid gap-3 lg:grid-cols-2">

            {/* Left: Detalhes */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-white" />
                <h2 className="text-sm font-bold text-white">Detalhes do Pagamento</h2>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-2.5">
                  <Image src={pixPayment.qrCodeUrl} alt="QR Code PIX" width={160} height={160} className="rounded" />
                </div>
              </div>

              {/* PIX Code */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-zinc-300">Código PIX Copia e Cola</p>
                <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2">
                  <p className="font-mono text-xs text-zinc-400 break-all leading-relaxed">{pixPayment.pixCode}</p>
                </div>
                <button
                  onClick={handleCopyPixCode}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    copied
                      ? "border-emerald-500/50 bg-emerald-900/40 text-emerald-400"
                      : "border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  {copied ? <><Check className="h-3.5 w-3.5" />Código Copiado!</> : <><Copy className="h-3.5 w-3.5" />Copiar Código PIX</>}
                </button>
              </div>

              {/* Como pagar */}
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/60 p-3 space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-300">Como pagar</span>
                </div>
                {[
                  "Abra o app do seu banco",
                  "Escolha pagar com PIX",
                  "Escaneie o QR Code ou cole o código",
                  "Confirme o pagamento",
                ].map((step, i) => (
                  <p key={i} className="text-xs text-zinc-400">{i + 1}. {step}</p>
                ))}
                <p className="text-xs text-emerald-400 font-medium pt-1">Após o pagamento, seu saldo será creditado automaticamente!</p>
              </div>

              {/* Summary */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Valor:</span>
                  <span className="text-white font-medium">R$ {pixPayment.amount.toFixed(2).replace(".", ",")}</span>
                </div>
                {bonus > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Bônus (+{Math.round(BONUS_PCT * 100)}%):</span>
                    <span className="text-emerald-400 font-medium">+R$ {bonus.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="border-t border-zinc-700 pt-1.5 flex justify-between text-xs font-bold">
                  <span className="text-white">Total a receber:</span>
                  <span className="text-red-400">R$ {(pixPayment.amount + bonus).toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>

            {/* Right: Status */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Status do Pagamento</h2>
                <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400">
                  Aguardando Pagamento
                </span>
              </div>

              {/* Aguardando */}
              <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3 flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/15">
                  <Loader2 className="h-3.5 w-3.5 text-orange-400 animate-spin" />
                </div>
                <div>
                  <p className="font-semibold text-white text-xs">Aguardando pagamento</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Estamos aguardando a confirmação do seu pagamento PIX.</p>
                </div>
              </div>

              {/* Verificação automática */}
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/60 p-3 flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700">
                  <Shield className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-xs">Verificação automática</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Estamos verificando seu pagamento automaticamente a cada 5 segundos. Após o pagamento, o saldo será creditado instantaneamente!</p>
                </div>
              </div>

              {/* Timer */}
              {timeLeft && (
                <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2.5 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-zinc-400">Expira em <span className="font-mono font-bold text-white">{timeLeft}</span></span>
                </div>
              )}

              {/* ID */}
              <div className="rounded-lg bg-zinc-800/40 border border-zinc-700/40 px-3 py-2 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">ID da Recarga:</span>
                <span className="font-mono text-xs text-zinc-300 truncate">{pixPayment.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Tela principal ──────────────────────────────────────────────────────
  const finalValue = getFinalValue()
  const bonus = getBonus()
  const afterBalance = currentBalance + finalValue + bonus

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-white">Recarregar Saldo</h1>
          </div>
          <p className="text-muted-foreground text-sm">Siga os passos abaixo para adicionar créditos à sua conta</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[{ n: 1, label: "Valor" }, { n: 2, label: "Confirmação" }].map((step, i) => (
            <div key={step.n} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${step.n === 1 ? "bg-red-500 text-white" : "bg-zinc-700 text-zinc-400"}`}>
                  {step.n}
                </div>
                <span className={`text-sm font-medium ${step.n === 1 ? "text-white" : "text-zinc-500"}`}>{step.label}</span>
              </div>
              {i < 1 && <div className="w-12 h-px bg-zinc-700" />}
            </div>
          ))}
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">Saldo Atual</span>
              <DollarSign className="h-4 w-4 text-zinc-500" />
            </div>
            <p className="text-2xl font-bold text-white">R$ {currentBalance.toFixed(2).replace(".", ",")}</p>
            <p className="text-xs text-zinc-500 mt-1">Disponível na conta</p>
          </div>
          <div className={`rounded-xl border p-5 transition-all ${finalValue > 0 ? "border-emerald-500/60 bg-emerald-950/40" : "border-zinc-700 bg-zinc-900"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm ${finalValue > 0 ? "text-emerald-400" : "text-zinc-400"}`}>Saldo Após Recarga</span>
              <CircleCheck className={`h-4 w-4 ${finalValue > 0 ? "text-emerald-400" : "text-zinc-500"}`} />
            </div>
            <p className={`text-2xl font-bold ${finalValue > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
              R$ {afterBalance.toFixed(2).replace(".", ",")}
            </p>
            {finalValue > 0 && bonus > 0 ? (
              <p className="text-xs text-emerald-500 mt-1">+R$ {finalValue.toFixed(2).replace(".", ",")} + R$ {bonus.toFixed(2).replace(".", ",")} bônus ({Math.round(BONUS_PCT * 100)}%)</p>
            ) : (
              <p className="text-xs text-zinc-500 mt-1">{finalValue > 0 ? `+R$ ${finalValue.toFixed(2).replace(".", ",")}` : "Selecione um valor"}</p>
            )}
          </div>
        </div>

        {/* Step 1 */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-red-500" />
              <h2 className="text-lg font-bold text-white">Etapa 1: Escolha o valor</h2>
            </div>
            <p className="text-sm text-zinc-400">Selecione quanto deseja recarregar</p>
          </div>

          {/* Selected value display */}
          <div className="rounded-xl bg-zinc-800/80 border border-zinc-700 py-6 text-center">
            {finalValue > 0 ? (
              <>
                <p className="text-4xl font-bold text-red-400">R$ {finalValue.toFixed(2).replace(".", ",")}</p>
                <p className="text-sm text-zinc-400 mt-2">Valor selecionado</p>
                {bonus > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <CircleCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400 font-medium">Bônus de {Math.round(BONUS_PCT * 100)}% ativo!</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-2xl font-semibold text-zinc-500">Nenhum valor selecionado</p>
            )}
          </div>

          {/* Quick values */}
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Valores Rápidos</p>
            <div className="grid grid-cols-3 gap-3">
              {predefinedValues.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => { setRechargeValue((prev) => Math.min(prev + item.value, 1000)); setCustomValue(""); setError(null) }}
                  className={`rounded-xl border py-3.5 text-sm font-semibold transition-all hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-400 active:scale-95 ${
                    false
                      ? "border-red-500 bg-red-500/15 text-red-400"
                      : "border-zinc-700 bg-zinc-800 text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider */}
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Ou ajuste o valor</p>
            <Slider
              min={10}
              max={500}
              step={5}
              value={[Math.min(Math.max(finalValue || 10, 10), 500)]}
              onValueChange={(vals) => { setRechargeValue(vals[0]); setCustomValue(""); setError(null) }}
              className="[&_[data-slot=slider-range]]:bg-red-500 [&_[data-slot=slider-thumb]]:border-red-500 [&_[data-slot=slider-thumb]]:bg-red-500"
            />
            <div className="mt-2 flex justify-between text-xs text-zinc-500">
              <span>R$ 10</span>
              <span>R$ 500</span>
            </div>
          </div>

          {/* Custom value */}
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Valor personalizado</p>
            <Input
              type="text"
              placeholder="Ex: 50,00"
              value={customValue}
              onChange={handleCustomValueChange}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
            />
            <p className="mt-1.5 text-xs text-zinc-500">Mínimo: R$ 10,00 • Máximo: R$ 500,00</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button
            onClick={handleGeneratePix}
            disabled={processing || finalValue < 10 || finalValue > 1000}
            className="w-full h-13 bg-red-600 hover:bg-red-500 text-white font-bold text-base rounded-xl disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
          >
            {processing ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Gerando PIX...</>
            ) : (
              <>Pagar R$ {finalValue > 0 ? finalValue.toFixed(2).replace(".", ",") : "0,00"} via PIX <ChevronRight className="ml-1 h-5 w-5" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
