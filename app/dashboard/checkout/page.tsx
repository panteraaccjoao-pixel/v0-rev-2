"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Shield, Ticket, ShoppingCart, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface CartItem {
  id: string
  level: string
  brand: string
  bin: string
  price: number
  quantity: number
}

interface AppliedCoupon {
  code: string
  discount: number
  type: "percent" | "fixed"
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponError, setCouponError] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Get cart data from URL params or localStorage
    const cartData = searchParams.get("cart")
    if (cartData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cartData))
        setCartItems(parsed)
      } catch {
        // Fallback to localStorage
        const stored = localStorage.getItem("checkout_cart")
        if (stored) {
          setCartItems(JSON.parse(stored))
        }
      }
    } else {
      const stored = localStorage.getItem("checkout_cart")
      if (stored) {
        setCartItems(JSON.parse(stored))
      }
    }
  }, [searchParams])

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  const discountAmount = appliedCoupon 
    ? appliedCoupon.type === "percent" 
      ? (subtotal * appliedCoupon.discount) / 100
      : appliedCoupon.discount
    : 0

  const total = subtotal - discountAmount

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Digite um codigo de cupom")
      return
    }

    setCouponLoading(true)
    setCouponError("")

    try {
      const res = await fetch("/api/cupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", code: couponCode })
      })

      const data = await res.json()

      if (data.valid) {
        setAppliedCoupon(data.cupom)
        setCouponError("")
      } else {
        setCouponError(data.error || "Cupom invalido")
        setAppliedCoupon(null)
      }
    } catch {
      setCouponError("Erro ao validar cupom")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
  }

  const handleFinalizePurchase = async () => {
    setProcessing(true)
    
    try {
      // Use the coupon if applied
      if (appliedCoupon) {
        await fetch("/api/cupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "use", code: appliedCoupon.code })
        })
      }

      // TODO: Process payment and complete purchase
      alert("Compra finalizada com sucesso!")
      localStorage.removeItem("checkout_cart")
      router.push("/dashboard/compras")
    } catch {
      alert("Erro ao finalizar compra")
    } finally {
      setProcessing(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Link 
          href="/dashboard/comprar"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar a loja
        </Link>

        <Card className="max-w-2xl mx-auto bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Carrinho vazio</h2>
            <p className="text-muted-foreground mb-6">Adicione itens ao carrinho para continuar</p>
            <Button asChild>
              <Link href="/dashboard/comprar">Ver produtos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Link 
        href="/dashboard/comprar"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar a loja
      </Link>

      <Card className="max-w-2xl mx-auto bg-card border-border">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <h1 className="text-2xl font-bold">
            Finalizar Compra ({totalItems} {totalItems === 1 ? "item" : "itens"})
          </h1>

          {/* Cart Items */}
          <div className="space-y-3">
            {cartItems.map((item, index) => (
              <div 
                key={`${item.bin}-${item.level}-${index}`}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.level}</p>
                    <p className="text-sm text-muted-foreground">{item.brand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{item.quantity}x</p>
                  <p className="font-semibold text-accent">
                    R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Checker Info */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <Shield className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-emerald-500">Checker integrado ativo</p>
                <p className="text-sm text-muted-foreground">
                  Todas as infos serao checadas automaticamente e entregues live/funcionando apos confirmar o PIX.
                </p>
              </div>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="space-y-2">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-emerald-500">
                    {appliedCoupon.code} - {appliedCoupon.type === "percent" ? `${appliedCoupon.discount}% OFF` : `R$ ${appliedCoupon.discount.toFixed(2).replace(".", ",")} OFF`}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={handleRemoveCoupon}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Codigo do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? "..." : "Aplicar"}
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-sm text-red-500">{couponError}</p>
            )}
          </div>

          {/* Price Summary */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className={appliedCoupon ? "line-through text-muted-foreground" : ""}>
                R$ {subtotal.toFixed(2).replace(".", ",")}
              </span>
            </div>
            
            {appliedCoupon && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-500">% Desconto</span>
                <span className="text-emerald-500">
                  -R$ {discountAmount.toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between font-semibold">
              <span>Subtotal</span>
              <span className="text-accent">
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold">Pagar via PIX</span>
              <span className="text-xl font-bold">
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-semibold"
            onClick={handleFinalizePurchase}
            disabled={processing}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {processing ? "Processando..." : "Finalizar Compra"}
          </Button>

          {/* Security Footer */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Pagamento seguro via PIX</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
