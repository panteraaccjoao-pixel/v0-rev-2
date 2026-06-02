"use client"

import { useState } from "react"
import { CreditCard, Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ComprarCartoesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [nivel, setNivel] = useState("Nível")
  const [bandeira, setBandeira] = useState("Bandeira")

  const cartoes: never[] = [] // Empty array to show empty state

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comprar Cartões</h1>
        <p className="text-sm text-muted-foreground">
          Escolha um cartão e visualize os detalhes antes de comprar
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
        {/* Available count */}
        <div className="flex items-center gap-3 border-r border-border pr-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
            <CreditCard className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Disponíveis</p>
            <p className="text-lg font-bold text-foreground">{cartoes.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar BIN, banco, nivel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 border-0 bg-transparent pl-10 focus-visible:ring-0"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                {nivel}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setNivel("Nível")}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setNivel("Standard")}>Standard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setNivel("Gold")}>Gold</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setNivel("Platinum")}>Platinum</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setNivel("Black")}>Black</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setNivel("Infinite")}>Infinite</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                {bandeira}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setBandeira("Bandeira")}>Todas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBandeira("Visa")}>Visa</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBandeira("Mastercard")}>Mastercard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBandeira("Elo")}>Elo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBandeira("Amex")}>Amex</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex min-h-[500px] items-center justify-center rounded-lg border border-border bg-gradient-to-b from-secondary/30 to-secondary/10">
        {cartoes.length === 0 ? (
          <div className="flex flex-col items-center gap-6 p-8 text-center">
            {/* Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/20">
              <CreditCard className="h-10 w-10 text-accent" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Estamos sem estoque no momento
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Em breve iremos colocar novas infos. Entre no Discord ou Telegram
                para ser avisado quando sair reposição e anúncios.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                className="gap-2 bg-[#5865F2] hover:bg-[#4752C4]"
                asChild
              >
                <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Entrar no Discord
                </a>
              </Button>
              <Button 
                className="gap-2 bg-[#0088cc] hover:bg-[#006699]"
                asChild
              >
                <a href="https://t.me/" target="_blank" rel="noopener noreferrer">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Entrar no Telegram
                </a>
              </Button>
            </div>

            {/* Footer text */}
            <p className="text-xs uppercase tracking-widest text-muted-foreground/50">
              Reposições serão avisadas primeiro nos grupos
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Cards would be rendered here when available */}
          </div>
        )}
      </div>
    </div>
  )
}
