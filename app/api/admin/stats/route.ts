import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// In-memory store for demo (use your database in production)
let statsData = {
  faturamento: 0,
  saques: 0,
  vendas: 0,
  ticketMedio: 0,
  usuariosCadastrados: 0,
  recargasPendentes: 0,
  estoqueTotal: 0,
  dailyData: [] as { date: string; faturamento: number; vendas: number }[],
  recentSales: [] as { id: string; user: string; product: string; value: number; date: string }[],
  lastUpdated: new Date().toISOString()
}

export async function GET() {
  try {
    // In production, fetch from your database using the stored config
    const cookieStore = await cookies()
    const dbConfig = cookieStore.get("rev_db_config")?.value
    
    if (dbConfig) {
      // Here you would connect to the user's database and fetch real data
      // const config = JSON.parse(dbConfig)
      // const data = await fetchFromDatabase(config)
    }

    // Fetch real-time data from other APIs
    try {
      const [usersRes, rechargesRes, estoqueRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users`),
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/recargas`),
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/estoque`)
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        statsData.usuariosCadastrados = usersData.total || 0
      }

      if (rechargesRes.ok) {
        const rechargesData = await rechargesRes.json()
        statsData.recargasPendentes = rechargesData.pendingCount || 0
      }

      if (estoqueRes.ok) {
        const estoqueData = await estoqueRes.json()
        statsData.estoqueTotal = estoqueData.total || 0
      }
    } catch (e) {
      // Ignore fetch errors for real-time data
    }
    
    // Calculate ticket medio
    if (statsData.vendas > 0) {
      statsData.ticketMedio = statsData.faturamento / statsData.vendas
    }
    
    return NextResponse.json(statsData)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json()
    
    switch (action) {
      case "add_sale":
        statsData.faturamento += data.value
        statsData.vendas += 1
        statsData.ticketMedio = statsData.faturamento / statsData.vendas
        
        // Add to daily data
        const today = new Date().toISOString().split("T")[0]
        const todayIndex = statsData.dailyData.findIndex(d => d.date === today)
        if (todayIndex >= 0) {
          statsData.dailyData[todayIndex].faturamento += data.value
          statsData.dailyData[todayIndex].vendas += 1
        } else {
          statsData.dailyData.push({ date: today, faturamento: data.value, vendas: 1 })
        }
        
        // Add to recent sales
        statsData.recentSales.unshift({
          id: `sale_${Date.now()}`,
          user: data.user || "Anônimo",
          product: data.product || "Produto",
          value: data.value,
          date: new Date().toISOString()
        })
        statsData.recentSales = statsData.recentSales.slice(0, 10) // Keep last 10
        break
        
      case "add_withdrawal":
        statsData.saques += data.value
        break
        
      case "reset":
        statsData = {
          faturamento: 0,
          saques: 0,
          vendas: 0,
          ticketMedio: 0,
          usuariosCadastrados: 0,
          recargasPendentes: 0,
          estoqueTotal: 0,
          dailyData: [],
          recentSales: [],
          lastUpdated: new Date().toISOString()
        }
        break
        
      case "sync_from_webhook":
        // Called when webhook receives payment
        statsData.faturamento += data.amount
        statsData.vendas += 1
        statsData.ticketMedio = statsData.faturamento / statsData.vendas
        
        const webhookDate = new Date().toISOString().split("T")[0]
        const webhookIndex = statsData.dailyData.findIndex(d => d.date === webhookDate)
        if (webhookIndex >= 0) {
          statsData.dailyData[webhookIndex].faturamento += data.amount
          statsData.dailyData[webhookIndex].vendas += 1
        } else {
          statsData.dailyData.push({ date: webhookDate, faturamento: data.amount, vendas: 1 })
        }
        break
    }
    
    statsData.lastUpdated = new Date().toISOString()
    
    return NextResponse.json({ success: true, stats: statsData })
  } catch (error) {
    console.error("Error updating stats:", error)
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 })
  }
}
