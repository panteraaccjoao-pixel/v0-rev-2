import { NextRequest, NextResponse } from "next/server"

// In-memory storage for products (replace with database in production)
let products: Product[] = []

interface Product {
  id: string
  name: string
  level: string
  bank: string
  flag: string
  price: number
  quantity: number
  createdAt: string
}

// GET - List all products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level")
  const flag = searchParams.get("flag")
  const search = searchParams.get("search")
  const available = searchParams.get("available")

  let filteredProducts = [...products]

  // Filter by level
  if (level && level !== "all") {
    filteredProducts = filteredProducts.filter(p => p.level.toLowerCase() === level.toLowerCase())
  }

  // Filter by flag
  if (flag && flag !== "all") {
    filteredProducts = filteredProducts.filter(p => p.flag.toLowerCase() === flag.toLowerCase())
  }

  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase()
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.bank.toLowerCase().includes(searchLower) ||
      p.level.toLowerCase().includes(searchLower) ||
      p.flag.toLowerCase().includes(searchLower)
    )
  }

  // Filter only available (quantity > 0)
  if (available === "true") {
    filteredProducts = filteredProducts.filter(p => p.quantity > 0)
  }

  // Sort by createdAt (newest first)
  filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Calculate stats
  const totalProducts = products.length
  const totalAvailable = products.reduce((sum, p) => sum + p.quantity, 0)
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)

  return NextResponse.json({
    products: filteredProducts,
    stats: {
      totalProducts,
      totalAvailable,
      totalValue
    }
  })
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, level, bank, flag, price, quantity } = body

    if (!name || !level || !flag || !price || !quantity) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      level,
      bank: bank || "",
      flag,
      price: Number(price),
      quantity: Number(quantity),
      createdAt: new Date().toISOString()
    }

    products.push(newProduct)

    return NextResponse.json({ success: true, product: newProduct })
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    )
  }
}

// DELETE - Remove a product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400 }
      )
    }

    const index = products.findIndex(p => p.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    products.splice(index, 1)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Erro ao remover produto" },
      { status: 500 }
    )
  }
}

// PATCH - Update product quantity (for purchases)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, quantity } = body

    const product = products.find(p => p.id === id)
    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    if (action === "purchase") {
      const qty = quantity || 1
      if (product.quantity < qty) {
        return NextResponse.json(
          { error: "Estoque insuficiente" },
          { status: 400 }
        )
      }
      product.quantity -= qty
      
      return NextResponse.json({ 
        success: true, 
        product,
        message: "Compra realizada com sucesso!"
      })
    }

    if (action === "restock") {
      product.quantity += Number(quantity) || 0
      return NextResponse.json({ success: true, product })
    }

    return NextResponse.json(
      { error: "Ação inválida" },
      { status: 400 }
    )
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    )
  }
}
