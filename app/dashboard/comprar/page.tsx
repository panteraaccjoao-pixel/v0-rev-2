"use client"

import { useState, useEffect, useCallback } from "react"
import { CreditCard, Search, ChevronDown, ShoppingCart, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProductGroup {
  level: string
  brand: string
  price: number
  count: number
  products: { id: string }[]
}

interface PurchasedCard {
  fullCard: string
  cvv: string
  expiry: string
  bin: string
  bank: string
  level: string
  brand: string
  price: number
  holderName?: string
  cpf?: string
  birthDate?: string
}

export default function ComprarCartoesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [nivel, setNivel] = useState("Nível")
  const [bandeira, setBandeira] = useState("Bandeira")
  const [products, setProducts] = useState<ProductGroup[]>([])
  const [totalStock, setTotalStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<ProductGroup | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [purchasedCard, setPurchasedCard] = useState<PurchasedCard | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (nivel !== "Nível") params.append("level", nivel)
      if (bandeira !== "Bandeira") params.append("brand", bandeira)
      if (searchTerm) params.append("search", searchTerm)

      const res = await fetch(`/api/estoque?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.grouped || [])
        setTotalStock(data.total || 0)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }, [nivel, bandeira, searchTerm])

  useEffect(() => {
    fetchProducts()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchProducts, 5000)
    return () => clearInterval(interval)
  }, [fetchProducts])

  const handlePurchase = async () => {
    if (!selectedProduct || !selectedProduct.products?.length) return
    
    setPurchasing(true)
    try {
      // Get the first available card from this product group
      const cardId = selectedProduct.products[0].id
      
      const res = await fetch("/api/estoque", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId, action: "purchase" })
      })

      if (res.ok) {
        const data = await res.json()
        setPurchasedCard(data.card)
        setPurchaseSuccess(true)
        
        // Refresh products
        fetchProducts()
      } else {
        const error = await res.json()
        alert(error.error || "Erro ao processar compra")
      }
    } catch (error) {
      console.error("Error purchasing:", error)
      alert("Erro ao processar compra")
    } finally {
      setPurchasing(false)
    }
  }

  const handleCloseDialog = () => {
    setSelectedProduct(null)
    setPurchaseSuccess(false)
    setPurchasedCard(null)
  }

  const getBrandLogo = (brand: string) => {
    if (brand === "mastercard") {
      return (
        <div className="flex">
          <div className="h-8 w-8 rounded-full bg-red-500 -mr-3"></div>
          <div className="h-8 w-8 rounded-full bg-orange-400"></div>
        </div>
      )
    }
    if (brand === "elo") {
      return (
        <div className="text-sm font-bold text-yellow-500 bg-black px-3 py-1 rounded">
          ELO
        </div>
      )
    }
    if (brand === "amex") {
      return (
        <div className="text-xs font-bold text-blue-400 bg-white px-2 py-1 rounded">
          AMEX
        </div>
      )
    }
    return (
      <div className="text-sm font-bold text-blue-500 bg-white px-3 py-1 rounded">
        VISA
      </div>
    )
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "gold": return "text-yellow-500"
      case "platinum": return "text-gray-400"
      case "black": return "text-gray-200"
      case "infinite": return "text-purple-400"
      default: return "text-green-500"
    }
  }

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
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground">{totalStock}</p>
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" title="Ao vivo" />
            </div>
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
      <div className="min-h-[500px] rounded-lg border border-border bg-gradient-to-b from-secondary/30 to-secondary/10">
        {loading ? (
          <div className="flex h-[500px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-[500px] flex-col items-center justify-center gap-6 p-8 text-center">
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
                Em breve iremos colocar novas infos. Entre no Discord para ser avisado quando sair reposição e anúncios.
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
            </div>
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <div 
                key={`${product.level}-${product.brand}-${index}`}
                className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10"
                onClick={() => setSelectedProduct(product)}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`text-lg font-bold ${getLevelColor(product.level)}`}>
                      {product.level}
                    </p>
                    <p className="text-xs text-muted-foreground">CREDIT</p>
                  </div>
                  {getBrandLogo(product.brand)}
                </div>

                {/* Card Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Disponíveis</span>
                    <span className="font-medium text-foreground">{product.count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bandeira</span>
                    <span className="font-medium capitalize text-foreground">{product.brand}</span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">VALOR</p>
                    <p className="text-xl font-bold text-accent">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <Button size="sm" className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ShoppingCart className="h-4 w-4" />
                    Comprar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {purchaseSuccess ? "Compra Realizada!" : "Confirmar Compra"}
            </DialogTitle>
            <DialogDescription>
              {purchaseSuccess 
                ? "Aqui estão os dados do seu cartão" 
                : "Revise os detalhes antes de confirmar"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 py-4">
              {purchaseSuccess && purchasedCard ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mb-4">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  
                  {/* Card Data */}
                  <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Número</span>
                      <span className="font-mono font-medium">{purchasedCard.fullCard || "****"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Validade</span>
                      <span className="font-mono font-medium">{purchasedCard.expiry || "**/**"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">CVV</span>
                      <span className="font-mono font-medium">{purchasedCard.cvv || "***"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Banco</span>
                      <span className="font-medium">{purchasedCard.bank || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nível</span>
                      <span className={`font-medium ${getLevelColor(purchasedCard.level)}`}>
                        {purchasedCard.level}
                      </span>
                    </div>
                  </div>

                  {/* Holder Data */}
                  {(purchasedCard.holderName || purchasedCard.cpf || purchasedCard.birthDate) && (
                    <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados do Titular</p>
                      {purchasedCard.holderName && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Nome</span>
                          <span className="font-medium">{purchasedCard.holderName}</span>
                        </div>
                      )}
                      {purchasedCard.cpf && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">CPF</span>
                          <span className="font-mono font-medium">{purchasedCard.cpf}</span>
                        </div>
                      )}
                      {purchasedCard.birthDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Nascimento</span>
                          <span className="font-mono font-medium">{purchasedCard.birthDate}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    Guarde essas informações em local seguro. O cartão foi adicionado aos seus pedidos.
                  </p>
                  
                  <Button className="w-full" onClick={handleCloseDialog}>
                    Fechar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-bold ${getLevelColor(selectedProduct.level)}`}>
                        {selectedProduct.level}
                      </span>
                      {getBrandLogo(selectedProduct.brand)}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedProduct.brand} - Credit
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Disponíveis</span>
                      <span>{selectedProduct.count} unidades</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preço unitário</span>
                      <span className="font-bold text-accent">
                        R$ {selectedProduct.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Confirmar Compra - R$ {selectedProduct.price.toFixed(2).replace('.', ',')}
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
