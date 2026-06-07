// Implementação em memória do repositório de estoque (cartões).
import state from "../memory-state"
import type { Product } from "../types"

export async function listStock(): Promise<Product[]> {
  return state.stock
}

export async function addStock(data: Partial<Product>): Promise<Product> {
  const product: Product = {
    id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    bin: data.bin || data.fullCard?.substring(0, 6) || "",
    fullCard: data.fullCard || "",
    expiry: data.expiry || "",
    cvv: data.cvv || "",
    bank: data.bank || "",
    type: data.type || "CREDIT",
    level: data.level || "Standard",
    price: typeof data.price === "number" ? data.price : parseFloat(String(data.price)) || 0,
    brand: data.brand || "visa",
    createdAt: new Date().toISOString(),
    holderName: data.holderName || "",
    cpf: data.cpf || "",
    birthDate: data.birthDate || "",
  }
  state.stock.push(product)
  return product
}

export async function findStockById(id: string): Promise<Product | null> {
  return state.stock.find((p) => p.id === id) ?? null
}

export async function removeStockById(id: string): Promise<Product | null> {
  const index = state.stock.findIndex((p) => p.id === id)
  if (index === -1) return null
  return state.stock.splice(index, 1)[0]
}

export async function updateStock(id: string, data: Partial<Product>): Promise<Product | null> {
  const index = state.stock.findIndex((p) => p.id === id)
  if (index === -1) return null
  state.stock[index] = {
    ...state.stock[index],
    ...data,
    price:
      data.price !== undefined
        ? typeof data.price === "number"
          ? data.price
          : parseFloat(String(data.price))
        : state.stock[index].price,
  }
  return state.stock[index]
}

// Retorna os produtos disponíveis que correspondem a um nível e bandeira.
export async function findMatchingStock(level: string, brand: string): Promise<Product[]> {
  return state.stock.filter(
    (p) =>
      p.level.toLowerCase() === String(level).toLowerCase() &&
      p.brand.toLowerCase() === String(brand).toLowerCase(),
  )
}
