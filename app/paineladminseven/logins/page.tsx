"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Monitor, Smartphone, Globe } from "lucide-react"

// Dados de exemplo
const logins = [
  { 
    id: 1, 
    user: "joao@email.com", 
    name: "João Silva",
    password: "******",
    ip: "189.45.123.67",
    device: "Chrome - Windows",
    deviceType: "desktop",
    date: "14/01/2024 15:30"
  },
  { 
    id: 2, 
    user: "maria@email.com", 
    name: "Maria Santos",
    password: "******",
    ip: "201.78.45.123",
    device: "Safari - iPhone",
    deviceType: "mobile",
    date: "14/01/2024 14:20"
  },
  { 
    id: 3, 
    user: "pedro@email.com", 
    name: "Pedro Costa",
    password: "******",
    ip: "177.92.156.89",
    device: "Firefox - MacOS",
    deviceType: "desktop",
    date: "14/01/2024 13:15"
  },
  { 
    id: 4, 
    user: "ana@email.com", 
    name: "Ana Oliveira",
    password: "******",
    ip: "200.18.45.67",
    device: "Chrome - Android",
    deviceType: "mobile",
    date: "14/01/2024 12:00"
  },
  { 
    id: 5, 
    user: "lucas@email.com", 
    name: "Lucas Pereira",
    password: "******",
    ip: "189.112.78.234",
    device: "Edge - Windows",
    deviceType: "desktop",
    date: "14/01/2024 11:30"
  },
  { 
    id: 6, 
    user: "carla@email.com", 
    name: "Carla Mendes",
    password: "******",
    ip: "177.45.89.156",
    device: "Chrome - Linux",
    deviceType: "desktop",
    date: "13/01/2024 18:45"
  },
  { 
    id: 7, 
    user: "rafael@email.com", 
    name: "Rafael Lima",
    password: "******",
    ip: "201.56.123.78",
    device: "Safari - iPad",
    deviceType: "mobile",
    date: "13/01/2024 17:30"
  },
]

export default function LoginsPage() {
  const [search, setSearch] = useState("")

  const filteredLogins = logins.filter(
    (login) =>
      login.user.toLowerCase().includes(search.toLowerCase()) ||
      login.name.toLowerCase().includes(search.toLowerCase()) ||
      login.ip.includes(search)
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logins</h1>
        <p className="text-muted-foreground">
          Histórico de logins realizados no site
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Logins Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
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
              <div className="text-2xl font-bold">68%</div>
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
              <div className="text-2xl font-bold">32%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
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
      </div>

      {/* Logins Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Histórico de Logins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Usuário</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Senha</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">IP</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Dispositivo</th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogins.map((login) => (
                  <tr key={login.id} className="border-b border-border last:border-0">
                    <td className="py-4 text-sm font-medium">{login.name}</td>
                    <td className="py-4 text-sm text-muted-foreground">{login.user}</td>
                    <td className="py-4 text-sm font-mono text-muted-foreground">{login.password}</td>
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
                    <td className="py-4 text-sm text-muted-foreground">{login.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
