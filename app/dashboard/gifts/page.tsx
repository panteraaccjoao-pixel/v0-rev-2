"use client"

import { useState } from "react"
import { Gift, Check, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authFetch } from "@/lib/session"

export default function GiftsPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; value?: number; balance?: number; message?: string } | null>(null)

  const handleRedeem = async () => {
    if (!code.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await authFetch("/api/gifts/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })
      const data = await res.json()
      setResult(data)
      if (data.success) setCode("")
    } catch {
      setResult({ success: false, message: "Erro de conexão. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-[0_0_24px_6px_rgba(239,68,68,0.35)]">
            <Gift className="h-7 w-7 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Resgatar Gift</h1>
        <p className="text-sm text-zinc-400">Insira o código do gift para adicionar saldo à sua conta</p>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Código do Gift</label>
          <Input
            placeholder="GIFT-XXXXXX"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null) }}
            onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 font-mono text-center text-lg h-12 tracking-widest"
            maxLength={11}
          />
        </div>

        <Button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-bold disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</>
          ) : (
            <><Gift className="mr-2 h-4 w-4" />Resgatar Gift</>
          )}
        </Button>

        {/* Resultado */}
        {result && (
          <div className={`rounded-xl border p-4 text-center space-y-2 ${
            result.success
              ? "border-emerald-500/30 bg-emerald-950/30"
              : "border-red-500/30 bg-red-950/20"
          }`}>
            {result.success ? (
              <>
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                    <Check className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
                <p className="font-bold text-emerald-400 text-lg">Gift Resgatado!</p>
                <p className="text-sm text-zinc-300">
                  <span className="text-emerald-400 font-bold">+R$ {result.value?.toFixed(2).replace(".", ",")}</span> adicionado ao seu saldo
                </p>
                <p className="text-xs text-zinc-500">
                  Novo saldo: <span className="text-white font-medium">R$ {result.balance?.toFixed(2).replace(".", ",")}</span>
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                </div>
                <p className="text-sm text-red-400">{result.message}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Sparkles className="h-4 w-4 text-red-400" />
          Como funciona
        </div>
        <ul className="space-y-1.5 text-sm text-zinc-400">
          <li>• Receba um código gift de um administrador ou promoção</li>
          <li>• Digite o código no campo acima e clique em Resgatar</li>
          <li>• O saldo é creditado instantaneamente na sua conta</li>
          <li>• Cada código pode ser usado apenas uma vez</li>
        </ul>
      </div>
    </div>
  )
}
