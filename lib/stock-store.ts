// Fonte única de estoque de produtos (cartões), compartilhada entre as rotas.
// Substituir por banco de dados em produção.

export interface Product {
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

// Persiste entre hot-reloads usando o objeto global.
const globalForStock = globalThis as unknown as { __stockProducts?: Product[] }
const products: Product[] = globalForStock.__stockProducts ?? (globalForStock.__stockProducts = [])

export function getProducts(): Product[] {
  return products
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
  products.push(newProduct)
  return newProduct
}

export function findProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

// Remove um produto do estoque pelo id e o retorna (ou undefined se não existir).
export function removeProductById(id: string): Product | undefined {
  const index = products.findIndex((p) => p.id === id)
  if (index === -1) return undefined
  return products.splice(index, 1)[0]
}

export function updateProduct(id: string, data: Partial<Product>): Product | undefined {
  const index = products.findIndex((p) => p.id === id)
  if (index === -1) return undefined
  products[index] = {
    ...products[index],
    ...data,
    price:
      data.price !== undefined
        ? typeof data.price === "number"
          ? data.price
          : parseFloat(String(data.price))
        : products[index].price,
  }
  return products[index]
}

// Retorna os produtos disponíveis que correspondem a um nível e bandeira.
export function findMatchingProducts(level: string, brand: string): Product[] {
  return products.filter(
    (p) =>
      p.level.toLowerCase() === String(level).toLowerCase() &&
      p.brand.toLowerCase() === String(brand).toLowerCase(),
  )
}
