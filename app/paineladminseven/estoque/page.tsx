"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  CreditCard,
  RefreshCw
} from "lucide-react"
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
  DialogTrigger,
} from "@/components/ui/dialog"

interface Product {
  id: string
  bin: string
  fullCard: string
  expiry: string
  cvv: string
  bank: string
  type: string
  level: string
  price: number
  brand: string
  createdAt: string
  holderName: string
  cpf: string
  birthDate: string
}

interface ProductGroup {
  level: string
  brand: string
  price: number
  count: number
  products: Product[]
}

const getBrandLogo = (brand: string) => {
  if (brand === "mastercard") {
    return (
      <div className="flex">
        <div className="h-6 w-6 rounded-full bg-red-500 -mr-2"></div>
        <div className="h-6 w-6 rounded-full bg-orange-400"></div>
      </div>
    )
  }
  if (brand === "elo") {
    return (
      <div className="text-xs font-bold text-yellow-500 bg-black px-2 py-1 rounded">
        ELO
      </div>
    )
  }
  return (
    <div className="text-xs font-bold text-blue-500 bg-white px-2 py-1 rounded">
      VISA
    </div>
  )
}

export default function EstoquePage() {
  const [search, setSearch] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [grouped, setGrouped] = useState<ProductGroup[]>([])
  const [totalStock, setTotalStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [quickInput, setQuickInput] = useState("")
  const [newProduct, setNewProduct] = useState({
    bin: "",
    bank: "",
    type: "CREDIT",
    level: "",
    price: "",
    fullCard: "",
    expiry: "",
    cvv: "",
    brand: "mastercard",
    holderName: "",
    cpf: "",
    birthDate: ""
  })

  // Parse quick input format: CARD|MM|YYYY|CVV|NOME:XXX|CPF:XXX|NASC:XX/XX/XXXX
  const parseQuickInput = (input: string) => {
    const parts = input.split("|")
    if (parts.length < 4) return
    
    const fullCard = parts[0]?.trim() || ""
    const month = parts[1]?.trim() || ""
    const year = parts[2]?.trim() || ""
    const cvv = parts[3]?.trim() || ""
    
    // Parse additional data (NOME:, CPF:, NASC:)
    let holderName = ""
    let cpf = ""
    let birthDate = ""
    
    for (let i = 4; i < parts.length; i++) {
      const part = parts[i]?.trim() || ""
      if (part.toUpperCase().startsWith("NOME:")) {
        holderName = part.substring(5).trim()
      } else if (part.toUpperCase().startsWith("CPF:")) {
        cpf = part.substring(4).trim()
      } else if (part.toUpperCase().startsWith("NASC:")) {
        birthDate = part.substring(5).trim()
      }
    }
    
    // Format expiry as MM/YY or MM/YYYY
    const expiry = year.length === 4 ? `${month}/${year.substring(2)}` : `${month}/${year}`
    
    // Detect brand from BIN
    const bin = fullCard.substring(0, 6)
    let brand = "visa"
    if (bin.startsWith("4")) brand = "visa"
    else if (bin.startsWith("5") || bin.startsWith("2")) brand = "mastercard"
    else if (bin.startsWith("6")) brand = "elo"
    else if (bin.startsWith("3")) brand = "amex"
    
    setNewProduct({
      ...newProduct,
      fullCard,
      bin,
      expiry,
      cvv,
      holderName,
      cpf,
      birthDate,
      brand
    })
    
    setQuickInput("")
  }

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/estoque${search ? `?search=${search}` : ""}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setGrouped(data.grouped || [])
        setTotalStock(data.total || 0)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchProducts()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchProducts, 3000)
    return () => clearInterval(interval)
  }, [fetchProducts])

  const handleAddProduct = async () => {
    setAdding(true)
    try {
      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct)
      })

      if (res.ok) {
        setIsAddDialogOpen(false)
        setQuickInput("")
        setNewProduct({
          bin: "",
          bank: "",
          type: "CREDIT",
          level: "",
          price: "",
          fullCard: "",
          expiry: "",
          cvv: "",
          brand: "mastercard",
          holderName: "",
          cpf: "",
          birthDate: ""
        })
        fetchProducts()
      }
    } catch (error) {
      console.error("Error adding product:", error)
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/estoque?id=${id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const totalValue = products.reduce((acc, p) => acc + p.price, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">
            Gerencie os cartões disponíveis para venda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchProducts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cartão
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cartão</DialogTitle>
                <DialogDescription>
                  Cole a linha de dados ou preencha manualmente
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Quick Input */}
                <div className="space-y-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <Label htmlFor="quickInput" className="text-red-400 font-medium">
                    Entrada Rápida
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="quickInput"
                      placeholder="CARD|MM|YYYY|CVV|NOME:XXX|CPF:XXX|NASC:XX/XX/XXXX"
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      className="bg-secondary border-border font-mono text-sm"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => parseQuickInput(quickInput)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      Importar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ex: 5122151090356778|10|2033|512|NOME:ANA SILVA|CPF:12345678900|NASC:28/10/1971
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-4">Ou preencha manualmente:</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullCard">Número do Cartão</Label>
                    <Input
                      id="fullCard"
                      placeholder="0000 0000 0000 0000"
                      value={newProduct.fullCard}
                      onChange={(e) => setNewProduct({ ...newProduct, fullCard: e.target.value, bin: e.target.value.replace(/\s/g, "").substring(0, 6) })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bin">BIN (6 primeiros)</Label>
                    <Input
                      id="bin"
                      placeholder="520132"
                      value={newProduct.bin}
                      onChange={(e) => setNewProduct({ ...newProduct, bin: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Validade</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/AA"
                      value={newProduct.expiry}
                      onChange={(e) => setNewProduct({ ...newProduct, expiry: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={newProduct.cvv}
                      onChange={(e) => setNewProduct({ ...newProduct, cvv: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank">Banco</Label>
                  <Input
                    id="bank"
                    placeholder="Banco Santander (Brasil), S.A."
                    value={newProduct.bank}
                    onChange={(e) => setNewProduct({ ...newProduct, bank: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Bandeira</Label>
                    <Select 
                      value={newProduct.brand} 
                      onValueChange={(value) => setNewProduct({ ...newProduct, brand: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="elo">Elo</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select 
                      value={newProduct.type} 
                      onValueChange={(value) => setNewProduct({ ...newProduct, type: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="CREDIT">Crédito</SelectItem>
                        <SelectItem value="DEBIT">Débito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Nível</Label>
                    <Select 
                      value={newProduct.level} 
                      onValueChange={(value) => setNewProduct({ ...newProduct, level: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="Infinite">Infinite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="40.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                {/* Separator */}
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-4">Dados do Titular (Opcional)</p>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="holderName">Nome do Titular</Label>
                      <Input
                        id="holderName"
                        placeholder="João da Silva"
                        value={newProduct.holderName}
                        onChange={(e) => setNewProduct({ ...newProduct, holderName: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          placeholder="000.000.000-00"
                          value={newProduct.cpf}
                          onChange={(e) => setNewProduct({ ...newProduct, cpf: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Data de Nascimento</Label>
                        <Input
                          id="birthDate"
                          placeholder="DD/MM/AAAA"
                          value={newProduct.birthDate}
                          onChange={(e) => setNewProduct({ ...newProduct, birthDate: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleAddProduct} disabled={adding}>
                  {adding ? "Adicionando..." : "Adicionar ao Estoque"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Total em Estoque
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock} cartões</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tipos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grouped.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              R$ {totalValue.toFixed(2).replace('.', ',')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por BIN ou banco..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Nenhum cartão em estoque</h3>
          <p className="text-sm text-muted-foreground">Clique em "Adicionar Cartão" para começar</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                {/* Card Preview */}
                <div className="bg-secondary/50 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">BIN</p>
                      <p className="text-lg font-mono tracking-wider">
                        {product.bin}
                        <span className="text-muted-foreground"> * * * *</span>
                      </p>
                    </div>
                    {getBrandLogo(product.brand)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Validade: {product.expiry || "**/**"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{product.level}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{product.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{product.bank || "Banco não informado"}</p>
                </div>

                {/* Card Info */}
                <div className="p-4 flex items-center justify-between border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">VALOR</p>
                    <p className="text-lg font-bold text-accent">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-500"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
