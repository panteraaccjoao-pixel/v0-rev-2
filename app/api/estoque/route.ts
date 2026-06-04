import { NextRequest, NextResponse } from "next/server"

// In-memory storage for products (replace with database in production)
let products: Product[] = []

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
  // Additional info
  holderName: string
  cpf: string
  birthDate: string
}

// GET - List all products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level")
  const brand = searchParams.get("brand")
  const search = searchParams.get("search")

  let filteredProducts = [...products]

  if (level && level !== "Nível") {
    filteredProducts = filteredProducts.filter(p => p.level === level)
  }

  if (brand && brand !== "Bandeira") {
    filteredProducts = filteredProducts.filter(p => p.brand.toLowerCase() === brand.toLowerCase())
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredProducts = filteredProducts.filter(p => 
      p.bin.includes(search) || 
      p.bank.toLowerCase().includes(searchLower) ||
      p.level.toLowerCase().includes(searchLower)
    )
  }

  // Group products by level and brand for client view
  const grouped = filteredProducts.reduce((acc, product) => {
    const key = `${product.level}-${product.brand}`
    if (!acc[key]) {
      acc[key] = {
        level: product.level,
        brand: product.brand,
        price: product.price,
        count: 0,
        products: []
      }
    }
    acc[key].count++
    acc[key].products.push(product)
    return acc
  }, {} as Record<string, { level: string; brand: string; price: number; count: number; products: Product[] }>)

  return NextResponse.json({
    products: filteredProducts,
    grouped: Object.values(grouped),
    total: filteredProducts.length
  })
}

// POST - Add new product
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const newProduct: Product = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bin: data.bin || data.fullCard?.substring(0, 6) || "",
      fullCard: data.fullCard || "",
      expiry: data.expiry || "",
      cvv: data.cvv || "",
      bank: data.bank || "",
      type: data.type || "CREDIT",
      level: data.level || "Standard",
      price: parseFloat(data.price) || 0,
      brand: data.brand || "visa",
      createdAt: new Date().toISOString(),
      holderName: data.holderName || "",
      cpf: data.cpf || "",
      birthDate: data.birthDate || ""
    }

    products.push(newProduct)

    return NextResponse.json({ success: true, product: newProduct })
  } catch (error) {
    console.error("Error adding product:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}

// DELETE - Remove product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const index = products.findIndex(p => p.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    products.splice(index, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}

// PATCH - Purchase a product
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, userId, userName } = body

    if (action === "purchase") {
      const productIndex = products.findIndex(p => p.id === id)
      if (productIndex === -1) {
        return NextResponse.json(
          { error: "Produto não encontrado ou já vendido" },
          { status: 404 }
        )
      }

      const product = products[productIndex]
      
      // Remove from available products (mark as sold)
      products.splice(productIndex, 1)

      // Create order record
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/pedidos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId || "user_teste_001",
            userName: userName || "Cliente",
            product: `${product.level} ${product.brand}`,
            level: product.level,
            brand: product.brand,
            total: product.price,
            cardData: {
              fullCard: product.fullCard,
              cvv: product.cvv,
              expiry: product.expiry,
              bin: product.bin,
              bank: product.bank,
              holderName: product.holderName,
              cpf: product.cpf,
              birthDate: product.birthDate
            }
          })
        })
      } catch (e) {
        console.error("Error creating order:", e)
      }

      // Return full card details after purchase
      return NextResponse.json({ 
        success: true, 
        card: {
          id: product.id,
          fullCard: product.fullCard,
          cvv: product.cvv,
          expiry: product.expiry,
          bin: product.bin,
          bank: product.bank,
          level: product.level,
          brand: product.brand,
          price: product.price,
          holderName: product.holderName,
          cpf: product.cpf,
          birthDate: product.birthDate
        },
        message: "Compra realizada com sucesso!"
      })
    }

    return NextResponse.json(
      { error: "Ação inválida" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error processing purchase:", error)
    return NextResponse.json(
      { error: "Erro ao processar compra" },
      { status: 500 }
    )
  }
}
