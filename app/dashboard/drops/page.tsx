"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Zap, CreditCard, Users, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Drop {
  id: string
  produto: string
  nivel: string
  bandeira: string
  preco: number
  quantidade: number
  criadoEm: string
}

export default function DropsPage() {
  const router = useRouter()
  const [drops, setDrops] = useState<Drop[]>([])
  const [usersOnline, setUsersOnline] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch drops in real-time (polling every 3 seconds)
  useEffect(() => {
    const fetchDrops = async () => {
      try {
        const res = await fetch("/api/drops")
        if (res.ok) {
          const data = await res.json()
          setDrops(data.drops || [])
          setUsersOnline(data.usersOnline || 1)
        }
      } catch (error) {
        console.error("Erro ao buscar drops:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchDrops()

    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchDrops, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleBuyDrop = async (dropId: string) => {
    try {
      const session = localStorage.getItem("user_session")
      if (!session) {
        router.push("/login")
        return
      }

      const res = await fetch("/api/drops/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dropId }),
      })

      if (res.ok) {
        // Refresh drops after purchase
        const dropsRes = await fetch("/api/drops")
        if (dropsRes.ok) {
          const data = await dropsRes.json()
          setDrops(data.drops || [])
        }
      }
    } catch (error) {
      console.error("Erro ao comprar drop:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            {/* Live indicator */}
            <div className="mb-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-green-500">
                Ao Vivo
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Drops</h1>
          </div>

          {/* Users online */}
          <div className="flex items-center gap-2 rounded-full bg-secondary/50 px-3 py-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{usersOnline}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : drops.length === 0 ? (
        /* Empty state */
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/50">
            <Zap className="h-10 w-10 text-muted-foreground" />
          </div>
          
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Sem drops no momento
          </h2>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Fique ligado — os drops aparecem aqui em tempo real.
          </p>

          <Button
            variant="secondary"
            onClick={() => router.push("/dashboard/comprar")}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Ver cards disponíveis
          </Button>
        </div>
      ) : (
        /* Drops list */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drops.map((drop) => (
            <div
              key={drop.id}
              className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-accent"
            >
              {/* New badge */}
              <div className="absolute right-3 top-3">
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-500">
                  NOVO
                </span>
              </div>

              <div className="mb-4">
                <div className="mb-1 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent" />
                  <span className="font-semibold text-foreground">{drop.produto}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{drop.bandeira}</span>
                  <span>•</span>
                  <span>{drop.nivel}</span>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-accent">
                    R$ {drop.preco.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {drop.quantidade} disponível{drop.quantidade > 1 ? "is" : ""}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => handleBuyDrop(drop.id)}
                className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Eye className="h-4 w-4" />
                Comprar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
