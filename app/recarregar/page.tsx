"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, QrCode, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const presetValues = [10, 25, 50, 100, 200, 500]

export default function RecargaPage() {
  const [totalValue, setTotalValue] = useState(0)
  const [customValue, setCustomValue] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText("00020126580014br.gov.bcb.pix0136exemplo-pix-key")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddValue = (value: number) => {
    setTotalValue((prev) => prev + value)
    setCustomValue("")
  }

  const handleClearValue = () => {
    setTotalValue(0)
    setCustomValue("")
  }

  const finalValue = totalValue || (customValue ? parseFloat(customValue) : 0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Back button */}
      <div className="p-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Recarregar saldo
            </h1>
            <p className="mt-2 text-muted-foreground">
              Selecione um valor ou digite um valor personalizado
            </p>
          </div>

          {/* Current balance */}
          <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Saldo atual</p>
            <p className="text-2xl font-bold text-foreground">R$ 0,00</p>
          </div>

          {/* Preset values */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Valores sugeridos</Label>
              {totalValue > 0 && (
                <button
                  onClick={handleClearValue}
                  className="text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {presetValues.map((value) => (
                <button
                  key={value}
                  onClick={() => handleAddValue(value)}
                  className="rounded-lg border border-border bg-secondary p-4 text-center transition-all hover:border-accent hover:bg-accent/10"
                >
                  <span className="text-lg font-semibold">R$ {value}</span>
                </button>
              ))}
            </div>
            {totalValue > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Clique novamente para adicionar mais ao valor
              </p>
            )}
          </div>

          {/* Custom value */}
          <div className="space-y-2">
            <Label htmlFor="custom-value">Ou digite um valor personalizado</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="custom-value"
                type="number"
                placeholder="0,00"
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value)
                  setTotalValue(0)
                }}
                className="h-12 bg-secondary border-border pl-12"
                min="5"
              />
            </div>
            <p className="text-sm text-muted-foreground">Valor mínimo: R$ 5,00</p>
          </div>

          {/* Payment method */}
          <div className="space-y-3">
            <Label>Método de pagamento</Label>
            <div className="rounded-lg border border-accent bg-accent/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                  <QrCode className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">PIX</p>
                  <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {finalValue > 0 && (
            <div className="space-y-3 rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valor da recarga</span>
                <span className="font-medium text-foreground">
                  R$ {finalValue.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Taxa</span>
                <span className="font-medium text-accent">Grátis</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">
                    R$ {finalValue.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Generate PIX button */}
          <Button 
            className="h-12 w-full" 
            disabled={finalValue < 5}
          >
            Gerar código PIX
          </Button>

          {/* Info */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <h3 className="font-medium text-foreground">Como funciona?</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>1. Selecione ou digite o valor desejado</li>
              <li>2. Clique em &quot;Gerar código PIX&quot;</li>
              <li>3. Copie o código ou escaneie o QR Code</li>
              <li>4. O saldo é creditado automaticamente</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
