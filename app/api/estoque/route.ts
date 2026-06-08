import { NextRequest, NextResponse } from "next/server"
import {
  listStock,
  addStock,
  removeStockById,
  updateStock,
  findStockById,
} from "@/lib/repositories/stock"
import type { Product } from "@/lib/repositories/types"
import { createOrder } from "@/lib/repositories/orders"
import { getUserByEmail, setBalance, recordPurchase } from "@/lib/repositories/users"

// GET - List all products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level")
  const brand = searchParams.get("brand")
  const search = searchParams.get("search")

  let filteredProducts = [...(await listStock())]

  if (level && level !== "Nível") {
    filteredProducts = filteredProducts.filter((p) => p.level === level)
  }

  if (brand && brand !== "Bandeira") {
    filteredProducts = filteredProducts.filter((p) => p.brand.toLowerCase() === brand.toLowerCase())
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.bin.includes(search) ||
        p.bank.toLowerCase().includes(searchLower) ||
        p.level.toLowerCase().includes(searchLower),
    )
  }

  // Group products by BIN, level and brand for client view
  const grouped = filteredProducts.reduce(
    (acc, product) => {
      const key = `${product.bin}-${product.level}-${product.brand}`
      if (!acc[key]) {
        acc[key] = {
          level: product.level,
          brand: product.brand,
          price: product.price,
          count: 0,
          products: [] as { id: string }[],
          bin: product.bin,
          bank: product.bank,
          holderName: product.holderName,
          expiry: product.expiry,
          hasHolderData: !!(product.holderName || product.cpf || product.birthDate),
        }
      }
      acc[key].count++
      acc[key].products.push({ id: product.id })
      return acc
    },
    {} as Record<
      string,
      {
        level: string
        brand: string
        price: number
        count: number
        products: { id: string }[]
        bin: string
        bank: string
        holderName: string
        expiry: string
        hasHolderData: boolean
      }
    >,
  )

  return NextResponse.json({
    products: filteredProducts,
    grouped: Object.values(grouped),
    total: filteredProducts.length,
  })
}

// POST - Add new product
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const newProduct = await addStock(data)
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

    const removed = await removeStockById(id)
    if (!removed) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const updated = await updateStock(data.id, data)
    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, product: updated })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// PATCH - Purchase a single product directly (compra unitária paga com saldo).
// O fluxo principal de compra é /api/checkout. Mantido para compras avulsas.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, userId, userName, userEmail } = body

    if (action !== "purchase") {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }

    const product = await findStockById(id)
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado ou já vendido" }, { status: 404 })
    }

    // Paga com saldo se houver perfil e saldo suficiente.
    const profile = userEmail ? await getUserByEmail(userEmail) : null
    let newBalance: number | undefined
    if (profile) {
      const balance = Number(profile.balance ?? 0)
      if (balance < Number(product.price ?? 0)) {
        return NextResponse.json(
          { error: "Saldo insuficiente", needsRecharge: true },
          { status: 402 },
        )
      }
      newBalance = balance - Number(product.price ?? 0)
      await setBalance(profile.id, newBalance)
      await recordPurchase(profile.id, Number(product.price ?? 0))
    }

    // Baixa o estoque.
    const removed = await removeStockById(id)
    if (!removed) {
      return NextResponse.json({ error: "Produto não encontrado ou já vendido" }, { status: 404 })
    }

    // Cria o pedido.
    await createOrder({
      userId: userId || profile?.id || "user_teste_001",
      userName: userName || profile?.name || "Cliente",
      product: `${removed.level} ${removed.brand}`,
      level: removed.level,
      brand: removed.brand,
      total: removed.price,
      cardData: {
        fullCard: removed.fullCard,
        cvv: removed.cvv,
        expiry: removed.expiry,
        bin: removed.bin,
        bank: removed.bank,
        holderName: removed.holderName,
        cpf: removed.cpf,
        birthDate: removed.birthDate,
      },
    })

    return NextResponse.json({
      success: true,
      card: {
        id: removed.id,
        fullCard: removed.fullCard,
        cvv: removed.cvv,
        expiry: removed.expiry,
        bin: removed.bin,
        bank: removed.bank,
        level: removed.level,
        brand: removed.brand,
        price: removed.price,
        holderName: removed.holderName,
        cpf: removed.cpf,
        birthDate: removed.birthDate,
      },
      newBalance,
      message: "Compra realizada com sucesso!",
    })
  } catch (error) {
    console.error("Error processing purchase:", error)
    return NextResponse.json({ error: "Erro ao processar compra" }, { status: 500 })
  }
}
