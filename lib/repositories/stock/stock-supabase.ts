// Implementação Supabase do repositório de estoque (cartões).
// Mantém as mesmas assinaturas do stock-memory.ts.
import { getSupabaseAdmin } from "../supabase-client"
import type { Product } from "../types"

const TABLE = "stock"

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    bin: row.bin ?? "",
    fullCard: row.full_card ?? "",
    expiry: row.expiry ?? "",
    cvv: row.cvv ?? "",
    bank: row.bank ?? "",
    type: row.type ?? "CREDIT",
    level: row.level ?? "Standard",
    price: Number(row.price ?? 0),
    brand: row.brand ?? "visa",
    createdAt: row.created_at,
    holderName: row.holder_name ?? "",
    cpf: row.cpf ?? "",
    birthDate: row.birth_date ?? "",
  }
}

function toRow(data: Partial<Product>): Record<string, any> {
  const row: Record<string, any> = {}
  if (data.bin !== undefined) row.bin = data.bin
  if (data.fullCard !== undefined) row.full_card = data.fullCard
  if (data.expiry !== undefined) row.expiry = data.expiry
  if (data.cvv !== undefined) row.cvv = data.cvv
  if (data.bank !== undefined) row.bank = data.bank
  if (data.type !== undefined) row.type = data.type
  if (data.level !== undefined) row.level = data.level
  if (data.price !== undefined)
    row.price = typeof data.price === "number" ? data.price : parseFloat(String(data.price)) || 0
  if (data.brand !== undefined) row.brand = data.brand
  if (data.holderName !== undefined) row.holder_name = data.holderName
  if (data.cpf !== undefined) row.cpf = data.cpf
  if (data.birthDate !== undefined) row.birth_date = data.birthDate
  return row
}

export async function listStock(): Promise<Product[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw new Error(`listStock: ${error.message}`)
  return (data ?? []).map(rowToProduct)
}

export async function addStock(data: Partial<Product>): Promise<Product> {
  const supabase = getSupabaseAdmin()
  const row = {
    id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    bin: data.bin || data.fullCard?.substring(0, 6) || "",
    full_card: data.fullCard || "",
    expiry: data.expiry || "",
    cvv: data.cvv || "",
    bank: data.bank || "",
    type: data.type || "CREDIT",
    level: data.level || "Standard",
    price: typeof data.price === "number" ? data.price : parseFloat(String(data.price)) || 0,
    brand: data.brand || "visa",
    created_at: new Date().toISOString(),
    holder_name: data.holderName || "",
    cpf: data.cpf || "",
    birth_date: data.birthDate || "",
  }
  const { data: inserted, error } = await supabase.from(TABLE).insert(row).select("*").single()
  if (error) throw new Error(`addStock: ${error.message}`)
  return rowToProduct(inserted)
}

export async function findStockById(id: string): Promise<Product | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle()
  if (error) throw new Error(`findStockById: ${error.message}`)
  return data ? rowToProduct(data) : null
}

// Remoção ATÔMICA: delete ... returning. Garante que dois checkouts concorrentes
// não recebam o mesmo cartão — apenas um dos deletes retorna a linha.
export async function removeStockById(id: string): Promise<Product | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select("*").maybeSingle()
  if (error) throw new Error(`removeStockById: ${error.message}`)
  return data ? rowToProduct(data) : null
}

export async function updateStock(id: string, data: Partial<Product>): Promise<Product | null> {
  const supabase = getSupabaseAdmin()
  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(toRow(data))
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw new Error(`updateStock: ${error.message}`)
  return updated ? rowToProduct(updated) : null
}

// Produtos disponíveis que correspondem a um nível e bandeira (case-insensitive).
export async function findMatchingStock(level: string, brand: string): Promise<Product[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .ilike("level", String(level))
    .ilike("brand", String(brand))
  if (error) throw new Error(`findMatchingStock: ${error.message}`)
  return (data ?? []).map(rowToProduct)
}
