"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, KeyRound, CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function SenhaPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSave = async () => {
    setMessage(null)

    if (!form.email || !form.currentPassword || !form.newPassword) {
      setMessage({ type: "error", text: "Preencha todos os campos" })
      return
    }
    if (form.newPassword.length < 6) {
      setMessage({ type: "error", text: "A nova senha deve ter no minimo 6 caracteres" })
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "As senhas nao coincidem" })
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Senha alterada com sucesso!" })
        setForm({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMessage({ type: "error", text: data.message || "Erro ao alterar senha" })
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setMessage({ type: "error", text: "Erro ao alterar senha" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Senha do Admin</h1>
        <p className="text-muted-foreground">Altere a senha de acesso ao painel administrativo</p>
      </div>

      <div className="max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <KeyRound className="h-6 w-6 text-accent" />
          <div>
            <h2 className="font-semibold">Alterar Senha</h2>
            <p className="text-sm text-muted-foreground">Confirme sua senha atual para definir uma nova</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Admin</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@revsystem.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-12 bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                placeholder="Digite sua senha atual"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="h-12 bg-secondary border-border pr-12"
              />
              <button
                type="button"
                aria-label={showCurrent ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-5 w-5 pointer-events-none" /> : <Eye className="h-5 w-5 pointer-events-none" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="Minimo 6 caracteres"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="h-12 bg-secondary border-border pr-12"
              />
              <button
                type="button"
                aria-label={showNew ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowNew(!showNew)}
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-5 w-5 pointer-events-none" /> : <Eye className="h-5 w-5 pointer-events-none" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Repita a nova senha"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="h-12 bg-secondary border-border pr-12"
              />
              <button
                type="button"
                aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-5 w-5 pointer-events-none" /> : <Eye className="h-5 w-5 pointer-events-none" />}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg p-3 ${
              message.type === "error" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
            }`}
          >
            {message.type === "error" ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Alterar Senha"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
