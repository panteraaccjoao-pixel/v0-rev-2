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
import { isAuthenticatedAdmin, unauthorizedResponse } from "@/lib/admin-auth"

// Monta a visão pública (mascarada) de um grupo de produtos. NUNCA inclui
// dados sensíveis (número completo, CVV, CPF, nome/validade completos).
// Esses campos só saem do backend após uma compra paga/validada.
function buildGrouped(products: Product[]) {
  const grouped = products.reduce(
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
          // Dados sensíveis NÃO são enviados ao cliente. O front exibe
          // placeholders mascarados a partir desses campos vazios.
          holderName: "",
          expiry: "",
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
  return Object.values(grouped)
}

// GET - Lista o estoque.
// - Admin autenticado: recebe os produtos completos (para gerenciamento).
// - Usuário comum: recebe APENAS a visão agrupada e mascarada (sem dados
//   sensíveis), além da contagem disponível.
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

  const grouped = buildGrouped(filteredProducts)

  // Apenas o admin autenticado enxerga os dados completos dos cartões.
  if (isAuthenticatedAdmin(request)) {
    return NextResponse.json({
      products: filteredProducts,
      grouped,
      total: filteredProducts.length,
    })
  }

  // Usuário comum: nada de dados sensíveis.
  return NextResponse.json({
    grouped,
    total: filteredProducts.length,
  })
}

// POST - Adiciona produto ao estoque (somente admin).
export async function POST(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
  try {
    const data = await request.json()
    const newProduct = await addStock(data)
    return NextResponse.json({ success: true, product: newProduct })
  } catch (error) {
    console.error("Error adding product:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}

// DELETE - Remove produto do estoque (somente admin).
export async function DELETE(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
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

// PUT - Atualiza produto do estoque (somente admin).
export async function PUT(request: NextRequest) {
  if (!isAuthenticatedAdmin(request)) return unauthorizedResponse()
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

// PATCH - Compra avulsa de um cartão, paga com saldo.
// Exige um usuário válido (e-mail com perfil) e saldo suficiente. Não há mais
// entrega "de graça" para chamadas sem usuário — isso impede compras fantasma
// e o consumo indevido do estoque.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, userEmail } = body

    if (action !== "purchase") {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }

    // Exige um usuário real (perfil existente). Sem isso, não há compra.
    if (!userEmail) {
      return NextResponse.json({ error: "Faça login para comprar" }, { status: 401 })
    }
    const profile = await getUserByEmail(userEmail)
    if (!profile) {
      return NextResponse.json({ error: "Usuário não encontrado. Faça login novamente." }, { status: 401 })
    }

    const product = await findStockById(id)
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado ou já vendido" }, { status: 404 })
    }

    // Valida saldo no backend.
    const balance = Number(profile.balance ?? 0)
    const price = Number(product.price ?? 0)
    if (balance < price) {
      return NextResponse.json({ error: "Saldo insuficiente", needsRecharge: true }, { status: 402 })
    }

    // Baixa o estoque de forma atômica ANTES de cobrar, garantindo que o cartão
    // não seja vendido duas vezes.
    const removed = await removeStockById(id)
    if (!removed) {
      return NextResponse.json({ error: "Produto não encontrado ou já vendido" }, { status: 404 })
    }

    // Cobra do saldo e registra a compra.
    const newBalance = balance - price
    await setBalance(profile.id, newBalance)
    await recordPurchase(profile.id, price)

    // Cria o pedido associado ao usuário real.
    await createOrder({
      userId: profile.id,
      userName: profile.name || "Cliente",
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
