"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Shield, Ticket, ShoppingCart, CreditCard, Copy, Check, Loader2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

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

interface PixPayment {
  id: string
  amount: number
  pixCode: string
  qrCodeUrl: string
  expiresAt: string
}

interface DeliveredCard {
  fullCard: string
  cvv: string
  expiry: string
  bin: string
  bank: string
  level: string
  brand: string
  holderName?: string
  cpf?: string
  birthDate?: string
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
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedCard, setCopiedCard] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "expired">("pending")
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [deliveredCards, setDeliveredCards] = useState<DeliveredCard[]>([])
  const [loadingDelivery, setLoadingDelivery] = useState(false)

  useEffect(() => {
    const cartData = searchParams.get("cart")
    if (cartData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cartData))
        setCartItems(parsed)
      } catch {
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

  // Create order after successful delivery
  const createOrder = useCallback(async (cards: DeliveredCard[]) => {
    try {
      for (const card of cards) {
        await fetch("/api/pedidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user_teste_001",
            userName: "Conta Teste",
            product: `${card.level} ${card.brand}`,
            level: card.level,
            brand: card.brand,
            total: cartItems.find(i => i.level === card.level && i.brand === card.brand)?.price || 0,
            cardData: {
              fullCard: card.fullCard.replace(/\s/g, ""),
              cvv: card.cvv,
              expiry: card.expiry,
              bin: card.bin,
              bank: card.bank,
              holderName: card.holderName,
              cpf: card.cpf,
              birthDate: card.birthDate
            }
          })
        })
      }
    } catch (error) {
      console.error("Error creating order:", error)
    }
  }, [cartItems])

  // Process purchase: deduct balance and remove from stock
  const processPurchase = useCallback(async (cards: (DeliveredCard & { id?: string })[]) => {
    try {
      // 1. Deduct balance from user
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const discountAmount = appliedCoupon 
        ? (appliedCoupon.type === "percent" 
            ? totalAmount * (appliedCoupon.discount / 100) 
            : appliedCoupon.discount)
        : 0
      const finalAmount = Math.max(0, totalAmount - discountAmount)
      
      if (finalAmount > 0) {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_balance",
            email: "teste@teste.com",
            amount: -finalAmount
          })
        })
      }

      // 2. Remove products from stock
      for (const card of cards) {
        if (card.id) {
          await fetch(`/api/estoque?id=${card.id}`, {
            method: "DELETE"
          })
        }
      }
    } catch (error) {
      console.error("Error processing purchase:", error)
    }
  }, [cartItems, appliedCoupon])

  // Fetch delivered cards after payment
  const fetchDeliveredCards = useCallback(async () => {
    setLoadingDelivery(true)
    try {
      // Fetch cards from estoque based on cart items
      const res = await fetch("/api/estoque")
      const data = await res.json()
      
      if (data.products && data.products.length > 0) {
        const cards: DeliveredCard[] = []
        
        for (const item of cartItems) {
          // Find matching products from stock
          const matchingProducts = data.products.filter(
            (p: DeliveredCard & { id: string }) => 
              p.level?.toLowerCase() === item.level?.toLowerCase() && 
              p.brand?.toLowerCase() === item.brand?.toLowerCase()
          )
          
          // Take the quantity requested
          for (let i = 0; i < Math.min(item.quantity, matchingProducts.length); i++) {
            cards.push(matchingProducts[i])
          }
        }
        
        const finalCards = cards.length > 0 ? cards : [{
          fullCard: "4532 1234 5678 9012",
          cvv: "123",
          expiry: "12/27",
          bin: "453212",
          bank: "Banco Exemplo",
          level: cartItems[0]?.level || "Standard",
          brand: cartItems[0]?.brand || "Visa",
          holderName: "NOME DO TITULAR",
          cpf: "123.456.789-00"
        }]
        setDeliveredCards(finalCards)
        // Process purchase and create order
        await processPurchase(finalCards)
        await createOrder(finalCards)
      } else {
        // Fallback card for demo
        const fallbackCards = [{
          fullCard: "4532 1234 5678 9012",
          cvv: "123",
          expiry: "12/27",
          bin: "453212",
          bank: "Banco Exemplo",
          level: cartItems[0]?.level || "Standard",
          brand: cartItems[0]?.brand || "Visa",
          holderName: "NOME DO TITULAR",
          cpf: "123.456.789-00"
        }]
        setDeliveredCards(fallbackCards)
        await processPurchase(fallbackCards)
        await createOrder(fallbackCards)
      }
    } catch (error) {
      console.error("Error fetching cards:", error)
      // Fallback
      const fallbackCards = [{
        fullCard: "4532 1234 5678 9012",
        cvv: "123",
        expiry: "12/27",
        bin: "453212",
        bank: "Banco Exemplo",
        level: cartItems[0]?.level || "Standard",
        brand: cartItems[0]?.brand || "Visa"
      }]
      setDeliveredCards(fallbackCards)
      await processPurchase(fallbackCards)
      await createOrder(fallbackCards)
    } finally {
      setLoadingDelivery(false)
    }
  }, [cartItems, createOrder, processPurchase])

  // Poll for payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!pixPayment) return

    try {
      const res = await fetch(`/api/pix?id=${pixPayment.id}`)
      const data = await res.json()
      
      if (data.status === "paid") {
        setPaymentStatus("paid")
        // Fetch delivered cards
        fetchDeliveredCards()
        localStorage.removeItem("checkout_cart")
      } else if (data.status === "expired") {
        setPaymentStatus("expired")
      }
    } catch (error) {
      console.error("Error checking payment:", error)
    }
  }, [pixPayment, fetchDeliveredCards])

  useEffect(() => {
    if (pixPayment && paymentStatus === "pending") {
      const interval = setInterval(checkPaymentStatus, 5000) // Check every 5 seconds
      return () => clearInterval(interval)
    }
  }, [pixPayment, paymentStatus, checkPaymentStatus])

  // Countdown timer
  useEffect(() => {
    if (pixPayment && paymentStatus === "pending") {
      const updateTimer = () => {
        const now = new Date().getTime()
        const expiry = new Date(pixPayment.expiresAt).getTime()
        const diff = expiry - now

        if (diff <= 0) {
          setTimeLeft("Expirado")
          setPaymentStatus("expired")
          return
        }

        const minutes = Math.floor(diff / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [pixPayment, paymentStatus])

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

      // If total is 0, deliver cards immediately without PIX
      if (total <= 0) {
        setPaymentStatus("paid")
        fetchDeliveredCards()
        localStorage.removeItem("checkout_cart")
        setProcessing(false)
        return
      }

      // Create PIX payment
      let sessionUserId = ""
      let sessionEmail = ""
      try {
        const raw = localStorage.getItem("user_session")
        if (raw) {
          const s = JSON.parse(raw)
          sessionUserId = s.userId || ""
          sessionEmail = s.email || ""
        }
      } catch {}

      const res = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          userId: sessionUserId,
          userEmail: sessionEmail,
          items: cartItems.map(item => ({
            level: item.level,
            brand: item.brand,
            quantity: item.quantity,
            price: item.price
          }))
        })
      })

      const data = await res.json()

      if (data.success) {
        setPixPayment(data.payment)
      } else {
        alert("Erro ao gerar PIX")
      }
    } catch {
      alert("Erro ao finalizar compra")
    } finally {
      setProcessing(false)
    }
  }

  const handleCopyPixCode = async () => {
    if (!pixPayment) return
    
    try {
      await navigator.clipboard.writeText(pixPayment.pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = pixPayment.pixCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  // Simulate payment (for testing)
  const handleSimulatePayment = async () => {
    if (!pixPayment) return
    
    try {
      await fetch("/api/pix", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pixPayment.id, action: "confirm" })
      })
      setPaymentStatus("paid")
      fetchDeliveredCards()
      localStorage.removeItem("checkout_cart")
    } catch {
      console.error("Error simulating payment")
    }
  }

  if (cartItems.length === 0 && !pixPayment) {
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

  // PIX Payment Screen OR Free Delivery Screen
  if (pixPayment || paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-background p-6">
        <Link 
          href="/dashboard/comprar"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar a loja
        </Link>

        <Card className="max-w-lg mx-auto bg-card border-border">
          <CardContent className="p-6 space-y-6">
            {paymentStatus === "paid" ? (
              // Payment Success - Show Delivered Cards
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4">
                    <Check className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-500 mb-2">Pagamento Confirmado!</h2>
                  <p className="text-muted-foreground text-center">
                    {loadingDelivery ? "Carregando seus cartoes..." : "Seus cartoes foram entregues"}
                  </p>
                </div>

                {loadingDelivery ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deliveredCards.map((card, index) => (
                      <div 
                        key={index}
                        className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4"
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-accent" />
                            <span className="font-semibold">{card.level} {card.brand}</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-500">
                            Entregue
                          </span>
                        </div>

                        {/* Card Number */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Numero do Cartao</p>
                          <div className="flex items-center justify-between gap-2 rounded-lg bg-background p-3 font-mono">
                            <span className="text-lg tracking-wider">{card.fullCard}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={copiedCard === `card-${index}` ? "text-emerald-500" : ""}
                              onClick={async () => {
                                await navigator.clipboard.writeText(card.fullCard.replace(/\s/g, ""))
                                setCopiedCard(`card-${index}`)
                                setTimeout(() => setCopiedCard(null), 2000)
                              }}
                            >
                              {copiedCard === `card-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* CVV and Expiry */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">CVV</p>
                            <div className="flex items-center justify-between gap-2 rounded-lg bg-background p-3 font-mono">
                              <span>{card.cvv}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={copiedCard === `cvv-${index}` ? "text-emerald-500" : ""}
                                onClick={async () => {
                                  await navigator.clipboard.writeText(card.cvv)
                                  setCopiedCard(`cvv-${index}`)
                                  setTimeout(() => setCopiedCard(null), 2000)
                                }}
                              >
                                {copiedCard === `cvv-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Validade</p>
                            <div className="flex items-center justify-between gap-2 rounded-lg bg-background p-3 font-mono">
                              <span>{card.expiry}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={copiedCard === `exp-${index}` ? "text-emerald-500" : ""}
                                onClick={async () => {
                                  await navigator.clipboard.writeText(card.expiry)
                                  setCopiedCard(`exp-${index}`)
                                  setTimeout(() => setCopiedCard(null), 2000)
                                }}
                              >
                                {copiedCard === `exp-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Bank and BIN */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Banco</p>
                            <p className="text-sm font-medium">{card.bank || "Nao informado"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">BIN</p>
                            <p className="text-sm font-medium font-mono">{card.bin}</p>
                          </div>
                        </div>

                        {/* Holder Data */}
                        {(card.holderName || card.cpf || card.birthDate) && (
                          <div className="border-t border-border pt-4 space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Dados do Titular</p>
                            {card.holderName && (
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-muted-foreground">Nome</p>
                                  <p className="text-sm font-medium">{card.holderName}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={copiedCard === `name-${index}` ? "text-emerald-500" : ""}
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(card.holderName || "")
                                    setCopiedCard(`name-${index}`)
                                    setTimeout(() => setCopiedCard(null), 2000)
                                  }}
                                >
                                  {copiedCard === `name-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            )}
                            {card.cpf && (
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-muted-foreground">CPF</p>
                                  <p className="text-sm font-medium font-mono">{card.cpf}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={copiedCard === `cpf-${index}` ? "text-emerald-500" : ""}
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(card.cpf || "")
                                    setCopiedCard(`cpf-${index}`)
                                    setTimeout(() => setCopiedCard(null), 2000)
                                  }}
                                >
                                  {copiedCard === `cpf-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                            )}
                            {card.birthDate && (
                              <div>
                                <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                                <p className="text-sm font-medium">{card.birthDate}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Formatted Data Row */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Dados Formatados</p>
                          <div className="flex items-center gap-2 rounded-lg bg-background p-3">
                            <code className="flex-1 text-xs font-mono text-emerald-400 break-all">
                              {(() => {
                                const [month, year] = (card.expiry || "00/00").split("/")
                                const fullYear = year?.length === 2 ? `20${year}` : year
                                const cpfClean = (card.cpf || "").replace(/[.\-]/g, "")
                                const cardNumber = card.fullCard.replace(/\s/g, "")
                                return `${cardNumber}|${month}|${fullYear}|${card.cvv}|${cpfClean}|${card.holderName || ""}`
                              })()}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={copiedCard === `formatted-${index}` ? "text-emerald-500" : ""}
                              onClick={async () => {
                                const [month, year] = (card.expiry || "00/00").split("/")
                                const fullYear = year?.length === 2 ? `20${year}` : year
                                const cpfClean = (card.cpf || "").replace(/[.\-]/g, "")
                                const cardNumber = card.fullCard.replace(/\s/g, "")
                                const formattedData = `${cardNumber}|${month}|${fullYear}|${card.cvv}|${cpfClean}|${card.holderName || ""}`
                                await navigator.clipboard.writeText(formattedData)
                                setCopiedCard(`formatted-${index}`)
                                setTimeout(() => setCopiedCard(null), 2000)
                              }}
                            >
                              {copiedCard === `formatted-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Back to Store Button */}
                    <Button 
                      className="w-full bg-accent hover:bg-accent/90"
                      onClick={() => router.push("/dashboard/comprar")}
                    >
                      Voltar a Loja
                    </Button>
                  </div>
                )}
              </div>
            ) : paymentStatus === "expired" ? (
              // Payment Expired
              <div className="flex flex-col items-center justify-center py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 mb-4">
                  <QrCode className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-red-500 mb-2">PIX Expirado</h2>
                <p className="text-muted-foreground text-center mb-6">
                  O tempo para pagamento expirou. Gere um novo PIX.
                </p>
                <Button onClick={() => {
                  setPixPayment(null)
                  setPaymentStatus("pending")
                }}>
                  Tentar Novamente
                </Button>
              </div>
            ) : pixPayment ? (
              // Pending Payment - Show QR Code
              <>
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-2">Pagamento via PIX</h1>
                  <p className="text-muted-foreground">
                    Escaneie o QR Code ou copie o codigo PIX
                  </p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2 text-amber-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-mono font-semibold">Expira em: {timeLeft}</span>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="rounded-xl bg-white p-4">
                    <Image
                      src={pixPayment.qrCodeUrl}
                      alt="QR Code PIX"
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Valor a pagar</p>
                  <p className="text-3xl font-bold text-accent">
                    R$ {pixPayment.amount.toFixed(2).replace(".", ",")}
                  </p>
                </div>

                {/* Copy PIX Code */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">PIX Copia e Cola</p>
                  <div className="relative">
                    <Input
                      value={pixPayment.pixCode}
                      readOnly
                      className="pr-24 bg-secondary border-border font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      className={`absolute right-1 top-1/2 -translate-y-1/2 ${copied ? "bg-emerald-600" : ""}`}
                      onClick={handleCopyPixCode}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Waiting for Payment */}
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Aguardando pagamento...</span>
                </div>

                {/* Security Footer */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Pagamento seguro via PIX</span>
                </div>

                {/* Simulate Payment Button (for testing) */}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                  onClick={handleSimulatePayment}
                >
                  Simular Pagamento (Teste)
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground mt-4">Carregando...</p>
              </div>
            )}
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
            {processing ? "Gerando PIX..." : "Finalizar Compra"}
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
