// COMPAT: migrado para `lib/repositories/stock`. Mantido como wrapper síncrono
// sobre o estado em memória consolidado para não quebrar imports existentes.
// Código novo deve usar `@/lib/repositories/stock` (async).

import state from "./repositories/memory-state"
import type { Product } from "./repositories/types"

export type { Product } from "./repositories/types"

export function getProducts(): Product[] {
  return state.stock
}

export function addProduct(data: Partial<Product>): Product {
  const newProduct: Product = {
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
  state.stock.push(newProduct)
  return newProduct
}

export function findProductById(id: string): Product | undefined {
  return state.stock.find((p) => p.id === id)
}

export function removeProductById(id: string): Product | undefined {
  const index = state.stock.findIndex((p) => p.id === id)
  if (index === -1) return undefined
  return state.stock.splice(index, 1)[0]
}

export function updateProduct(id: string, data: Partial<Product>): Product | undefined {
  const index = state.stock.findIndex((p) => p.id === id)
  if (index === -1) return undefined
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

export function findMatchingProducts(level: string, brand: string): Product[] {
  return state.stock.filter(
    (p) =>
      p.level.toLowerCase() === String(level).toLowerCase() &&
      p.brand.toLowerCase() === String(brand).toLowerCase(),
  )
}
