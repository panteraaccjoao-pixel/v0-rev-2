"use client"

import { useState, useEffect } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search, Monitor, Smartphone, Globe, Trash2, RefreshCw,
  CheckCircle, XCircle, MessageCircle, AlertTriangle, ShieldAlert
} from "lucide-react"

interface LoginRecord {
  id: string
  email: string
  name: string
  ip: string
  device: string
  deviceType: "desktop" | "mobile"
  browser: string
  os: string
  date: string
  success: boolean
  discordId?: string
}

interface SuspiciousIP {
  ip: string
  count: number
  emails: string[]
  lastSeen: string
}

interface Stats {
  totalToday: number
  totalAll: number
  desktopPercent: number
  mobilePercent: number
  failedToday: number
  suspiciousCount: number
}

export default function LoginsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all")
  const [logins, setLogins] = useState<LoginRecord[]>([])
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([])
  const [stats, setStats] = useState<Stats>({ totalToday: 0, totalAll: 0, desktopPercent: 0, mobilePercent: 0, failedToday: 0, suspiciousCount: 0 })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchLogins = async () => {
    try {
      const res = await adminFetch(`/api/admin/logins?search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setLogins(data.logins)
        setStats(data.stats)
        setSuspiciousIPs(data.suspiciousIPs || [])
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
    const interval = setInterval(fetchLogins, 5000)
    return () => clearInterval(interval)
  }, [search])

  const handleClearAll = async () => {
    if (!confirm("Tem certeza que deseja limpar todo o histórico de logins?")) return
    try {
      const res = await adminFetch("/api/admin/logins", { method: "DELETE" })
      if (res.ok) {
        setLogins([])
        setSuspiciousIPs([])
        setStats({ totalToday: 0, totalAll: 0, desktopPercent: 0, mobilePercent: 0, failedToday: 0, suspiciousCount: 0 })
      }
    } catch (error) {
      console.error("Error clearing logins:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    })
  }

  const filtered = logins.filter(l => {
    if (filter === "success") return l.success
    if (filter === "failed") return !l.success
    return true
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logins</h1>
          <p className="text-muted-foreground">Histórico de acessos em tempo real</p>
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
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Logins Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAll}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Falhas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.failedToday}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IPs Suspeitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-yellow-500" />
              <div className="text-2xl font-bold text-yellow-500">{stats.suspiciousCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Desktop</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Mobile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.mobilePercent}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de IPs Suspeitos */}
      {suspiciousIPs.length > 0 && (
        <Card className="bg-yellow-950/20 border-yellow-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Atividade Suspeita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suspiciousIPs.map((item) => (
                <div key={item.ip} className="flex items-start justify-between rounded-lg bg-yellow-950/30 border border-yellow-800/30 p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-yellow-500" />
                      <span className="font-mono text-sm font-bold text-yellow-400">{item.ip}</span>
                      <Badge variant="destructive" className="text-xs">{item.count} tentativas falhas</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Emails tentados: {item.emails.join(", ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Última tentativa: {formatDate(item.lastSeen)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, nome ou IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "success", "failed"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="border-border"
            >
              {f === "all" ? "Todos" : f === "success" ? "✓ Sucesso" : "✗ Falhas"}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={fetchLogins} className="border-border">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={handleClearAll}>
          <Trash2 className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      {/* Logins Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Logins</span>
            <span className="text-sm font-normal text-muted-foreground">
              {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
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
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">IP</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Dispositivo</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Browser / OS</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Discord</th>
                    <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((login) => (
                    <tr
                      key={login.id}
                      className={`border-b border-border last:border-0 ${!login.success ? "bg-red-950/10" : ""}`}
                    >
                      <td className="py-4">
                        {login.success ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="text-xs text-red-400">Falha</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-sm font-medium">{login.name}</td>
                      <td className="py-4 text-sm text-muted-foreground">{login.email}</td>
                      <td className="py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{login.ip}</span>
                          {suspiciousIPs.some(s => s.ip === login.ip) && (
                            <AlertTriangle className="h-3 w-3 text-yellow-500" title="IP suspeito" />
                          )}
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
                      <td className="py-4 text-sm text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span>{login.browser}</span>
                          <span className="text-xs opacity-60">{login.os}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm">
                        {login.discordId ? (
                          <div className="flex items-center gap-2 text-[#5865F2]">
                            <MessageCircle className="h-4 w-4" />
                            <span className="font-mono text-xs">{login.discordId}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
