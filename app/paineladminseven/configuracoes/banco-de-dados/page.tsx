"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff, Database, CheckCircle2, XCircle, Loader2 } from "lucide-react"

const databases = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "sqlite", label: "SQLite" },
]

export default function BancoDeDadosPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [config, setConfig] = useState({
    type: "postgresql",
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: "",
    ssl: true,
    connectionString: "",
    useConnectionString: false,
  })

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch("/api/admin/test-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      
      if (res.ok) {
        setTestResult("success")
      } else {
        setTestResult("error")
      }
    } catch {
      setTestResult("error")
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "database", config }),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Banco de Dados</h1>
        <p className="text-muted-foreground">Configure a conexao com seu banco de dados</p>
      </div>

      <div className="max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Database className="h-6 w-6 text-accent" />
          <div>
            <h2 className="font-semibold">Configuracao do Banco</h2>
            <p className="text-sm text-muted-foreground">Conecte seu banco de dados para armazenar os dados do sistema</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Banco</Label>
            <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value })}>
              <SelectTrigger className="h-12 bg-secondary border-border">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db) => (
                  <SelectItem key={db.value} value={db.value}>
                    {db.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useConnectionString"
              checked={config.useConnectionString}
              onChange={(e) => setConfig({ ...config, useConnectionString: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="useConnectionString" className="text-sm cursor-pointer">
              Usar Connection String
            </Label>
          </div>

          {config.useConnectionString ? (
            <div className="space-y-2">
              <Label htmlFor="connectionString">Connection String</Label>
              <Input
                id="connectionString"
                type="password"
                placeholder="postgresql://user:password@host:5432/database"
                value={config.connectionString}
                onChange={(e) => setConfig({ ...config, connectionString: e.target.value })}
                className="h-12 bg-secondary border-border font-mono text-sm"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    placeholder="localhost"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                    className="h-12 bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Porta</Label>
                  <Input
                    id="port"
                    placeholder="5432"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: e.target.value })}
                    className="h-12 bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="database">Nome do Banco</Label>
                <Input
                  id="database"
                  placeholder="revsystem"
                  value={config.database}
                  onChange={(e) => setConfig({ ...config, database: e.target.value })}
                  className="h-12 bg-secondary border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    placeholder="postgres"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    className="h-12 bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={config.password}
                      onChange={(e) => setConfig({ ...config, password: e.target.value })}
                      className="h-12 bg-secondary border-border pr-12"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 pointer-events-none" /> : <Eye className="h-5 w-5 pointer-events-none" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={config.ssl}
                  onChange={(e) => setConfig({ ...config, ssl: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="ssl" className="text-sm cursor-pointer">
                  Usar SSL
                </Label>
              </div>
            </>
          )}
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 rounded-lg p-3 ${
            testResult === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          }`}>
            {testResult === "success" ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>Conexao estabelecida com sucesso!</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span>Falha na conexao. Verifique as credenciais.</span>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              "Testar Conexao"
            )}
          </Button>
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
              "Salvar Configuracoes"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
