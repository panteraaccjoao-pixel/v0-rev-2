"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Package
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
import Image from "next/image"

// Dados de exemplo
const products = [
  { 
    id: 1, 
    bin: "520132", 
    bank: "Banco Santander (Brasil), S.A.", 
    type: "CREDIT", 
    level: "Platinum",
    price: 40.00, 
    stock: 15,
    brand: "mastercard"
  },
  { 
    id: 2, 
    bin: "450123", 
    bank: "Banco Itaú Unibanco S.A.", 
    type: "CREDIT", 
    level: "Gold",
    price: 35.00, 
    stock: 8,
    brand: "visa"
  },
  { 
    id: 3, 
    bin: "540721", 
    bank: "Nu Pagamentos S.A.", 
    type: "CREDIT", 
    level: "Black",
    price: 80.00, 
    stock: 3,
    brand: "mastercard"
  },
  { 
    id: 4, 
    bin: "410256", 
    bank: "Banco Bradesco S.A.", 
    type: "CREDIT", 
    level: "Infinite",
    price: 120.00, 
    stock: 5,
    brand: "visa"
  },
]

const getBrandLogo = (brand: string) => {
  if (brand === "mastercard") {
    return (
      <div className="flex">
        <div className="h-6 w-6 rounded-full bg-red-500 -mr-2"></div>
        <div className="h-6 w-6 rounded-full bg-orange-400"></div>
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
  const [newProduct, setNewProduct] = useState({
    bin: "",
    bank: "",
    type: "CREDIT",
    level: "",
    price: "",
    fullCard: "",
    expiry: "",
    cvv: "",
    brand: "mastercard"
  })

  const filteredProducts = products.filter(
    (product) =>
      product.bin.includes(search) ||
      product.bank.toLowerCase().includes(search.toLowerCase())
  )

  const totalStock = products.reduce((acc, p) => acc + p.stock, 0)

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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cartão</DialogTitle>
              <DialogDescription>
                Preencha os dados do cartão para adicionar ao estoque
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullCard">Número do Cartão</Label>
                  <Input
                    id="fullCard"
                    placeholder="0000 0000 0000 0000"
                    value={newProduct.fullCard}
                    onChange={(e) => setNewProduct({ ...newProduct, fullCard: e.target.value })}
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
                      <SelectItem value="Classic">Classic</SelectItem>
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
              <Button className="w-full" onClick={() => setIsAddDialogOpen(false)}>
                Adicionar ao Estoque
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Estoque
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
            <div className="text-2xl font-bold">{products.length}</div>
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
              R$ {products.reduce((acc, p) => acc + (p.price * p.stock), 0).toFixed(2)}
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

      {/* Products Grid - Card Style like the image */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-card border-border overflow-hidden">
            <CardContent className="p-0">
              {/* Card Preview */}
              <div className="bg-secondary/50 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">BIN</p>
                    <p className="text-lg font-mono tracking-wider">
                      {product.bin.split("").map((digit, i) => (
                        <span key={i}>{digit}</span>
                      ))}
                      <span className="text-muted-foreground"> * * * * * *</span>
                    </p>
                  </div>
                  {getBrandLogo(product.brand)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Validade: **/**</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{product.level}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{product.type}</span>
                </div>
                <p className="text-xs text-muted-foreground">{product.bank}</p>
              </div>

              {/* Card Info */}
              <div className="p-4 flex items-center justify-between border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">VALOR</p>
                  <p className="text-lg font-bold text-accent">R$ {product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {product.stock} em estoque
                  </span>
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
                      <DropdownMenuItem className="text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
