// Tipos compartilhados pela camada de repositórios.
// Estes tipos representam o "contrato" de dados, independente do backend
// (memória hoje, Supabase no futuro).

export interface Profile {
  id: string
  name: string
  email: string
  password?: string
  created_at: string
  balance: number
  total_spent: number
  purchases: number
  status: "active" | "blocked"
  discord_id?: string
}

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

export interface Order {
  id: string
  oderId: string
  userId: string
  userName: string
  product: string
  level: string
  brand: string
  quantity: number
  total: number
  date: string
  status: "entregue" | "expirado" | "reembolsado" | "pendente"
  cardData?: {
    fullCard: string
    cvv: string
    expiry: string
    bin: string
    bank: string
    holderName?: string
    cpf?: string
    birthDate?: string
  }
}

export interface PixPayment {
  id: string
  amount: number
  status: "pending" | "paid" | "expired"
  pixCode: string
  qrCodeUrl: string
  createdAt: Date
  expiresAt: Date
  userEmail?: string
  userId?: string
  userName?: string
  // "recharge" credita saldo ao confirmar; "purchase" entrega os cartões.
  purpose: "recharge" | "purchase"
  credited?: boolean
  delivered?: boolean
  // true quando os cartões reservados já foram devolvidos ao estoque
  // (após expirar/cancelar). Evita devolução dupla.
  restored?: boolean
  reservedCards: Product[]
  couponCode?: string
  items: Array<{
    level: string
    brand: string
    quantity: number
    price: number
  }>
}

export interface AdminAccount {
  email: string
  password: string
}

export interface Cupom {
  id: string
  code: string
  discount: number
  type: "percent" | "fixed"
  uses: number
  maxUses: number | null
  status: "ativo" | "expirado" | "desativado"
  expiry: string | null
  createdAt: string
}

// ---- Tipos de entrada de repositórios ----

export interface CreateUserInput {
  name: string
  email: string
  password?: string
}

export interface CreateOrderInput {
  userId: string
  userName?: string
  product: string
  level?: string
  brand?: string
  total?: number
  cardData?: Order["cardData"]
}

export interface ListOrdersFilter {
  userId?: string | null
  email?: string | null
}
