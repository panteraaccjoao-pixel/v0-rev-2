"use client"

import { useState, useEffect, useCallback } from "react"
import { adminFetch } from "@/lib/admin-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  RefreshCw,
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Recharge {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  method: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  approvedAt?: string
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return null
  }
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-500/10 text-green-500"
    case "pending":
      return "bg-yellow-500/10 text-yellow-500"
    case "rejected":
      return "bg-red-500/10 text-red-500"
    default:
      return ""
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "approved":
      return "Aprovado"
    case "pending":
      return "Pendente"
    case "rejected":
      return "Rejeitado"
    default:
      return status
  }
}

export default function RecargasPage() {
  const [search, setSearch] = useState("")
  const [recharges, setRecharges] = useState<Recharge[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [approvedTotal, setApprovedTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchRecharges = useCallback(async () => {
    try {
      const res = await adminFetch("/api/recargas")
      if (res.ok) {
        const data = await res.json()
        setRecharges(data.recharges || [])
        setPendingCount(data.pendingCount || 0)
        setApprovedTotal(data.approvedTotal || 0)
      }
    } catch (error) {
      console.error("Error fetching recharges:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecharges()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchRecharges, 3000)
    return () => clearInterval(interval)
  }, [fetchRecharges])

  const handleApprove = async (rechargeId: string) => {
    try {
      const res = await adminFetch("/api/recargas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", rechargeId })
      })
      if (res.ok) fetchRecharges()
    } catch (error) {
      console.error("Error approving recharge:", error)
    }
  }

  const handleReject = async (rechargeId: string) => {
    try {
      const res = await adminFetch("/api/recargas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rechargeId })
      })
      if (res.ok) fetchRecharges()
    } catch (error) {
      console.error("Error rejecting recharge:", error)
    }
  }

  const filteredRecharges = recharges.filter(
    (recharge) => 
      recharge.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      recharge.userName.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR")
  }

  const totalPending = recharges
    .filter(r => r.status === "pending")
    .reduce((acc, r) => acc + r.amount, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recargas</h1>
          <p className="text-muted-foreground">
            Histórico de recargas feitas pelos clientes
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRecharges}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Aprovado
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500 ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(approvedTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Pendente de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">{pendingCount} solicitações</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total de Recargas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recharges.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por email ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Recargas Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filteredRecharges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma recarga encontrada</h3>
          <p className="text-sm text-muted-foreground">As recargas aparecem aqui em tempo real</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecharges.map((recharge) => (
                <TableRow key={recharge.id} className="border-border">
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    #{recharge.id.split("_")[1]?.substring(0, 8) || recharge.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{recharge.userName}</p>
                      <p className="text-sm text-muted-foreground">{recharge.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-accent">
                    {formatCurrency(recharge.amount)}
                  </TableCell>
                  <TableCell className="uppercase text-sm">{recharge.method}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(recharge.status)}`}
                    >
                      {getStatusIcon(recharge.status)}
                      {getStatusLabel(recharge.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(recharge.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {recharge.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          onClick={() => handleApprove(recharge.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleReject(recharge.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                    {recharge.status === "approved" && (
                      <span className="text-xs text-muted-foreground">
                        Aprovado em {recharge.approvedAt ? formatDate(recharge.approvedAt) : "-"}
                      </span>
                    )}
                    {recharge.status === "rejected" && (
                      <span className="text-xs text-red-500">Rejeitado</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
